const Reservation = require("../models/Reservation");
const Book = require("../models/Book");
const PhysicalCopy = require("../models/PhysicalCopy");
const ReservationClaimBatch = require("../models/ReservationClaimBatch");

const {
  createAutomaticClaimBatch,
} = require("../services/reservationClaimService");

const { createNotification } = require("../utils/notificationHelper");

/*
 * ============================================================
 * CREATE RESERVATION
 * ============================================================
 */

const createReservation = async (req, res) => {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Book ID is required.",
      });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found.",
      });
    }

    /*
     * A student cannot reserve a book that they
     * currently have issued.
     */

    const Circulation = require("../models/Circulation");

    const activeLoan = await Circulation.findOne({
      student: req.user._id,
      book: bookId,
      type: "Issue",
      status: "Completed",
      returnedAt: null,
    });

    if (activeLoan) {
      return res.status(409).json({
        success: false,
        message:
          "You already have this book issued. Return it before reserving the same book again.",
      });
    }

    /*
     * A student cannot have multiple active
     * reservations for the same book.
     */

    const existingReservation = await Reservation.findOne({
      student: req.user._id,
      book: bookId,
      status: {
        $in: ["pending", "ready"],
      },
    });

    if (existingReservation) {
      return res.status(409).json({
        success: false,
        message: "You already have an active reservation for this book.",
      });
    }

    /*
     * --------------------------------------------------------
     * IMPORTANT
     * --------------------------------------------------------
     *
     * Reserving does NOT consume inventory.
     *
     * Every reservation starts as PENDING.
     *
     * The physical copy is consumed only when a student
     * successfully wins a claim batch.
     */

    const reservation = await Reservation.create({
      student: req.user._id,
      book: bookId,
      status: "pending",
      expiresAt: null,
      claimBatchId: null,
      claimWindowStartedAt: null,
      claimWindowExpiresAt: null,
      claimedAt: null,
    });

    /*
     * --------------------------------------------------------
     * START CLAIM BATCH IF A PHYSICAL COPY IS AVAILABLE
     * --------------------------------------------------------
     */

    if (book.availableCopies > 0) {
      const availablePhysicalCopy = await PhysicalCopy.findOne({
        book: bookId,
        status: "available",
      }).sort({
        createdAt: 1,
        copyNumber: 1,
      });

      if (availablePhysicalCopy) {
        await createAutomaticClaimBatch({
          bookId,
          physicalCopyId: availablePhysicalCopy._id,
        });
      }
    }

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate("book", "title author category coverImage isbn")
      .populate("student", "name email studentId");

    return res.status(201).json({
      success: true,
      message:
        "Book reserved successfully. You have joined the reservation queue.",
      reservation: populatedReservation,
    });
  } catch (error) {
    console.error("Create reservation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create reservation.",
    });
  }
};

/*
 * ============================================================
 * GET RESERVATION FOR A BOOK
 * ============================================================
 */

const getBookReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      student: req.user._id,
      book: req.params.bookId,
      status: {
        $in: ["pending", "ready"],
      },
    }).lean();

    if (!reservation) {
      return res.json({
        success: true,
        reserved: false,
        reservation: null,
      });
    }

    const queueReservations = await Reservation.find({
      book: req.params.bookId,
      status: "pending",
    })
      .sort({
        reservedAt: 1,
        createdAt: 1,
      })
      .select("_id student status reservedAt createdAt")
      .lean();

    const queuePosition =
      reservation.status === "pending"
        ? queueReservations.findIndex(
            (item) => item._id.toString() === reservation._id.toString(),
          ) + 1
        : null;

    return res.json({
      success: true,
      reserved: true,
      reservation: {
        ...reservation,
        position: queuePosition,
      },
    });
  } catch (error) {
    console.error("Get book reservation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check reservation status.",
    });
  }
};

/*
 * ============================================================
 * GET MY RESERVATIONS
 * ============================================================
 */

