const mongoose = require("mongoose");

const circulationSchema = new mongoose.Schema(
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

    physicalCopy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhysicalCopy",
      default: null,
    },

    type: {
      type: String,
      enum: ["Issue", "Return", "Renew"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Completed", "Pending"],
      default: "Completed",
    },

    issuedAt: {
      type: Date,
      default: null,
    },

    returnedAt: {
      type: Date,
      default: null,
    },

    returnRequested: {
      type: Boolean,
      default: false,
    },

    returnRequestedAt: {
      type: Date,
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    renewalCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
     * Extra Loan
     *
     * Normal students are limited to 5 active books.
     * A librarian can issue an additional book when necessary.
     *
     * isExtraLoan identifies that transaction.
     * extraLoanReason stores why the librarian allowed it.
     */
    isExtraLoan: {
      type: Boolean,
      default: false,
    },

    extraLoanReason: {
      type: String,
      trim: true,
      default: null,
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

circulationSchema.index({
  student: 1,
  book: 1,
});

circulationSchema.index({
  createdAt: -1,
});

module.exports = mongoose.model("Circulation", circulationSchema);
