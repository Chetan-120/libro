const express = require("express");

const {
  getCirculation,
  getStudentsForCirculation,
  getBooksForCirculation,
  issueBook,
  returnBook,
  renewBook,
  getLibrarianDashboard,
  getMyLoans,
  returnMyBook,
} = require("../controllers/circulationController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

/*
 * ============================================================
 * LIBRARIAN CIRCULATION ROUTES
 * ============================================================
 *
 * These operations are only available to librarians.
 */

/*
 * GET ALL CIRCULATION TRANSACTIONS
 *
 * Used by the librarian circulation management screen.
 */
router.get("/", protect, authorize("librarian"), getCirculation);

/*
 * GET STUDENTS
 *
 * Used when the librarian selects a student
 * while issuing a book.
 */
router.get(
  "/students",
  protect,
  authorize("librarian"),
  getStudentsForCirculation,
);

/*
 * GET BOOKS
 *
 * Used by the librarian circulation screen
 * when selecting a book to issue.
 */
router.get("/books", protect, authorize("librarian"), getBooksForCirculation);

/*
 * ISSUE BOOK
 *
 * Librarian physically issues a book to a student.
 */
router.post("/issue", protect, authorize("librarian"), issueBook);

/*
 * COMPLETE BOOK RETURN
 *
 * Librarian confirms that the physical book
 * has actually been received.
 */
router.post("/return", protect, authorize("librarian"), returnBook);

/*
 * RENEW BOOK
 *
 * Librarian performs the renewal operation.
 */
router.post("/renew", protect, authorize("librarian"), renewBook);

/*
 * LIBRARIAN DASHBOARD
 *
 * Statistics and circulation activity.
 */
router.get(
  "/dashboard",
  protect,
  authorize("librarian"),
  getLibrarianDashboard,
);

/*
 * ============================================================
 * STUDENT CIRCULATION ROUTES
 * ============================================================
 */

/*
 * GET MY ACTIVE LOANS
 *
 * A student can only see their own active loans.
 */
router.get("/my-loans", protect, authorize("student"), getMyLoans);

/*
 * REQUEST BOOK RETURN
 *
 * Important:
 *
 * Student does NOT actually return the book here.
 *
 * This only creates a return request.
 *
 * The librarian must physically receive the book
 * and call POST /return.
 */
router.post("/my-return", protect, authorize("student"), returnMyBook);

module.exports = router;
