const mongoose = require("mongoose");

const fineSchema = new mongoose.Schema(
  {
    circulation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Circulation",
      required: true,
      unique: true,
    },

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

    reason: {
      type: String,
      enum: ["Late return"],
      default: "Late return",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    overdueDays: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },

    issuedAt: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    returnedAt: {
      type: Date,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

fineSchema.index({
  student: 1,
  status: 1,
});

fineSchema.index({
  createdAt: -1,
});

module.exports = mongoose.model("Fine", fineSchema);
