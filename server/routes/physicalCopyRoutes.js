const express = require("express");

const {
  getPhysicalCopies,
  getPhysicalCopyByCode,
  syncBookCopyCounts,
} = require("../controllers/physicalCopyController");

const router = express.Router();

/*
 * GET ALL PHYSICAL COPIES
 *
 * GET /api/physical-copies
 *
 * Optional:
 *
 * GET /api/physical-copies?bookId=BOOK_ID
 * GET /api/physical-copies?status=available
 */
router.get("/", getPhysicalCopies);

/*
 * GET PHYSICAL COPY BY BARCODE / COPY NUMBER
 *
 * GET /api/physical-copies/code/:code
 */
router.get("/code/:code", getPhysicalCopyByCode);

/*
 * SYNCHRONIZE BOOK INVENTORY COUNTS
 *
 * POST /api/physical-copies/sync
 */
router.post("/sync", syncBookCopyCounts);

module.exports = router;
