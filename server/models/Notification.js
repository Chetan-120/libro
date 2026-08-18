const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "reservation",
        "due",
        "overdue",
        "announcement",
      ],
      required: true,
    },

    isUnread: {
      type: Boolean,
      default: true,
    },

    relatedBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      default: null,
    },

    relatedReservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
    },

    relatedCirculation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Circulation",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipient: 1,
  isUnread: 1,
});

module.exports = mongoose.model(
  "Notification",
  notificationSchema,
);