const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "ready", "collected", "cancelled", "expired"],
      default: "pending",
      index: true,
    },

    reservedAt: {
      type: Date,
      default: Date.now,
    },

    /*
     * Pickup deadline.
     *
     * Used when the reservation becomes READY.
     *
     * The student gets 2 days to collect the book.
     */
    expiresAt: {
      type: Date,
      default: null,
    },

    /*
     * ============================================================
     * CLAIM BATCH INFORMATION
     * ============================================================
     *
     * When a physical copy becomes available, eligible students
     * can be placed into a temporary claim batch.
     */

    claimBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReservationClaimBatch",
      default: null,
      index: true,
    },

    claimWindowStartedAt: {
      type: Date,
      default: null,
    },

    claimWindowExpiresAt: {
      type: Date,
      default: null,
    },

    /*
     * Time at which this student successfully claimed
     * the physical copy.
     */
    claimedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * ============================================================
 * ACTIVE RESERVATION PROTECTION
 * ============================================================
 *
 * A student may have only ONE active reservation for
 * the same book.
 *
 * Active statuses:
 *
 * pending
 * ready
 *
 * Historical reservations such as:
 *
 * collected
 * cancelled
 * expired
 *
 * are allowed to remain in the database.
 *
 * This preserves reservation history.
 */
reservationSchema.index(
  {
    student: 1,
    book: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: ["pending", "ready"],
      },
    },
  },
);

/*
 * ============================================================
 * BOOK RESERVATION QUEUE
 * ============================================================
 *
 * Oldest reservation comes first.
 */
reservationSchema.index({
  book: 1,
  status: 1,
  reservedAt: 1,
});

/*
 * ============================================================
 * CLAIM BATCH LOOKUP
 * ============================================================
 */
reservationSchema.index({
  claimBatchId: 1,
  status: 1,
});

module.exports = mongoose.model("Reservation", reservationSchema);
