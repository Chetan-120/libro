const PhysicalCopy = require("../models/PhysicalCopy");
const Book = require("../models/Book");

/*
 * GET ALL PHYSICAL COPIES
 *
 * Optional query parameters:
 *
 * ?bookId=BOOK_ID
 * ?status=available
 */
const getPhysicalCopies = async (req, res) => {
  try {
    const filter = {};

    if (req.query.bookId) {
      filter.book = req.query.bookId;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const copies = await PhysicalCopy.find(filter)
      .populate("book", "title author isbn category coverImage")
      .populate("issuedTo", "name email studentId")
      .populate("reservedFor", "name email studentId")
      .sort({
        createdAt: 1,
        copyNumber: 1,
      })
      .lean();

    return res.json({
      success: true,
      copies,
    });
  } catch (error) {
    console.error("Get physical copies error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load physical copies.",
    });
  }
};

/*
 * GET PHYSICAL COPY BY BARCODE / COPY NUMBER
 *
 * Example:
 *
 * GET /api/physical-copies/code/123456789
 *
 * OR
 *
 * GET /api/physical-copies/code/2
 */
const getPhysicalCopyByCode = async (req, res) => {
  try {
    const code = String(req.params.code || "").trim();

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Physical copy code is required.",
      });
    }

    const numericCopyNumber = Number(code);

    const conditions = [
      {
        barcode: code,
      },
    ];

    if (Number.isInteger(numericCopyNumber)) {
      conditions.push({
        copyNumber: numericCopyNumber,
      });
    }

    const copy = await PhysicalCopy.findOne({
      $or: conditions,
    })
      .populate("book", "title author isbn category coverImage")
      .populate("issuedTo", "name email studentId")
      .populate("reservedFor", "name email studentId")
      .lean();

    if (!copy) {
      return res.status(404).json({
        success: false,
        message: "Physical copy not found.",
      });
    }

    return res.json({
      success: true,
      copy,
    });
  } catch (error) {
    console.error("Get physical copy error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to find the physical copy.",
    });
  }
};

/*
 * SYNCHRONIZE BOOK COPY COUNTS
 *
 * Book inventory is calculated from actual
 * PhysicalCopy records.
 *
 * totalCopies:
 *     all physical copies
 *
 * availableCopies:
 *     copies with status = available
 *
 * reservedCopies:
 *     copies with status = reserved
 */
const syncBookCopyCounts = async (req, res) => {
  try {
    const books = await Book.find();

    let synchronizedBooks = 0;

    for (const book of books) {
      const totalCopies = await PhysicalCopy.countDocuments({
        book: book._id,
      });

      const availableCopies = await PhysicalCopy.countDocuments({
        book: book._id,
        status: "available",
      });

      const reservedCopies = await PhysicalCopy.countDocuments({
        book: book._id,
        status: "reserved",
      });

      book.totalCopies = totalCopies;
      book.availableCopies = availableCopies;
      book.reservedCopies = reservedCopies;

      await book.save();

      synchronizedBooks += 1;
    }

    return res.json({
      success: true,
      message: "Book copy counts synchronized successfully.",
      synchronizedBooks,
    });
  } catch (error) {
    console.error("Sync book copy counts error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to synchronize book copy counts.",
    });
  }
};

module.exports = {
  getPhysicalCopies,
  getPhysicalCopyByCode,
  syncBookCopyCounts,
};
