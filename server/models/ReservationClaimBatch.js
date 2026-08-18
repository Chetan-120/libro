const mongoose = require("mongoose");

const reservationClaimBatchSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    /*
     * The physical copy being offered to this batch.
     */
    physicalCopy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhysicalCopy",
      default: null,
    },

    /*
     * Maximum number of students in one claim round.
     */
    batchSize: {
      type: Number,
      default: 5,
    },

    reservations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reservation",
      },
    ],

    status: {
      type: String,
      enum: ["active", "claimed", "expired", "completed"],
      default: "active",
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    claimedReservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
    },

    claimedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

reservationClaimBatchSchema.index({
  book: 1,
  status: 1,
  expiresAt: 1,
});

module.exports = mongoose.model(
  "ReservationClaimBatch",
  reservationClaimBatchSchema,
);
