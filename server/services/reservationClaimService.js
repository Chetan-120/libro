const Reservation = require("../models/Reservation");
const ReservationClaimBatch = require("../models/ReservationClaimBatch");
const Book = require("../models/Book");
const PhysicalCopy = require("../models/PhysicalCopy");

const { createNotification } = require("../utils/notificationHelper");

const CLAIM_BATCH_SIZE = 5;
const CLAIM_WINDOW_MINUTES = 30;

/*
 * ============================================================
 * CREATE AUTOMATIC CLAIM BATCH
 * ============================================================
 *
 * A claim batch belongs to ONE physical copy.
 *
 * Maximum students:
 * 5
 *
 * Claim window:
 * 30 minutes
 *
 * Flow:
 *
 * AVAILABLE physical copy
 *        ↓
 * Up to 5 pending reservations
 *        ↓
 * ACTIVE claim batch
 *        ↓
 * First student to claim wins
 */

const createAutomaticClaimBatch = async ({ bookId, physicalCopyId = null }) => {
  const book = await Book.findById(bookId);

  if (!book) {
    throw new Error("Book not found.");
  }

  /*
   * ----------------------------------------------------------
   * SELECT PHYSICAL COPY
   * ----------------------------------------------------------
   */

  let physicalCopy;

  if (physicalCopyId) {
    physicalCopy = await PhysicalCopy.findOne({
      _id: physicalCopyId,
      book: bookId,
      status: "available",
    });

    if (!physicalCopy) {
      return null;
    }
  } else {
    /*
     * Find available copies that are NOT already being
     * used by an active claim batch.
     */

    const activeBatches = await ReservationClaimBatch.find({
      book: bookId,
      status: "active",
      expiresAt: {
        $gt: new Date(),
      },
      physicalCopy: {
        $ne: null,
      },
    })
      .select("physicalCopy")
      .lean();

    const occupiedCopyIds = activeBatches
      .map((batch) => batch.physicalCopy)
      .filter(Boolean);

    const copyFilter = {
      book: bookId,
      status: "available",
    };

    if (occupiedCopyIds.length > 0) {
      copyFilter._id = {
        $nin: occupiedCopyIds,
      };
    }

    physicalCopy = await PhysicalCopy.findOne(copyFilter).sort({
      createdAt: 1,
      copyNumber: 1,
    });

    if (!physicalCopy) {
      return null;
    }
  }

  /*
   * ----------------------------------------------------------
   * PREVENT DUPLICATE ACTIVE BATCH
   * ----------------------------------------------------------
   *
   * Only one active batch may exist for the SAME physical
   * copy.
   */

  const existingBatch = await ReservationClaimBatch.findOne({
    physicalCopy: physicalCopy._id,
    status: "active",
    expiresAt: {
      $gt: new Date(),
    },
  });

  if (existingBatch) {
    return existingBatch;
  }

  /*
   * ----------------------------------------------------------
   * FIND PENDING RESERVATIONS
   * ----------------------------------------------------------
   *
   * FIFO:
   * oldest reservation first.
   */

  const reservations = await Reservation.find({
    book: bookId,
    status: "pending",
    $or: [
      {
        claimBatchId: null,
      },
      {
        claimBatchId: {
          $exists: false,
        },
      },
    ],
  })
    .sort({
      reservedAt: 1,
      createdAt: 1,
    })
    .limit(CLAIM_BATCH_SIZE);

  if (reservations.length === 0) {
    return null;
  }

  /*
   * ----------------------------------------------------------
   * CREATE 30-MINUTE CLAIM WINDOW
   * ----------------------------------------------------------
   */

  const startedAt = new Date();

  const expiresAt = new Date(
    startedAt.getTime() + CLAIM_WINDOW_MINUTES * 60 * 1000,
  );

  const batch = await ReservationClaimBatch.create({
    book: bookId,
    physicalCopy: physicalCopy._id,
    batchSize: CLAIM_BATCH_SIZE,
    reservations: reservations.map((reservation) => reservation._id),
    status: "active",
    startedAt,
    expiresAt,
  });

  /*
   * ----------------------------------------------------------
   * ATTACH RESERVATIONS TO BATCH
   * ----------------------------------------------------------
   */

  await Reservation.updateMany(
    {
      _id: {
        $in: reservations.map((reservation) => reservation._id),
      },
    },
    {
      $set: {
        claimBatchId: batch._id,
        claimWindowStartedAt: startedAt,
        claimWindowExpiresAt: expiresAt,
        claimedAt: null,
      },
    },
  );

  /*
   * ----------------------------------------------------------
   * RETURN POPULATED BATCH
   * ----------------------------------------------------------
   */

  return ReservationClaimBatch.findById(batch._id)
    .populate(
      "reservations",
      "student book status reservedAt claimWindowStartedAt claimWindowExpiresAt",
    )
    .populate("physicalCopy", "book copyNumber barcode status condition");
};

