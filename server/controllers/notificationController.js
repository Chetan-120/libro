const Notification = require("../models/Notification");

const { syncDueNotifications } = require("../utils/notificationHelper");

const getMyNotifications = async (req, res) => {
  try {
    /*
     * ========================================================
     * SYNCHRONIZE STUDENT DUE NOTIFICATIONS
     * ========================================================
     *
     * Due/overdue notifications are generated from the
     * student's active circulation records.
     *
     * Librarians do not need this synchronization.
     */

    if (req.user.role === "student") {
      await syncDueNotifications(req.user._id);
    }

    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .populate("relatedBook", "title author coverImage isbn")
      .populate(
        "relatedReservation",
        "status reservedAt expiresAt claimBatchId",
      )
      .populate(
        "relatedCirculation",
        "type status issuedAt dueDate returnedAt returnRequested",
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load notifications.",
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id,
      },
      {
        isUnread: false,
      },
      {
        new: true,
      },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update notification.",
    });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isUnread: true,
      },
      {
        isUnread: false,
      },
    );

    return res.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update notifications.",
    });
  }
};

const clearMyNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({
      recipient: req.user._id,
    });

    return res.json({
      success: true,
      message: "Notifications cleared.",
    });
  } catch (error) {
    console.error("Clear notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to clear notifications.",
    });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearMyNotifications,
};
