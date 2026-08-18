const Book = require("../models/Book");
const PhysicalCopy = require("../models/PhysicalCopy");
const fs = require("fs");
const path = require("path");

/*
 * ============================================================
 * COVER IMAGE HELPER
 * ============================================================
 *
 * Download an image from a URL and save it locally.
 *
 * Returns:
 * /uploads/books/filename.jpg
 */

const downloadCoverImage = async (imageUrl) => {
  const url = new URL(imageUrl);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Cover image URL must use HTTP or HTTPS.");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 Libro-Library-App",
      Accept:
        "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unable to download cover image. Image server returned ${response.status}.`,
    );
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.startsWith("image/")) {
    throw new Error("The provided URL does not point to an image.");
  }

  const extensionMap = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
  };

  const extension = extensionMap[contentType.split(";")[0].trim()] || ".jpg";

  const uploadDirectory = path.join(__dirname, "..", "uploads", "books");

  await fs.promises.mkdir(uploadDirectory, {
    recursive: true,
  });

  const filename = `book-${Date.now()}-${Math.round(
    Math.random() * 1e9,
  )}${extension}`;

  const filePath = path.join(uploadDirectory, filename);

  const imageBuffer = Buffer.from(await response.arrayBuffer());

  await fs.promises.writeFile(filePath, imageBuffer);

  return `/uploads/books/${filename}`;
};

/*
 * ============================================================
 * PHYSICAL COPY BARCODE HELPER
 * ============================================================
 */

const createPhysicalCopyBarcode = (bookId, copyNumber) => {
  return `LIBRO-${bookId
    .toString()
    .slice(-6)
    .toUpperCase()}-${String(copyNumber).padStart(3, "0")}`;
};

/*
 * ============================================================
 * CREATE BOOK
 * ============================================================
 */

const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      category,
      description,
      publisher,
      publishedYear,
      totalCopies,
      coverImageUrl,
    } = req.body;

    if (!title || !author || !isbn || !category || !totalCopies) {
      return res.status(400).json({
        success: false,
        message: "Title, author, ISBN, category and total copies are required.",
      });
    }

    const normalizedIsbn = isbn.trim();

    const existingBook = await Book.findOne({
      isbn: normalizedIsbn,
    });

    if (existingBook) {
      return res.status(409).json({
        success: false,
        message: "A book with this ISBN already exists.",
      });
    }

    const copies = Number(totalCopies);

    if (!Number.isInteger(copies) || copies < 1) {
      return res.status(400).json({
        success: false,
        message: "Total copies must be a whole number greater than 0.",
      });
    }

    /*
     * --------------------------------------------------------
     * COVER
     * --------------------------------------------------------
     *
     * Priority:
     *
     * 1. Device upload
     * 2. Image URL
     * 3. No cover
     */

    let coverImage = "";

    if (req.file) {
      coverImage = `/uploads/books/${req.file.filename}`;
    } else if (coverImageUrl?.trim()) {
      try {
        coverImage = await downloadCoverImage(coverImageUrl.trim());
      } catch (coverError) {
        console.error("Cover download error:", coverError.message);

        return res.status(400).json({
          success: false,
          message: coverError.message || "Unable to download the cover image.",
        });
      }
    }

    /*
     * --------------------------------------------------------
     * CREATE BOOK
     * --------------------------------------------------------
     */

    const book = await Book.create({
      title: title.trim(),
      author: author.trim(),
      isbn: normalizedIsbn,
      category: category.trim(),
      description: description?.trim() || "",
      publisher: publisher?.trim() || "",
      publishedYear: publishedYear ? Number(publishedYear) : null,
      totalCopies: copies,
      availableCopies: copies,
      reservedCopies: 0,
      coverImage,
    });

    /*
     * --------------------------------------------------------
     * CREATE PHYSICAL COPIES
     * --------------------------------------------------------
     *
     * Every logical copy must have an actual PhysicalCopy
     * document.
     *
     * Example:
     *
     * totalCopies = 3
     *
     * Copy 1
     * Copy 2
     * Copy 3
     */

    try {
      const physicalCopies = Array.from({ length: copies }, (_, index) => {
        const copyNumber = index + 1;

        return {
          book: book._id,
          copyNumber,
          barcode: createPhysicalCopyBarcode(book._id, copyNumber),
          status: "available",
          condition: "good",
          issuedTo: null,
          reservedFor: null,
        };
      });

      await PhysicalCopy.insertMany(physicalCopies);
    } catch (physicalCopyError) {
      /*
       * Do not leave an incomplete Book record if
       * physical copy creation fails.
       */

      console.error("Physical copy creation error:", physicalCopyError);

      await Book.findByIdAndDelete(book._id);

      return res.status(500).json({
        success: false,
        message:
          "Book could not be created because its physical copies could not be created.",
      });
    }

    /*
     * Return the newly created book.
     */

    const createdBook = await Book.findById(book._id).lean();

    return res.status(201).json({
      success: true,
      message: "Book added successfully.",
      book: createdBook,
    });
  } catch (error) {
    console.error("Create book error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add the book.",
    });
  }
};