/*
 * ============================================================
 * CREATE CLAIM BATCH — LIBRARIAN/API CONTROLLER
 * ============================================================
 */

const createClaimBatch = async (req, res) => {
  try {
    const { bookId, physicalCopyId } = req.body;

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
     * If a specific copy was supplied, verify it.
     */

    if (physicalCopyId) {
      const physicalCopy = await PhysicalCopy.findOne({
        _id: physicalCopyId,
        book: bookId,
        status: "available",
      });

      if (!physicalCopy) {
        return res.status(409).json({
          success: false,
          message: "The selected physical copy is not available.",
        });
      }
    }

    const batch = await createAutomaticClaimBatch({
      bookId,
      physicalCopyId,
    });

    if (!batch) {
      return res.status(200).json({
        success: true,
        message:
          "No claim batch was created because no eligible physical copy or pending reservation was found.",
        batch: null,
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Claim batch created successfully. The 30-minute claim window has started.",
      batch,
    });
  } catch (error) {
    console.error("Create claim batch error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create claim batch.",
    });
  }
};

/*
 * ============================================================
 * CLAIM RESERVATION
 * ============================================================
 *
 * Student:
 *
 * PENDING
 *    ↓
 * CLAIM
 *    ↓
 * READY
 *
 * PhysicalCopy:
 *
 * AVAILABLE
 *    ↓
 * RESERVED
 */

const claimReservation = async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: "Reservation ID is required.",
      });
    }

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    /*
     * Only the reservation owner can claim it.
     */

    if (reservation.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot claim this reservation.",
      });
    }

    /*
     * Only pending reservations can claim.
     */

    if (reservation.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only a pending reservation can claim a physical copy.",
      });
    }

    /*
     * Reservation must belong to a batch.
     */

    if (!reservation.claimBatchId) {
      return res.status(400).json({
        success: false,
        message: "This reservation is not currently in a claim batch.",
      });
    }

    /*
     * Find active batch.
     */

    const batch = await ReservationClaimBatch.findOne({
      _id: reservation.claimBatchId,
      status: "active",
      expiresAt: {
        $gt: new Date(),
      },
    });

    if (!batch) {
      return res.status(400).json({
        success: false,
        message: "This claim batch is no longer active.",
      });
    }

    /*
     * Verify membership.
     */

    const reservationIsInBatch = batch.reservations.some(
      (id) => id.toString() === reservation._id.toString(),
    );

    if (!reservationIsInBatch) {
      return res.status(403).json({
        success: false,
        message: "This reservation is not part of this claim batch.",
      });
    }

    /*
     * --------------------------------------------------------
     * ATOMIC WINNER SELECTION
     * --------------------------------------------------------
     *
     * Only the first successful request wins.
     */

    const claimedBatch = await ReservationClaimBatch.findOneAndUpdate(
      {
        _id: batch._id,
        status: "active",
        expiresAt: {
          $gt: new Date(),
        },
        claimedReservation: null,
      },
      {
        $set: {
          status: "claimed",
          claimedReservation: reservation._id,
          claimedAt: new Date(),
        },
      },
      {
        new: true,
      },
    );

    if (!claimedBatch) {
      return res.status(409).json({
        success: false,
        message: "Another student has already claimed this physical copy.",
      });
    }

    /*
     * --------------------------------------------------------
     * EXACT PHYSICAL COPY
     * --------------------------------------------------------
     */

    const physicalCopy = await PhysicalCopy.findOne({
      _id: claimedBatch.physicalCopy,
      book: reservation.book,
      status: "available",
    });

    if (!physicalCopy) {
      /*
       * Roll the batch back.
       */

      await ReservationClaimBatch.findByIdAndUpdate(claimedBatch._id, {
        $set: {
          status: "active",
          claimedReservation: null,
          claimedAt: null,
        },
      });

      return res.status(409).json({
        success: false,
        message: "The physical copy is no longer available.",
      });
    }

    /*
     * --------------------------------------------------------
     * BOOK INVENTORY
     * --------------------------------------------------------
     */

    const updatedBook = await Book.findOneAndUpdate(
      {
        _id: reservation.book,
        availableCopies: {
          $gt: 0,
        },
      },
      {
        $inc: {
          availableCopies: -1,
          reservedCopies: 1,
        },
      },
      {
        new: true,
      },
    );

    if (!updatedBook) {
      await ReservationClaimBatch.findByIdAndUpdate(claimedBatch._id, {
        $set: {
          status: "active",
          claimedReservation: null,
          claimedAt: null,
        },
      });

      return res.status(409).json({
        success: false,
        message: "No available copy remains for this claim.",
      });
    }

    /*
     * --------------------------------------------------------
     * PHYSICAL COPY
     * --------------------------------------------------------
     */

    physicalCopy.status = "reserved";

    physicalCopy.reservedFor = reservation.student;

    physicalCopy.issuedTo = null;

    await physicalCopy.save();

    /*
     * --------------------------------------------------------
     * RESERVATION
     * --------------------------------------------------------
     */

    const claimedAt = new Date();

    const pickupDeadline = new Date(
      claimedAt.getTime() + 2 * 24 * 60 * 60 * 1000,
    );

    reservation.status = "ready";

    reservation.claimedAt = claimedAt;

    reservation.expiresAt = pickupDeadline;

    /*
     * The reservation no longer needs its
     * claim-window information after winning.
     */

    reservation.claimWindowStartedAt = null;

    reservation.claimWindowExpiresAt = null;

    await reservation.save();

    /*
     * --------------------------------------------------------
     * OTHER STUDENTS
     * --------------------------------------------------------
     *
     * They remain pending and can participate
     * in another batch.
     */

    await Reservation.updateMany(
      {
        _id: {
          $in: claimedBatch.reservations,
          $ne: reservation._id,
        },
      },
      {
        $set: {
          claimBatchId: null,
          claimWindowStartedAt: null,
          claimWindowExpiresAt: null,
          claimedAt: null,
        },
      },
    );

    /*
     * --------------------------------------------------------
     * NOTIFICATION
     * --------------------------------------------------------
     */

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate("student", "name email studentId")
      .populate("book", "title author category coverImage isbn");

    await createNotification({
      recipient: populatedReservation.student._id,
      title: "Ready for pickup",
      message: `${populatedReservation.book.title} is ready for pickup. Please collect it within 2 days.`,
      category: "reservation",
      relatedBook: populatedReservation.book._id,
      relatedReservation: populatedReservation._id,
    });

    /*
     * --------------------------------------------------------
     * START ANOTHER BATCH IF ANOTHER COPY IS AVAILABLE
     * --------------------------------------------------------
     */

    const nextAvailableCopy = await PhysicalCopy.findOne({
      book: reservation.book,
      status: "available",
    }).sort({
      createdAt: 1,
      copyNumber: 1,
    });

    if (nextAvailableCopy) {
      await createAutomaticClaimBatch({
        bookId: reservation.book,
        physicalCopyId: nextAvailableCopy._id,
      });
    }

    return res.json({
      success: true,
      message:
        "Physical copy claimed successfully. Your reservation is ready for pickup.",
      reservation: populatedReservation,
      batch: claimedBatch,
      physicalCopy,
    });
  } catch (error) {
    console.error("Claim reservation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to claim the physical copy.",
    });
  }
};

