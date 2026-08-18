const express = require("express");

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createReservation,
  getBookReservation,
  getMyReservations,
  cancelReservation,
  getLibrarianReservations,
  updateReservationStatus,
} = require("../controllers/reservationController");

const {
  createClaimBatch,
  claimReservation,
} = require("../services/reservationClaimService");

const router = express.Router();

/*
 * ============================================================
 * STUDENT RESERVATION ROUTES
 * ============================================================
 */

router.get("/my", protect, authorize("student"), getMyReservations);

router.get("/book/:bookId", protect, authorize("student"), getBookReservation);

router.post("/", protect, authorize("student"), createReservation);

router.patch("/:id/cancel", protect, authorize("student"), cancelReservation);

/*
 * ============================================================
 * CLAIM SYSTEM
 * ============================================================
 */

/*
 * CREATE CLAIM BATCH
 *
 * POST /api/reservations/claim-batch
 *
 * Librarian starts a claim opportunity for a physical copy.
 */

router.post("/claim-batch", protect, authorize("librarian"), createClaimBatch);

/*
 * CLAIM RESERVATION
 *
 * POST /api/reservations/claim
 *
 * Student attempts to claim the physical copy.
 *
 * First successful student wins.
 */

router.post("/claim", protect, authorize("student"), claimReservation);

/*
 * ============================================================
 * LIBRARIAN RESERVATION ROUTES
 * ============================================================
 */

router.get(
  "/librarian",
  protect,
  authorize("librarian"),
  getLibrarianReservations,
);

/*
 * UPDATE RESERVATION STATUS
 *
 * IMPORTANT:
 *
 * READY is NOT manually assigned here.
 *
 * READY is controlled by the claim system.
 *
 * COLLECTED is controlled by circulation.
 */

router.patch(
  "/:id/status",
  protect,
  authorize("librarian"),
  updateReservationStatus,
);

module.exports = router;
