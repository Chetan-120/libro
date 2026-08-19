const express = require("express");

const upload = require("../middleware/uploadMiddleware");
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");

const router = express.Router();

/*
 * ============================================================
 * BOOK VIEW ROUTES
 * ============================================================
 *
 * Authenticated students and librarians can view books.
 */

/*
 * Public read-only books endpoint for the landing page.
 * The normal /api/books endpoint remains protected.
 */
router.get("/public", getBooks);

router.get("/", protect, getBooks);

router.get("/:id", protect, getBookById);

/*
 * ============================================================
 * BOOK MANAGEMENT ROUTES
 * ============================================================
 *
 * Only librarians can create, update, or delete books.
 */

/* Add a new book */
router.post(
  "/",
  protect,
  authorize("librarian"),
  upload.single("coverImage"),
  createBook,
);

/* Update an existing book */
router.put(
  "/:id",
  protect,
  authorize("librarian"),
  upload.single("coverImage"),
  updateBook,
);

/* Delete a book */
router.delete("/:id", protect, authorize("librarian"), deleteBook);

module.exports = router;