const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({
      student: req.user._id,
    })
      .populate("book", "title author category coverImage isbn")
      .sort({
        createdAt: -1,
      })
      .lean();

    const activeReservations = reservations.filter(
      (reservation) =>
        reservation.status === "pending" || reservation.status === "ready",
    );

    const bookIds = [
      ...new Set(
        activeReservations
          .map((reservation) => reservation.book?._id?.toString())
          .filter(Boolean),
      ),
    ];

    const queueReservations =
      bookIds.length > 0
        ? await Reservation.find({
            book: {
              $in: bookIds,
            },
            status: "pending",
          })
            .sort({
              reservedAt: 1,
              createdAt: 1,
            })
            .select("_id book student status reservedAt createdAt")
            .lean()
        : [];

    const queuePositions = new Map();

    for (const reservation of queueReservations) {
      const bookId = reservation.book.toString();

      if (!queuePositions.has(bookId)) {
        queuePositions.set(bookId, []);
      }

      queuePositions.get(bookId).push(reservation._id.toString());
    }

    const reservationsWithPosition = reservations.map((reservation) => {
      if (reservation.status !== "pending") {
        return {
          ...reservation,
          position: null,
        };
      }

      const bookId = reservation.book?._id?.toString();

      const queue = queuePositions.get(bookId) || [];

      const position = queue.indexOf(reservation._id.toString()) + 1;

      return {
        ...reservation,
        position: position > 0 ? position : null,
      };
    });

    return res.json({
      success: true,
      reservations: reservationsWithPosition,
    });
  } catch (error) {
    console.error("Get reservations error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load reservations.",
    });
  }
};

/*
 * ============================================================
 * CANCEL RESERVATION
 * ============================================================
 */

const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      student: req.user._id,
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    if (!["pending", "ready"].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: "This reservation cannot be cancelled.",
      });
    }

    const bookId = reservation.book;

    const previousStatus = reservation.status;

    /*
     * --------------------------------------------------------
     * PENDING CANCELLATION
     * --------------------------------------------------------
     */

    if (previousStatus === "pending") {
      /*
       * --------------------------------------------------------
       * REMOVE RESERVATION FROM ACTIVE CLAIM BATCH
       * --------------------------------------------------------
       */

      if (reservation.claimBatchId) {
        const batch = await ReservationClaimBatch.findOne({
          _id: reservation.claimBatchId,
          status: "active",
        });

        if (batch) {
          batch.reservations = batch.reservations.filter(
            (id) => id.toString() !== reservation._id.toString(),
          );

          /*
           * If other students remain in the batch,
           * keep the batch active.
           */

          if (batch.reservations.length > 0) {
            await batch.save();
          } else {
            /*
             * No students remain.
             *
             * Close the empty batch.
             */

            const physicalCopyId = batch.physicalCopy;

            batch.status = "expired";

            await batch.save();

            /*
             * The physical copy is still available.
             *
             * Give the next eligible students a new
             * claim opportunity.
             */

            if (physicalCopyId) {
              const physicalCopy = await PhysicalCopy.findOne({
                _id: physicalCopyId,
                book: bookId,
                status: "available",
              });

              if (physicalCopy) {
                await createAutomaticClaimBatch({
                  bookId,
                  physicalCopyId: physicalCopy._id,
                });
              }
            }
          }
        }
      }

      /*
       * Cancel the student's reservation.
       */

      reservation.status = "cancelled";

      reservation.expiresAt = null;
      reservation.claimBatchId = null;
      reservation.claimWindowStartedAt = null;
      reservation.claimWindowExpiresAt = null;
      reservation.claimedAt = null;

      await reservation.save();

      return res.json({
        success: true,
        message: "Reservation cancelled successfully.",
        reservation,
      });
    }

    /*
     * --------------------------------------------------------
     * READY CANCELLATION
     * --------------------------------------------------------
     *
     * READY means:
     *
     * PhysicalCopy = RESERVED
     *
     * Book:
     * availableCopies - 1
     * reservedCopies + 1
     */

    if (previousStatus === "ready") {
      /*
       * Find the exact physical copy
       * reserved for this student.
       */

      const physicalCopy = await PhysicalCopy.findOne({
        book: bookId,
        reservedFor: reservation.student,
        status: "reserved",
      });

      if (!physicalCopy) {
        return res.status(409).json({
          success: false,
          message: "The reserved physical copy could not be found.",
        });
      }

      /*
       * Release EXACT physical copy.
       *
       * RESERVED → AVAILABLE
       */

      physicalCopy.status = "available";

      physicalCopy.reservedFor = null;

      physicalCopy.issuedTo = null;

      await physicalCopy.save();

      /*
       * Update aggregate inventory.
       */

      const releasedBook = await Book.findOneAndUpdate(
        {
          _id: bookId,
          reservedCopies: {
            $gt: 0,
          },
        },
        {
          $inc: {
            reservedCopies: -1,
            availableCopies: 1,
          },
        },
        {
          new: true,
        },
      );

      if (!releasedBook) {
        /*
         * Roll physical copy back if
         * aggregate inventory cannot be
         * updated.
         */

        physicalCopy.status = "reserved";

        physicalCopy.reservedFor = reservation.student;

        await physicalCopy.save();

        return res.status(409).json({
          success: false,
          message: "Unable to release the reserved copy.",
        });
      }

      /*
       * Close the old claim batch if one
       * exists.
       */

      if (reservation.claimBatchId) {
        await ReservationClaimBatch.findByIdAndUpdate(
          reservation.claimBatchId,
          {
            $set: {
              status: "expired",
            },
          },
        );
      }

      /*
       * Cancel reservation.
       */

      reservation.status = "cancelled";

      reservation.expiresAt = null;

      reservation.claimBatchId = null;

      reservation.claimWindowStartedAt = null;

      reservation.claimWindowExpiresAt = null;

      reservation.claimedAt = null;

      await reservation.save();

      /*
       * IMPORTANT:
       *
       * The released copy does NOT go directly
       * to Queue #1.
       *
       * It starts a new 5-student claim window.
       */

      await createAutomaticClaimBatch({
        bookId,
        physicalCopyId: physicalCopy._id,
      });
    }

    const populatedCancelledReservation = await Reservation.findById(
      reservation._id,
    )
      .populate("student", "name email studentId")
      .populate("book", "title author category coverImage isbn");

    return res.json({
      success: true,
      message: "Reservation cancelled successfully.",
      reservation: populatedCancelledReservation,
    });
  } catch (error) {
    console.error("Cancel reservation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel reservation.",
    });
  }
};

