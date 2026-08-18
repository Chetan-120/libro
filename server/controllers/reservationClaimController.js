const Reservation = require("../models/Reservation");
const ReservationClaimBatch = require("../models/ReservationClaimBatch");
const Book = require("../models/Book");
const PhysicalCopy = require("../models/PhysicalCopy");

const { createNotification } = require("../utils/notificationHelper");

/*
 * ============================================================
 * CLAIM BATCH CONFIGURATION
 * ============================================================
 */

const CLAIM_BATCH_SIZE = 5;
const CLAIM_WINDOW_MINUTES = 30;

/*
 * ============================================================
 * SYNCHRONIZE BOOK INVENTORY
 * ============================================================
 *
 * PhysicalCopy records are the source of truth.
 *
 * Book counters are calculated from actual physical copies.
 */

const syncBookInventory = async (bookId) => {
  const totalCopies = await PhysicalCopy.countDocuments({
    book: bookId,
  });

  const availableCopies = await PhysicalCopy.countDocuments({
    book: bookId,
    status: "available",
  });

  const reservedCopies = await PhysicalCopy.countDocuments({
    book: bookId,
    status: "reserved",
  });

  return Book.findByIdAndUpdate(
    bookId,
    {
      $set: {
        totalCopies,
        availableCopies,
        reservedCopies,
      },
    },
    {
      returnDocument: "after",
    },
  );
};

/*
 * ============================================================
 * CREATE AUTOMATIC CLAIM BATCH
 * ============================================================
 *
 * Internal service used by:
 *
 * - Reservation system
 * - Physical-copy release
 * - Reservation expiry
 * - Claim completion
 *
 * Flow:
 *
 * Available physical copy
 *        ↓
 * Check active batch
 *        ↓
 * Find oldest pending reservations
 *        ↓
 * Maximum 5 students
 *        ↓
 * Start 30-minute claim window
 *        ↓
 * Attach reservations to batch
 */

