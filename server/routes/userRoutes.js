const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      studentId: req.user.studentId || null,
    },
  });
});

router.get("/student-only", protect, authorize("student"), (req, res) => {
  res.json({
    success: true,
    message: "Student access granted.",
  });
});

router.get("/librarian-only", protect, authorize("librarian"), (req, res) => {
  res.json({
    success: true,
    message: "Librarian access granted.",
  });
});

router.get("/students", protect, authorize("librarian"), async (req, res) => {
  try {
    const User = require("../models/User");
    const Circulation = require("../models/Circulation");

    const students = await User.find({
      role: "student",
    })
      .select("name email studentId isActive createdAt")
      .sort({ name: 1 })
      .lean();

    const Fine = require("../models/Fine");

    const studentIds = students.map((student) => student._id);

    const activeLoans = await Circulation.find({
      student: { $in: studentIds },
      type: "Issue",
      status: "Completed",
      returnedAt: null,
    })
      .select("student")
      .lean();

    const borrowedCounts = activeLoans.reduce((counts, loan) => {
      const studentId = loan.student.toString();

      counts[studentId] = (counts[studentId] || 0) + 1;

      return counts;
    }, {});

    const outstandingFines = await Fine.find({
      student: { $in: studentIds },
      status: "Pending",
    })
      .select("student amount")
      .lean();

    const fineTotals = outstandingFines.reduce((totals, fine) => {
      const studentId = fine.student.toString();

      totals[studentId] = (totals[studentId] || 0) + fine.amount;

      return totals;
    }, {});

    const enrichedStudents = students.map((student) => {
      const studentId = student._id.toString();

      return {
        ...student,
        borrowed: borrowedCounts[studentId] || 0,
        outstandingFines: fineTotals[studentId] || 0,
        status: student.isActive ? "Active" : "Inactive",
      };
    });

    return res.json({
      success: true,
      students: enrichedStudents,
    });
  } catch (error) {
    console.error("Get students error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load students.",
    });
  }
});

/*
 * Get complete student details for librarian.
 *
 * Includes:
 * - Basic student information
 * - Active loans
 * - Reservations
 * - Fines
 * - Circulation history
 */
router.get(
  "/students/:id/details",
  protect,
  authorize("librarian"),
  async (req, res) => {
    try {
      const User = require("../models/User");
      const Circulation = require("../models/Circulation");
      const Reservation = require("../models/Reservation");
      const Fine = require("../models/Fine");

      const student = await User.findOne({
        _id: req.params.id,
        role: "student",
      })
        .select("name email studentId isActive createdAt")
        .lean();

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found.",
        });
      }

      const [activeLoans, reservations, fines, circulationHistory] =
        await Promise.all([
          /*
           * Currently issued books
           */
          Circulation.find({
            student: student._id,
            type: "Issue",
            status: "Completed",
            returnedAt: null,
          })
            .populate(
              "book",
              "title author isbn coverImage category totalCopies availableCopies",
            )
            .populate("processedBy", "name email")
            .sort({ issuedAt: -1 })
            .lean(),

          /*
           * All reservations made by this student
           */
          Reservation.find({
            student: student._id,
          })
            .populate(
              "book",
              "title author isbn coverImage category totalCopies availableCopies",
            )
            .sort({ reservedAt: -1 })
            .lean(),

          /*
           * All fines belonging to this student
           */
          Fine.find({
            student: student._id,
          })
            .sort({ createdAt: -1 })
            .lean(),

          /*
           * Complete circulation history
           */
          Circulation.find({
            student: student._id,
          })
            .populate("book", "title author isbn coverImage category")
            .populate("processedBy", "name email")
            .sort({ createdAt: -1 })
            .lean(),
        ]);

      const pendingFines = fines.filter((fine) => fine.status === "Pending");

      const outstandingFineAmount = pendingFines.reduce(
        (total, fine) => total + Number(fine.amount || 0),
        0,
      );

      return res.json({
        success: true,

        student: {
          ...student,

          status: student.isActive ? "Active" : "Inactive",

          summary: {
            activeLoans: activeLoans.length,
            reservations: reservations.filter((reservation) =>
              ["pending", "ready"].includes(reservation.status),
            ).length,
            outstandingFines: outstandingFineAmount,
            totalFines: fines.length,
          },
        },

        activeLoans,
        reservations,
        fines,
        circulationHistory,
      });
    } catch (error) {
      console.error("Get student details error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load student details.",
      });
    }
  },
);

router.patch(
  "/students/:id/status",
  protect,
  authorize("librarian"),
  async (req, res) => {
    try {
      const User = require("../models/User");

      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean.",
        });
      }

      const student = await User.findOne({
        _id: req.params.id,
        role: "student",
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found.",
        });
      }

      student.isActive = isActive;

      await student.save();

      return res.json({
        success: true,
        message: isActive
          ? "Student account activated successfully."
          : "Student account deactivated successfully.",
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId || null,
          isActive: student.isActive,
          status: student.isActive ? "Active" : "Inactive",
        },
      });
    } catch (error) {
      console.error("Update student status error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update student account status.",
      });
    }
  },
);

module.exports = router;
