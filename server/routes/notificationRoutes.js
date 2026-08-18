const express = require("express");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearMyNotifications,
} = require("../controllers/notificationController");

const router = express.Router();

router.get(
  "/my",
  protect,
  authorize("student", "librarian"),
  getMyNotifications,
);

router.patch(
  "/:id/read",
  protect,
  authorize("student", "librarian"),
  markNotificationAsRead,
);

router.patch(
  "/read-all",
  protect,
  authorize("student", "librarian"),
  markAllNotificationsAsRead,
);

router.delete(
  "/my",
  protect,
  authorize("student", "librarian"),
  clearMyNotifications,
);

module.exports = router;