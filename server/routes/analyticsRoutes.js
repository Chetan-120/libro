const express = require("express");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const {
  getAnalytics,
} = require("../controllers/analyticsController");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("librarian"),
  getAnalytics,
);

module.exports = router;