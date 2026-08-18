const mongoose = require("mongoose");

const physicalCopySchema = new mongoose.Schema(
  {
    /*
     * ========================================================
     * BOOK
     * ========================================================
     */

    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },

    /*
     * ========================================================
     * COPY NUMBER
     * ========================================================
     *
     * Example:
     *
     * Book: Clean Code
     *
     * Copy 1
     * Copy 2
     * Copy 3
     */

    copyNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    /*
     * ========================================================
     * BARCODE
     * ========================================================
     *
     * Physical barcode attached to the actual book.
     *
     * The librarian can use this for scanning.
     */

    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    /*
     * ========================================================
     * STATUS
     * ========================================================
     */

    status: {
      type: String,
      enum: ["available", "issued", "reserved", "maintenance", "lost"],
      default: "available",
      index: true,
    },

    /*
     * ========================================================
     * CONDITION
     * ========================================================
     */

    condition: {
      type: String,
      enum: ["good", "fair", "damaged"],
      default: "good",
    },

    /*
     * ========================================================
     * ISSUED TO
     * ========================================================
     *
     * Used only when:
     *
     * status = issued
     */

    issuedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /*
     * ========================================================
     * RESERVED FOR
     * ========================================================
     *
     * Used only when:
     *
     * status = reserved
     */

    reservedFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * ============================================================
 * UNIQUE COPY NUMBER PER BOOK
 * ============================================================
 *
 * Valid:
 *
 * Book A → Copy 1
 * Book A → Copy 2
 * Book B → Copy 1
 *
 * Invalid:
 *
 * Book A → Copy 1
 * Book A → Copy 1
 */

physicalCopySchema.index(
  {
    book: 1,
    copyNumber: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("PhysicalCopy", physicalCopySchema);
