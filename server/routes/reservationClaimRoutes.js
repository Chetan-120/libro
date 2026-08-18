const express = require("express");

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createClaimBatch,
  claimReservation,
} = require("../controllers/reservationClaimController");

const router = express.Router();

/*
 * ============================================================
 * LIBRARIAN CLAIM-BATCH ROUTES
 * ============================================================
 */

/*
 * CREATE CLAIM BATCH
 *
 * Maximum:
 *   5 students
 *
 * Claim window:
 *   30 minutes
 *
 * POST /api/reservation-claims/create-batch
 */
router.post("/create-batch", protect, authorize("librarian"), createClaimBatch);

/*
 * ============================================================
 * STUDENT CLAIM ROUTES
 * ============================================================
 */

/*
 * CLAIM RESERVATION
 *
 * Student attempts to claim a physical copy
 * during an active claim window.
 *
 * POST /api/reservation-claims/claim
 */
router.post("/claim", protect, authorize("student"), claimReservation);

module.exports = router;