/*
 * ============================================================
 * LIBRARIAN RESERVATIONS
 * ============================================================
 */

const getLibrarianReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("student", "name email studentId")
      .populate("book", "title author category coverImage isbn")
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.json({
      success: true,
      reservations,
    });
  } catch (error) {
    console.error("Get librarian reservations error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load reservation data.",
    });
  }
};

/*
 * ============================================================
 * UPDATE RESERVATION STATUS
 * ============================================================
 *
 * IMPORTANT:
 *
 * READY must NOT be manually assigned here.
 *
 * READY is created by:
 *
 * claimReservation()
 *
 * The librarian should issue the physical book
 * through the circulation flow.
 */

const updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["pending", "cancelled", "expired"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "This status cannot be manually assigned. READY is controlled by the claim system and COLLECTED is controlled by circulation.",
      });
    }

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    const previousStatus = reservation.status;

    /*
     * Terminal reservations cannot return
     * to the active queue.
     */

    if (
      ["collected", "cancelled", "expired"].includes(previousStatus) &&
      ["pending"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "This reservation cannot be moved back into the active queue.",
      });
    }

    /*
     * --------------------------------------------------------
     * PENDING → CANCELLED
     * --------------------------------------------------------
     */

    if (previousStatus === "pending" && status === "cancelled") {
      /*
       * --------------------------------------------------------
       * REMOVE RESERVATION FROM ACTIVE CLAIM BATCH
       * --------------------------------------------------------
       */

      if (reservation.claimBatchId) {
        const batch = await ReservationClaimBatch.findOne({
          _id: reservation.claimBatchId,
          status: "active",
        });

        if (batch) {
          batch.reservations = batch.reservations.filter(
            (id) => id.toString() !== reservation._id.toString(),
          );

          /*
           * Keep the batch active if other students
           * are still participating.
           */

          if (batch.reservations.length > 0) {
            await batch.save();
          } else {
            /*
             * Nobody remains in the claim batch.
             */

            const physicalCopyId = batch.physicalCopy;

            batch.status = "expired";

            await batch.save();

            /*
             * The physical copy is still available.
             *
             * Start another claim opportunity.
             */

            if (physicalCopyId) {
              const physicalCopy = await PhysicalCopy.findOne({
                _id: physicalCopyId,
                book: reservation.book,
                status: "available",
              });

              if (physicalCopy) {
                await createAutomaticClaimBatch({
                  bookId: reservation.book,
                  physicalCopyId: physicalCopy._id,
                });
              }
            }
          }
        }
      }

      /*
       * Cancel only this reservation.
       */

      reservation.status = "cancelled";

      reservation.claimBatchId = null;
      reservation.claimWindowStartedAt = null;
      reservation.claimWindowExpiresAt = null;
      reservation.claimedAt = null;
      reservation.expiresAt = null;

      await reservation.save();
    } else if (previousStatus === "ready" && status === "cancelled") {
      /*
       * --------------------------------------------------------
       * READY → CANCELLED
       * --------------------------------------------------------
       *
       * Same physical-copy release logic
       * as student cancellation.
       */
      const physicalCopy = await PhysicalCopy.findOne({
        book: reservation.book,
        reservedFor: reservation.student,
        status: "reserved",
      });

      if (!physicalCopy) {
        return res.status(409).json({
          success: false,
          message: "The reserved physical copy could not be found.",
        });
      }

      physicalCopy.status = "available";

      physicalCopy.reservedFor = null;

      physicalCopy.issuedTo = null;

      await physicalCopy.save();

      const releasedBook = await Book.findOneAndUpdate(
        {
          _id: reservation.book,
          reservedCopies: {
            $gt: 0,
          },
        },
        {
          $inc: {
            reservedCopies: -1,
            availableCopies: 1,
          },
        },
        {
          new: true,
        },
      );

      if (!releasedBook) {
        physicalCopy.status = "reserved";

        physicalCopy.reservedFor = reservation.student;

        await physicalCopy.save();

        return res.status(409).json({
          success: false,
          message: "Unable to release the reserved copy.",
        });
      }

      if (reservation.claimBatchId) {
        await ReservationClaimBatch.findByIdAndUpdate(
          reservation.claimBatchId,
          {
            $set: {
              status: "expired",
            },
          },
        );
      }

      reservation.status = "cancelled";

      reservation.expiresAt = null;

      reservation.claimBatchId = null;

      reservation.claimWindowStartedAt = null;

      reservation.claimWindowExpiresAt = null;

      reservation.claimedAt = null;

      await reservation.save();

      /*
       * New claim opportunity for the
       * released physical copy.
       */

      await createAutomaticClaimBatch({
        bookId: reservation.book,
        physicalCopyId: physicalCopy._id,
      });
    } else if (previousStatus === "pending" && status === "expired") {
      /*
       * --------------------------------------------------------
       * PENDING → EXPIRED
       * --------------------------------------------------------
       *
       * Expire ONLY this reservation.
       *
       * Other students in the same claim batch must
       * remain active.
       */

      if (reservation.claimBatchId) {
        const batch = await ReservationClaimBatch.findOne({
          _id: reservation.claimBatchId,
          status: "active",
        });

        if (batch) {
          batch.reservations = batch.reservations.filter(
            (id) => id.toString() !== reservation._id.toString(),
          );

          if (batch.reservations.length > 0) {
            /*
             * Other students remain in the batch.
             */

            await batch.save();
          } else {
            /*
             * No students remain.
             */

            const physicalCopyId = batch.physicalCopy;

            batch.status = "expired";

            await batch.save();

            /*
             * The physical copy remains available.
             *
             * Start a new claim opportunity.
             */

            if (physicalCopyId) {
              const physicalCopy = await PhysicalCopy.findOne({
                _id: physicalCopyId,
                book: reservation.book,
                status: "available",
              });

              if (physicalCopy) {
                await createAutomaticClaimBatch({
                  bookId: reservation.book,
                  physicalCopyId: physicalCopy._id,
                });
              }
            }
          }
        }
      }

      reservation.status = "expired";

      reservation.expiresAt = null;
      reservation.claimBatchId = null;
      reservation.claimWindowStartedAt = null;
      reservation.claimWindowExpiresAt = null;
      reservation.claimedAt = null;

      await reservation.save();
    } else if (previousStatus === "pending" && status === "pending") {
      /*
       * --------------------------------------------------------
       * PENDING → PENDING
       * --------------------------------------------------------
       */
      /*
       * Nothing to change.
       */
    } else {
      return res.status(400).json({
        success: false,
        message: `Invalid reservation transition: ${previousStatus} → ${status}.`,
      });
    }

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate("student", "name email studentId")
      .populate("book", "title author category coverImage isbn");

    return res.json({
      success: true,
      message: "Reservation status updated successfully.",
      reservation: populatedReservation,
    });
  } catch (error) {
    console.error("Update reservation status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update reservation.",
    });
  }
};

