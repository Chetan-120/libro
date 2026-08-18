const express = require("express");

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  syncFines,
  getFines,
  getMyFines,
  markFineAsPaid,
} = require("../controllers/fineController");

const router = express.Router();

router.get("/my", protect, authorize("student"), getMyFines);

router.get("/", protect, authorize("librarian"), getFines);

router.post("/sync", protect, authorize("librarian"), syncFines);

router.patch("/:id/pay", protect, authorize("librarian"), markFineAsPaid);

module.exports = router;