const createAutomaticClaimBatch = async ({ bookId, physicalCopyId = null }) => {
  const book = await Book.findById(bookId);

  if (!book) {
    throw new Error("Book not found.");
  }

  /*
   * Do not create another active batch
   * for the same book.
   */

  const activeBatch = await ReservationClaimBatch.findOne({
    book: bookId,
    status: "active",
    expiresAt: {
      $gt: new Date(),
    },
  });

  if (activeBatch) {
    return activeBatch;
  }

  /*
   * Find the physical copy assigned to this batch.
   */

  let physicalCopy = null;

  if (physicalCopyId) {
    physicalCopy = await PhysicalCopy.findOne({
      _id: physicalCopyId,
      book: bookId,
      status: "available",
    });
  } else {
    physicalCopy = await PhysicalCopy.findOne({
      book: bookId,
      status: "available",
    }).sort({
      createdAt: 1,
      copyNumber: 1,
    });
  }

  if (!physicalCopy) {
    return null;
  }

  /*
   * Find the oldest pending reservations.
   *
   * FIFO queue.
   */

  const reservations = await Reservation.find({
    book: bookId,
    status: "pending",
  })
    .sort({
      reservedAt: 1,
      createdAt: 1,
    })
    .limit(CLAIM_BATCH_SIZE);

  if (reservations.length === 0) {
    return null;
  }

  const startedAt = new Date();

  const expiresAt = new Date(
    startedAt.getTime() + CLAIM_WINDOW_MINUTES * 60 * 1000,
  );

  /*
   * Create claim batch.
   */

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
   * Attach claim-window information
   * to participating reservations.
   */

  await Reservation.updateMany(
    {
      _id: {
        $in: reservations.map((reservation) => reservation._id),
      },
      status: "pending",
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

  return ReservationClaimBatch.findById(batch._id)
    .populate(
      "reservations",
      "student book status reservedAt claimWindowStartedAt claimWindowExpiresAt",
    )
    .populate("physicalCopy", "barcode status book copyNumber");
};

/*
 * ============================================================
 * CREATE CLAIM BATCH — LIBRARIAN
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

    const batch = await createAutomaticClaimBatch({
      bookId,
      physicalCopyId,
    });

    if (!batch) {
      const book = await Book.findById(bookId);

      if (!book) {
        return res.status(404).json({
          success: false,
          message: "Book not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "No claim batch was created because there is no available physical copy or no pending reservation.",
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
 * Student wins the claim:
 *
 * Reservation:
 * PENDING → READY
 *
 * PhysicalCopy:
 * AVAILABLE → RESERVED
 *
 * Book inventory:
 * synchronized from PhysicalCopy
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

    /*
     * Find reservation.
     */

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
    }

    /*
     * Only the reservation owner can claim.
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
     * Find active claim batch.
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
     * Verify reservation is actually
     * part of this batch.
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
     * ========================================================
     * ATOMIC WINNER SELECTION
     * ========================================================
     *
     * Only the first successful request
     * can claim the batch.
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
        returnDocument: "after",
      },
    );

    if (!claimedBatch) {
      return res.status(409).json({
        success: false,
        message: "Another student has already claimed this physical copy.",
      });
    }

    /*
     * Find the exact physical copy
     * assigned to this batch.
     */

    const physicalCopy = claimedBatch.physicalCopy
      ? await PhysicalCopy.findOne({
          _id: claimedBatch.physicalCopy,
          book: reservation.book,
          status: "available",
        })
      : null;

    if (!physicalCopy) {
      /*
       * Roll back the claim if the
       * physical copy disappeared.
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
     * ========================================================
     * RESERVE EXACT PHYSICAL COPY
     * ========================================================
     */

    physicalCopy.status = "reserved";

    physicalCopy.reservedFor = reservation.student;

    physicalCopy.issuedTo = null;

    await physicalCopy.save();

    /*
     * Synchronize book inventory from
     * actual PhysicalCopy records.
     */

    await syncBookInventory(reservation.book);

    /*
     * ========================================================
     * RESERVATION → READY
     * ========================================================
     *
     * Student receives two days to
     * collect the physical book.
     */

    const pickupDeadline = new Date();

    pickupDeadline.setDate(pickupDeadline.getDate() + 2);

    reservation.status = "ready";

    reservation.claimedAt = new Date();

    reservation.expiresAt = pickupDeadline;

    /*
     * Claim-window fields are no longer
     * needed after successful claim.
     */

    reservation.claimWindowStartedAt = null;

    reservation.claimWindowExpiresAt = null;

    await reservation.save();

    /*
     * ========================================================
     * REMOVE OTHER STUDENTS FROM THIS BATCH
     * ========================================================
     *
     * They remain pending and can participate
     * in a future batch.
     */

    await Reservation.updateMany(
      {
        _id: {
          $in: claimedBatch.reservations,
          $ne: reservation._id,
        },
        status: "pending",
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
     * The batch has now been successfully claimed.
     */

    claimedBatch.status = "completed";

    await claimedBatch.save();

    /*
     * ========================================================
     * POPULATE FINAL RESERVATION
     * ========================================================
     */

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate("student", "name email studentId")
      .populate("book", "title author category coverImage isbn");

    /*
     * ========================================================
     * READY FOR PICKUP NOTIFICATION
     * ========================================================
     */

    await createNotification({
      recipient: populatedReservation.student._id,

      title: "Ready for pickup",

      message: `${populatedReservation.book.title} is ready for pickup. Please collect it within 2 days.`,

      category: "reservation",

      relatedBook: populatedReservation.book._id,

      relatedReservation: populatedReservation._id,
    });

    /*
     * ========================================================
     * CHECK FOR ANOTHER AVAILABLE COPY
     * ========================================================
     *
     * If the book has more available physical copies
     * and pending reservations remain, create another
     * claim batch.
     */

    const remainingPhysicalCopy = await PhysicalCopy.findOne({
      book: reservation.book,
      status: "available",
    }).sort({
      createdAt: 1,
      copyNumber: 1,
    });

    if (remainingPhysicalCopy) {
      await createAutomaticClaimBatch({
        bookId: reservation.book,
        physicalCopyId: remainingPhysicalCopy._id,
      });
    }

    /*
     * ========================================================
     * RESPONSE
     * ========================================================
     */

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
 * EXPORTS
 * ============================================================
 */

module.exports = {
  createAutomaticClaimBatch,
  createClaimBatch,
  claimReservation,
};
