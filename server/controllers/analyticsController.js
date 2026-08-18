const Book = require("../models/Book");
const User = require("../models/User");
const Circulation = require("../models/Circulation");
const Reservation = require("../models/Reservation");
const Fine = require("../models/Fine");

const getAnalytics = async (req, res) => {
  try {
    const now = new Date();

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      totalBooks,
      activeMembers,
      activeLoans,
      pendingFines,
      circulationRecords,
    ] = await Promise.all([
      Book.countDocuments(),

      User.countDocuments({
        role: "student",
        isActive: true,
      }),

      Circulation.countDocuments({
        type: "Issue",
        status: "Completed",
        returnedAt: null,
      }),

      Fine.aggregate([
        {
          $match: {
            status: "Pending",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
          },
        },
      ]),

      Circulation.find({
        createdAt: {
          $gte: sixMonthsAgo,
        },
      })
        .populate("book", "title author category")
        .populate("student", "name studentId")
        .lean(),
    ]);

    const outstandingFines = pendingFines[0]?.total || 0;

    const monthlyMap = new Map();

    for (let index = 0; index < 6; index += 1) {
      const date = new Date(sixMonthsAgo);

      date.setMonth(sixMonthsAgo.getMonth() + index);

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}`;

      monthlyMap.set(key, {
        month: date.toLocaleString("en-US", {
          month: "short",
        }),
        loans: 0,
        returns: 0,
      });
    }

    circulationRecords.forEach((record) => {
      const date = new Date(record.createdAt);

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}`;

      const month = monthlyMap.get(key);

      if (!month) {
        return;
      }

      if (record.type === "Issue") {
        month.loans += 1;
      }

      if (record.type === "Return") {
        month.returns += 1;
      }
    });

    const monthlyData = Array.from(monthlyMap.values());

    const popularMap = new Map();

    circulationRecords
      .filter((record) => record.type === "Issue" && record.book)
      .forEach((record) => {
        const bookId = record.book._id.toString();

        const existing = popularMap.get(bookId);

        if (existing) {
          existing.loans += 1;
        } else {
          popularMap.set(bookId, {
            title: record.book.title,
            author: record.book.author,
            category: record.book.category || "Uncategorized",
            loans: 1,
          });
        }
      });

    const popularBooks = Array.from(popularMap.values())
      .sort((a, b) => b.loans - a.loans)
      .slice(0, 5);

    const categoryMap = new Map();

    circulationRecords
      .filter((record) => record.type === "Issue" && record.book)
      .forEach((record) => {
        const category = record.book.category || "Uncategorized";

        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });

    const categoryTotal = Array.from(categoryMap.values()).reduce(
      (sum, value) => sum + value,
      0,
    );

    const categoryData = Array.from(categoryMap.entries())
      .map(([label, value]) => ({
        label,
        value:
          categoryTotal > 0 ? Math.round((value / categoryTotal) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const totalLoans = circulationRecords.filter(
      (record) => record.type === "Issue",
    ).length;

    const totalReturns = circulationRecords.filter(
      (record) => record.type === "Return",
    ).length;

    /*
     * ============================================================
     * OVERDUE LOANS
     * ============================================================
     *
     * Use calendar dates so Analytics follows the same
     * overdue rule as the Fine module.
     */

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const overdueLoans = circulationRecords.filter((record) => {
      if (record.type !== "Issue" || !record.dueDate) {
        return false;
      }

      const rawDueDate = new Date(record.dueDate);

      const dueDate = new Date(
        rawDueDate.getFullYear(),
        rawDueDate.getMonth(),
        rawDueDate.getDate(),
      );

      const endDate = record.returnedAt ? new Date(record.returnedAt) : today;

      const comparisonDate = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
      );

      return comparisonDate > dueDate;
    }).length;

    const averageReturnDays = circulationRecords
      .filter(
        (record) =>
          record.type === "Issue" && record.issuedAt && record.returnedAt,
      )
      .map((record) => {
        const difference =
          new Date(record.returnedAt).getTime() -
          new Date(record.issuedAt).getTime();

        return difference / (1000 * 60 * 60 * 24);
      });

    const averageReturn =
      averageReturnDays.length > 0
        ? (
            averageReturnDays.reduce((sum, value) => sum + value, 0) /
            averageReturnDays.length
          ).toFixed(1)
        : "0.0";

    const totalAvailableCopies = await Book.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$availableCopies",
          },
        },
      },
    ]);

    const availableCopies = totalAvailableCopies[0]?.total || 0;

    const totalCollectionCopies = await Book.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$totalCopies",
          },
        },
      },
    ]);

    const collectionCopies = totalCollectionCopies[0]?.total || 0;

    const collectionUsage =
      collectionCopies > 0
        ? (
            ((collectionCopies - availableCopies) / collectionCopies) *
            100
          ).toFixed(1)
        : "0.0";

    const engagedMembers = await Circulation.distinct("student", {
      type: "Issue",
      createdAt: {
        $gte: sixMonthsAgo,
      },
    });

    const memberEngagement =
      activeMembers > 0
        ? ((engagedMembers.length / activeMembers) * 100).toFixed(1)
        : "0.0";

    const reservationCount = await Reservation.countDocuments();

    return res.json({
      success: true,

      analytics: {
        totalLoans,
        activeMembers,
        availableCopies,
        outstandingFines,

        monthlyData,
        popularBooks,
        categoryData,

        averageReturn,
        collectionUsage,
        memberEngagement,

        activeLoans,
        overdueLoans,
        reservationCount,
        totalReturns,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load analytics data.",
    });
  }
};

module.exports = {
  getAnalytics,
};