/*
 * ============================================================
 * EXPIRE CLAIM BATCHES
 * ============================================================
 *
 * Runs every minute from server.js.
 *
 * ACTIVE batch
 *      ↓
 * 30 minutes passed
 *      ↓
 * EXPIRED
 *      ↓
 * Reservations return to normal PENDING state
 *      ↓
 * Physical copy remains AVAILABLE
 *      ↓
 * New batch can be created
 */

const expireClaimBatches = async () => {
  try {
    const now = new Date();

    const expiredBatches = await ReservationClaimBatch.find({
      status: "active",
      expiresAt: {
        $lte: now,
      },
    }).lean();

    for (const expiredBatch of expiredBatches) {
      const batch = await ReservationClaimBatch.findOne({
        _id: expiredBatch._id,
        status: "active",
      });

      if (!batch) {
        continue;
      }

      /*
       * Mark batch expired.
       */

      batch.status = "expired";

      await batch.save();

      /*
       * Return all students in the expired
       * batch to normal pending state.
       */

      await Reservation.updateMany(
        {
          _id: {
            $in: batch.reservations,
          },
          status: "pending",
          claimBatchId: batch._id,
        },
        {
          $set: {
            claimBatchId: null,
            claimWindowStartedAt: null,
            claimWindowExpiresAt: null,
            claimedAt: null,
          },
        },
      );

      /*
       * The physical copy was never reserved.
       *
       * It therefore remains AVAILABLE.
       *
       * Start a fresh batch for it.
       */

      if (batch.physicalCopy) {
        const physicalCopy = await PhysicalCopy.findOne({
          _id: batch.physicalCopy,
          book: batch.book,
          status: "available",
        });

        if (physicalCopy) {
          await createAutomaticClaimBatch({
            bookId: batch.book,
            physicalCopyId: physicalCopy._id,
          });
        }
      }
    }

    if (expiredBatches.length > 0) {
      console.log(
        `Claim batch expiry check: ${expiredBatches.length} batch(es) processed.`,
      );
    }
  } catch (error) {
    console.error("Expire claim batches error:", error);
  }
};

module.exports = {
  createAutomaticClaimBatch,
  createClaimBatch,
  claimReservation,
  expireClaimBatches,
};
