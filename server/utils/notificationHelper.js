const Notification = require("../models/Notification");
const Circulation = require("../models/Circulation");

const createNotification = async ({
  recipient,
  title,
  message,
  category,
  relatedBook = null,
  relatedReservation = null,
  relatedCirculation = null,
}) => {
  try {
    return await Notification.create({
      recipient,
      title,
      message,
      category,
      relatedBook,
      relatedReservation,
      relatedCirculation,
      isUnread: true,
    });
  } catch (error) {
    console.error("Create notification error:", error);

    return null;
  }
};

const syncDueNotifications = async (studentId) => {
  try {
    const activeLoans = await Circulation.find({
      student: studentId,
      type: "Issue",
      status: "Completed",
      returnedAt: null,
      dueDate: {
        $ne: null,
      },
    }).populate("book", "title");

    /*
     * ============================================================
     * NOTIFICATION DATE WINDOW
     * ============================================================
     *
     * Notifications are based on calendar dates.
     *
     * Today:
     *     Overdue if due date is before today.
     *
     * Next 2 days:
     *     Due soon.
     */

    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dueSoonLimit = new Date(today);
    dueSoonLimit.setDate(dueSoonLimit.getDate() + 2);

    for (const loan of activeLoans) {
      if (!loan.book) {
        continue;
      }

      const rawDueDate = new Date(loan.dueDate);

      const dueDate = new Date(
        rawDueDate.getFullYear(),
        rawDueDate.getMonth(),
        rawDueDate.getDate(),
      );

      let notificationTitle = null;
      let notificationMessage = null;

      if (dueDate < today) {
        notificationTitle = "Book overdue";

        notificationMessage = `${loan.book.title} is overdue. Please return it to the library as soon as possible.`;
      } else if (dueDate <= dueSoonLimit) {
        notificationTitle = "Book due soon";

        notificationMessage = `${loan.book.title} is due on ${dueDate.toLocaleDateString(
          "en-IN",
        )}. Please return it on time.`;
      }

      if (!notificationTitle) {
        continue;
      }

      const existingNotification = await Notification.findOne({
        recipient: studentId,
        relatedCirculation: loan._id,
        title: notificationTitle,
      });

      if (existingNotification) {
        continue;
      }

      await createNotification({
        recipient: studentId,
        title: notificationTitle,
        message: notificationMessage,
        category: notificationTitle === "Book overdue" ? "overdue" : "due",
        relatedBook: loan.book._id,
        relatedCirculation: loan._id,
      });
    }
  } catch (error) {
    console.error("Sync due notifications error:", error);
  }
};

module.exports = {
  createNotification,
  syncDueNotifications,
};