/*
 * ============================================================
 * EXPIRE READY RESERVATIONS
 * ============================================================
 *
 * READY
 *   ↓
 * pickup window expires
 *   ↓
 * PhysicalCopy RESERVED → AVAILABLE
 *   ↓
 * Book reservedCopies - 1
 * Book availableCopies + 1
 *   ↓
 * Reservation EXPIRED
 *   ↓
 * New claim batch
 */

const expireReadyReservations = async () => {
  try {
    const now = new Date();

    const expiredReservations = await Reservation.find({
      status: "ready",
      expiresAt: {
        $ne: null,
        $lte: now,
      },
    }).lean();

    for (const expiredReservation of expiredReservations) {
      const reservation = await Reservation.findById(expiredReservation._id);

      if (!reservation || reservation.status !== "ready") {
        continue;
      }

      /*
       * Find the EXACT physical copy
       * reserved for this student.
       */

      const physicalCopy = await PhysicalCopy.findOne({
        book: reservation.book,
        reservedFor: reservation.student,
        status: "reserved",
      });

      if (!physicalCopy) {
        console.error(
          `Unable to find reserved physical copy for expired reservation ${reservation._id}.`,
        );

        continue;
      }

      /*
       * RESERVED → AVAILABLE
       */

      physicalCopy.status = "available";

      physicalCopy.reservedFor = null;

      physicalCopy.issuedTo = null;

      await physicalCopy.save();

      /*
       * Update aggregate inventory.
       */

      const releasedBook = await Book.findOneAndUpdate(
        {
          _id: reservation.book,
          reservedCopies: {
            $gt: 0,
          },
        },
        {
          $inc: {
            reservedCopies: -1,
            availableCopies: 1,
          },
        },
        {
          new: true,
        },
      );

      if (!releasedBook) {
        /*
         * Roll physical copy back if
         * aggregate inventory could not
         * be updated.
         */

        physicalCopy.status = "reserved";

        physicalCopy.reservedFor = reservation.student;

        await physicalCopy.save();

        console.error(
          `Unable to release inventory for expired reservation ${reservation._id}.`,
        );

        continue;
      }

      /*
       * Save old batch before clearing
       * reservation fields.
       */

      const oldClaimBatchId = reservation.claimBatchId;

      /*
       * Reservation expires.
       */

      reservation.status = "expired";

      reservation.expiresAt = null;

      reservation.claimedAt = null;

      reservation.claimBatchId = null;

      reservation.claimWindowStartedAt = null;

      reservation.claimWindowExpiresAt = null;

      await reservation.save();

      /*
       * Old claim batch is no longer relevant.
       */

      if (oldClaimBatchId) {
        await ReservationClaimBatch.findByIdAndUpdate(oldClaimBatchId, {
          $set: {
            status: "expired",
          },
        });
      }

      /*
       * Notify the student.
       */

      await createNotification({
        recipient: reservation.student,
        title: "Reservation expired",
        message:
          "Your pickup window has expired because the reserved book was not collected within 2 days.",
        category: "reservation",
        relatedBook: reservation.book,
        relatedReservation: reservation._id,
      });

      /*
       * IMPORTANT:
       *
       * Do NOT directly make Queue #1 READY.
       *
       * The released physical copy goes through
       * the 5-student / 30-minute claim system.
       */

      await createAutomaticClaimBatch({
        bookId: reservation.book,
        physicalCopyId: physicalCopy._id,
      });
    }

    if (expiredReservations.length > 0) {
      console.log(
        `Reservation expiry check: ${expiredReservations.length} reservation(s) processed.`,
      );
    }
  } catch (error) {
    console.error("Expire ready reservations error:", error);
  }
};

module.exports = {
  createReservation,
  getBookReservation,
  getMyReservations,
  cancelReservation,
  getLibrarianReservations,
  updateReservationStatus,
  expireReadyReservations,
};
