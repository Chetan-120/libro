const Fine = require("../models/Fine");
const Circulation = require("../models/Circulation");

const FINE_PER_DAY = 10;

/**
 * Calculate overdue days.
 *
 * Uses the returned date when the book has already
 * been returned, otherwise uses the current date.
 */
const calculateOverdueDays = (dueDate, returnedAt = null) => {
  if (!dueDate) {
    return 0;
  }

  const due = new Date(dueDate);
  const end = returnedAt ? new Date(returnedAt) : new Date();

  /*
   * Compare calendar dates rather than exact
   * hours/minutes.
   */

  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (endDay <= dueDay) {
    return 0;
  }

  const difference = endDay.getTime() - dueDay.getTime();

  return Math.floor(difference / (1000 * 60 * 60 * 24));
};
/**
 * Create or update fines from overdue circulation records.
 *
 * This synchronizes the Fine collection with actual
 * circulation transactions.
 */
const syncFineRecords = async (studentId = null) => {
  const query = {
    type: "Issue",
    status: "Completed",
    dueDate: {
      $ne: null,
    },
    $expr: {
      $gt: [
        {
          $cond: [
            {
              $ne: ["$returnedAt", null],
            },
            "$returnedAt",
            "$$NOW",
          ],
        },
        "$dueDate",
      ],
    },
  };

  if (studentId) {
    query.student = studentId;
  }

  const overdueCirculations = await Circulation.find(query).lean();

  let created = 0;
  let updated = 0;

  for (const circulation of overdueCirculations) {
    const overdueDays = calculateOverdueDays(
      circulation.dueDate,
      circulation.returnedAt,
    );

    if (overdueDays <= 0) {
      continue;
    }

    const amount = overdueDays * FINE_PER_DAY;

    const existingFine = await Fine.findOne({
      circulation: circulation._id,
    });

    if (!existingFine) {
      await Fine.create({
        circulation: circulation._id,
        student: circulation.student,
        book: circulation.book,
        reason: "Late return",
        amount,
        overdueDays,
        status: "Pending",
        issuedAt: circulation.issuedAt,
        dueDate: circulation.dueDate,
        returnedAt: circulation.returnedAt,
      });

      created += 1;
      continue;
    }

    if (existingFine.status === "Paid") {
      continue;
    }

    existingFine.amount = amount;
    existingFine.overdueDays = overdueDays;
    existingFine.issuedAt = circulation.issuedAt;
    existingFine.dueDate = circulation.dueDate;
    existingFine.returnedAt = circulation.returnedAt;

    await existingFine.save();

    updated += 1;
  }

  return {
    created,
    updated,
  };
};

const syncFines = async (req, res) => {
  try {
    const result = await syncFineRecords();

    return res.json({
      success: true,
      message: "Fine records synchronized successfully.",
      ...result,
    });
  } catch (error) {
    console.error("Sync fines error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to synchronize fine records.",
    });
  }
};

/**
 * Get all fine records for the librarian.
 */
const getFines = async (req, res) => {
  try {
    const fines = await Fine.find()
      .populate("student", "name email studentId")
      .populate("book", "title author category coverImage isbn")
      .populate("circulation", "issuedAt dueDate returnedAt renewalCount")
      .populate("paidBy", "name email")
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.json({
      success: true,
      fines,
    });
  } catch (error) {
    console.error("Get fines error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load fines.",
    });
  }
};

const getMyFines = async (req, res) => {
  try {
    await syncFineRecords(req.user._id);

    const fines = await Fine.find({
      student: req.user._id,
    })
      .populate("book", "title author category coverImage isbn")
      .populate("circulation", "issuedAt dueDate returnedAt renewalCount")
      .populate("paidBy", "name email")
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.json({
      success: true,
      fines,
    });
  } catch (error) {
    console.error("Get my fines error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your fines.",
    });
  }
};

/**
 * Mark an outstanding fine as paid.
 */
const markFineAsPaid = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);

    if (!fine) {
      return res.status(404).json({
        success: false,
        message: "Fine not found.",
      });
    }

    if (fine.status === "Paid") {
      return res.status(400).json({
        success: false,
        message: "This fine has already been paid.",
      });
    }

    /*
     * ============================================================
     * VALIDATE LINKED CIRCULATION
     * ============================================================
     *
     * Every fine must belong to a valid circulation transaction.
     *
     * This prevents a fine from being marked as paid if its
     * original circulation record no longer exists.
     */

    const circulation = await Circulation.findById(fine.circulation).lean();

    if (!circulation) {
      return res.status(409).json({
        success: false,
        message:
          "The circulation record associated with this fine could not be found.",
      });
    }

    fine.status = "Paid";
    fine.paidAt = new Date();
    fine.paidBy = req.user._id;

    await fine.save();

    const populatedFine = await Fine.findById(fine._id)
      .populate("student", "name email studentId")
      .populate("book", "title author category coverImage isbn")
      .populate("circulation", "issuedAt dueDate returnedAt renewalCount")
      .populate("paidBy", "name email");

    return res.json({
      success: true,
      message: "Fine marked as paid successfully.",
      fine: populatedFine,
    });
  } catch (error) {
    console.error("Mark fine as paid error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update fine payment status.",
    });
  }
};

module.exports = {
  syncFines,
  syncFineRecords,
  getFines,
  getMyFines,
  markFineAsPaid,
};