/*
 * ============================================================
 * GET ALL BOOKS
 * ============================================================
 */

const getBooks = async (req, res) => {
  try {
    const books = await Book.find()
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.json({
      success: true,
      books,
    });
  } catch (error) {
    console.error("Get books error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load books.",
    });
  }
};

/*
 * ============================================================
 * GET BOOK BY ID
 * ============================================================
 */

const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).lean();

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found.",
      });
    }

    return res.json({
      success: true,
      book,
    });
  } catch (error) {
    console.error("Get book by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load the book.",
    });
  }
};

/*
 * ============================================================
 * DELETE BOOK
 * ============================================================
 */

const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found.",
      });
    }

    /*
     * Do not delete a book while one of its physical
     * copies is issued or reserved.
     */

    const activePhysicalCopy = await PhysicalCopy.findOne({
      book: book._id,
      status: {
        $in: ["issued", "reserved"],
      },
    });

    if (activePhysicalCopy) {
      return res.status(409).json({
        success: false,
        message:
          "This book cannot be removed because one or more physical copies are currently issued or reserved.",
      });
    }

    /*
     * Delete all physical copies belonging to the book.
     */

    await PhysicalCopy.deleteMany({
      book: book._id,
    });

    /*
     * Delete the logical book record.
     */

    await book.deleteOne();

    return res.json({
      success: true,
      message: "Book and its physical copies removed successfully.",
    });
  } catch (error) {
    console.error("Delete book error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove the book.",
    });
  }
};

/*
 * ============================================================
 * UPDATE BOOK
 * ============================================================
 */

const updateBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      category,
      description,
      publisher,
      publishedYear,
      totalCopies,
      coverImageUrl,
    } = req.body;

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found.",
      });
    }

    if (!title || !author || !isbn || !category || !totalCopies) {
      return res.status(400).json({
        success: false,
        message: "Title, author, ISBN, category and total copies are required.",
      });
    }

    const copies = Number(totalCopies);

    if (!Number.isInteger(copies) || copies < 1) {
      return res.status(400).json({
        success: false,
        message: "Total copies must be a whole number greater than 0.",
      });
    }

    const normalizedIsbn = isbn.trim();

    const duplicateBook = await Book.findOne({
      isbn: normalizedIsbn,
      _id: {
        $ne: req.params.id,
      },
    });

    if (duplicateBook) {
      return res.status(409).json({
        success: false,
        message: "Another book with this ISBN already exists.",
      });
    }

    /*
     * --------------------------------------------------------
     * LOAD PHYSICAL COPIES
     * --------------------------------------------------------
     */

    let physicalCopies = await PhysicalCopy.find({
      book: book._id,
    }).sort({
      copyNumber: 1,
    });

    /*
     * --------------------------------------------------------
     * CREATE MISSING PHYSICAL COPIES
     * --------------------------------------------------------
     *
     * This also repairs older book records that were created
     * before the PhysicalCopy system was connected.
     */

    if (physicalCopies.length < copies) {
      const existingCopyNumbers = new Set(
        physicalCopies.map((physicalCopy) => physicalCopy.copyNumber),
      );

      const newPhysicalCopies = [];

      for (let copyNumber = 1; copyNumber <= copies; copyNumber += 1) {
        if (existingCopyNumbers.has(copyNumber)) {
          continue;
        }

        newPhysicalCopies.push({
          book: book._id,
          copyNumber,
          barcode: createPhysicalCopyBarcode(book._id, copyNumber),
          status: "available",
          condition: "good",
          issuedTo: null,
          reservedFor: null,
        });
      }

      if (newPhysicalCopies.length > 0) {
        await PhysicalCopy.insertMany(newPhysicalCopies);
      }

      physicalCopies = await PhysicalCopy.find({
        book: book._id,
      }).sort({
        copyNumber: 1,
      });
    }

    /*
     * --------------------------------------------------------
     * CHECK OCCUPIED COPIES
     * --------------------------------------------------------
     */

    const occupiedPhysicalCopies = physicalCopies.filter(
      (physicalCopy) =>
        physicalCopy.status === "issued" || physicalCopy.status === "reserved",
    );

    if (copies < occupiedPhysicalCopies.length) {
      return res.status(400).json({
        success: false,
        message: `Total copies cannot be less than the ${occupiedPhysicalCopies.length} copies currently issued or reserved.`,
      });
    }

    /*
     * --------------------------------------------------------
     * REDUCE PHYSICAL COPIES
     * --------------------------------------------------------
     *
     * Only AVAILABLE copies can be removed.
     */

    if (physicalCopies.length > copies) {
      const numberToRemove = physicalCopies.length - copies;

      const removableCopies = physicalCopies
        .filter((physicalCopy) => physicalCopy.status === "available")
        .sort((a, b) => b.copyNumber - a.copyNumber)
        .slice(0, numberToRemove);

      if (removableCopies.length < numberToRemove) {
        return res.status(400).json({
          success: false,
          message:
            "Some physical copies cannot be removed because they are currently issued or reserved.",
        });
      }

      await PhysicalCopy.deleteMany({
        _id: {
          $in: removableCopies.map((physicalCopy) => physicalCopy._id),
        },
      });
    }

    /*
     * --------------------------------------------------------
     * UPDATE BOOK INFORMATION
     * --------------------------------------------------------
     */

    book.title = title.trim();
    book.author = author.trim();
    book.isbn = normalizedIsbn;
    book.category = category.trim();
    book.description = description?.trim() || "";
    book.publisher = publisher?.trim() || "";
    book.publishedYear = publishedYear ? Number(publishedYear) : null;

    /*
     * --------------------------------------------------------
     * COVER IMAGE
     * --------------------------------------------------------
     *
     * Priority:
     *
     * 1. Device upload
     * 2. Image URL
     * 3. Keep existing cover
     */

    if (req.file) {
      book.coverImage = `/uploads/books/${req.file.filename}`;
    } else if (coverImageUrl?.trim()) {
      try {
        const localCoverPath = await downloadCoverImage(coverImageUrl.trim());

        book.coverImage = localCoverPath;
      } catch (coverError) {
        console.error("Cover download error:", coverError.message);

        return res.status(400).json({
          success: false,
          message: coverError.message || "Unable to download the cover image.",
        });
      }
    }

    /*
     * --------------------------------------------------------
     * RE-CALCULATE INVENTORY FROM PHYSICAL COPIES
     * --------------------------------------------------------
     */

    const finalPhysicalCopies = await PhysicalCopy.find({
      book: book._id,
    });

    const finalTotalCopies = finalPhysicalCopies.length;

    const finalAvailableCopies = finalPhysicalCopies.filter(
      (physicalCopy) => physicalCopy.status === "available",
    ).length;

    const finalReservedCopies = finalPhysicalCopies.filter(
      (physicalCopy) => physicalCopy.status === "reserved",
    ).length;

    book.totalCopies = finalTotalCopies;

    book.availableCopies = finalAvailableCopies;

    book.reservedCopies = finalReservedCopies;

    await book.save();

    return res.json({
      success: true,
      message: "Book updated successfully.",
      book,
    });
  } catch (error) {
    console.error("Update book error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update the book.",
    });
  }
};

module.exports = {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
};
