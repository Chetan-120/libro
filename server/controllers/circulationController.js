const Circulation = require("../models/Circulation");
const Book = require("../models/Book");
const PhysicalCopy = require("../models/PhysicalCopy");
const { createNotification } = require("../utils/notificationHelper");
const Reservation = require("../models/Reservation");
const ReservationClaimBatch = require("../models/ReservationClaimBatch");

const {
  createAutomaticClaimBatch,
} = require("../services/reservationClaimService");

/*
 * ============================================================
 * SYNCHRONIZE BOOK INVENTORY
 * ============================================================
 *
 * PhysicalCopy records are the source of truth.
 *
 * Book counters are calculated from actual copies.
 */

const syncBookInventory = async (bookId) => {
  const totalCopies = await PhysicalCopy.countDocuments({
    book: bookId,
  });

  const availableCopies = await PhysicalCopy.countDocuments({
    book: bookId,
    status: "available",
  });

  const reservedCopies = await PhysicalCopy.countDocuments({
    book: bookId,
    status: "reserved",
  });

  return Book.findByIdAndUpdate(
    bookId,
    {
      $set: {
        totalCopies,
        availableCopies,
        reservedCopies,
      },
    },
    {
      new: true,
    },
  );
};

const getCirculation = async (req, res) => {
  try {
    const transactions = await Circulation.find()
      .populate("student", "name email studentId")
      .populate("book", "title author isbn coverImage")
      .populate("processedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      transactions: validTransactions,
    });
  } catch (error) {
    console.error("Get circulation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load circulation data.",
    });
  }
};

const getStudentsForCirculation = async (req, res) => {
  try {
    const User = require("../models/User");

    /*
     * All registered students can be selected by the librarian.
     *
     * We intentionally do NOT filter by isActive because
     * Libro does not use Active/Inactive student accounts.
     */
    const students = await User.find({
      role: "student",
    })
      .select("name email studentId")
      .sort({ name: 1 })
      .lean();

    return res.json({
      success: true,
      students,
    });
  } catch (error) {
    console.error("Get circulation students error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load students.",
    });
  }
};

const getBooksForCirculation = async (req, res) => {
  try {
    const books = await Book.find()
      .select(
        "title author isbn category availableCopies reservedCopies totalCopies coverImage",
      )
      .sort({ title: 1 })
      .lean();

    return res.json({
      success: true,
      books,
    });
  } catch (error) {
    console.error("Get circulation books error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load books.",
    });
  }
};

const issueBook = async (req, res) => {
  try {
    const {
      studentId,
      bookId,
      dueDate,
      physicalCopyId,
      copyCode,
      isExtraLoan = false,
      extraLoanReason,
    } = req.body;

    if (!studentId || !bookId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and book ID are required.",
      });
    }

    const student = await require("../models/User").findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found.",
      });
    }

    /*
     * Resolve the exact physical copy that will be issued.
     *
     * Priority:
     * 1. Physical copy selected by its MongoDB ID.
     * 2. Physical copy scanned by barcode/copy code.
     * 3. For a READY reservation, use the copy reserved
     *    specifically for that student.
     * 4. Otherwise use the first available physical copy.
     */
    let physicalCopy = null;

    if (physicalCopyId) {
      physicalCopy = await PhysicalCopy.findOne({
        _id: physicalCopyId,
        book: bookId,
        status: {
          $in: ["available", "reserved"],
        },
      });

      if (!physicalCopy) {
        return res.status(404).json({
          success: false,
          message: "The selected physical copy was not found for this book.",
        });
      }
    }

    if (!physicalCopy && copyCode) {
      const normalizedCopyCode = copyCode.trim();

      physicalCopy = await PhysicalCopy.findOne({
        book: bookId,
        $or: [
          { barcode: normalizedCopyCode },
          ...(Number.isInteger(Number(normalizedCopyCode))
            ? [{ copyNumber: Number(normalizedCopyCode) }]
            : []),
        ],
      });
    }

    /*
     * If the student has a READY reservation, the exact
     * reserved physical copy must be used.
     */
    const readyReservation = await Reservation.findOne({
      student: studentId,
      book: bookId,
      status: "ready",
    });

    if (readyReservation) {
      /*
       * A READY reservation must use the exact
       * physical copy reserved for this student.
       */

      const reservedPhysicalCopy = await PhysicalCopy.findOne({
        book: bookId,
        status: "reserved",
        reservedFor: studentId,
      });

      if (!reservedPhysicalCopy) {
        return res.status(409).json({
          success: false,
          message:
            "The physical copy reserved for this student could not be found.",
        });
      }

      /*
       * Never allow a different physical copy to
       * replace the reserved copy.
       */

      if (
        physicalCopy &&
        physicalCopy._id.toString() !== reservedPhysicalCopy._id.toString()
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This student has a specific physical copy reserved. Please issue the reserved copy.",
        });
      }

      physicalCopy = reservedPhysicalCopy;
    }

    /*
     * Normal issue:
     * use the first available physical copy.
     */
    if (!physicalCopy) {
      physicalCopy = await PhysicalCopy.findOne({
        book: bookId,
        status: "available",
      }).sort({
        createdAt: 1,
        _id: 1,
      });
    }

    if (!physicalCopy) {
      return res.status(409).json({
        success: false,
        message:
          "No physical copy is available for this book. Please verify the book inventory.",
      });
    }

    /*
     * Legacy physical-copy records may not have copyNumber.
     *
     * Generate a unique copy number before any save().
     */
    if (!physicalCopy.copyNumber) {
      const existingCopyNumbers = await PhysicalCopy.find({
        book: bookId,
        copyNumber: {
          $exists: true,
          $ne: null,
        },
      })
        .select("copyNumber")
        .lean();

      const usedNumbers = existingCopyNumbers
        .map((copy) => {
          const match = String(copy.copyNumber).match(/(\d+)$/);
          return match ? Number(match[1]) : null;
        })
        .filter(Number.isInteger);

      const nextNumber =
        usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;

      physicalCopy.copyNumber = nextNumber;
    }

    /*
     * Make sure the physical copy actually belongs to
     * this book before changing its state.
     */
    if (physicalCopy.book.toString() !== bookId.toString()) {
      return res.status(409).json({
        success: false,
        message: "The selected physical copy does not belong to this book.",
      });
    }

    /*
     * Reservation-aware issue flow.
     *
     * READY reservation:
     * - The physical copy is already reserved.
     * - Consume one reserved copy when the librarian issues it.
     *
     * No reservation:
     * - Consume one normally available copy.
     *
     * A librarian cannot bypass the first active reservation.
     */
    const firstActiveReservation = await Reservation.findOne({
      book: bookId,
      status: {
        $in: ["pending", "ready"],
      },
    }).sort({
      reservedAt: 1,
      createdAt: 1,
    });

    /*
     * Reservation-aware issue flow.
     *
     * Queue #1:
     * - Can be issued directly by the librarian.
     * - Reservation may be PENDING or READY.
     *
     * Queue #2 and later:
     * - Cannot receive the book before Queue #1.
     */
    const isFirstReservationForStudent =
      firstActiveReservation &&
      firstActiveReservation.student.toString() === studentId.toString();

    const studentReadyReservation =
      isFirstReservationForStudent && firstActiveReservation.status === "ready";

    const studentPendingReservation =
      isFirstReservationForStudent &&
      firstActiveReservation.status === "pending";

    /*
     * A pending reservation cannot be issued directly.
     *
     * It must first pass through the reservation
     * claim-batch process and become READY.
     */

    if (studentPendingReservation) {
      return res.status(409).json({
        success: false,
        message:
          "This reservation is still pending. The student must first claim the book and receive Ready for pickup status.",
      });
    }

    /*
     * Prevent the librarian from bypassing Queue #1.
     */
    if (firstActiveReservation && !isFirstReservationForStudent) {
      return res.status(409).json({
        success: false,
        message:
          "This book is reserved for the student who is first in the queue.",
      });
    }

    /*
     * READY reservations normally use a reserved copy.
     */

    const activeLoan = await Circulation.findOne({
      student: studentId,
      book: bookId,
      type: "Issue",
      status: "Completed",
      returnedAt: null,
    });

    if (activeLoan) {
      return res.status(409).json({
        success: false,
        message: "This student already has this book issued.",
      });
    }

    /*
     * Physical-library borrowing limit:
     *
     * A student can have a maximum of 5 physical
     * books at the same time.
     *
     * Returned books are not counted because
     * returnedAt is no longer null.
     */
    const activeLoanCount = await Circulation.countDocuments({
      student: studentId,
      type: "Issue",
      status: "Completed",
      returnedAt: null,
    });

    if (isExtraLoan) {
      if (req.user.role !== "librarian") {
        return res.status(403).json({
          success: false,
          message: "Only a librarian can issue an extra loan.",
        });
      }

      if (!extraLoanReason || !extraLoanReason.trim()) {
        return res.status(400).json({
          success: false,
          message: "A reason is required for an extra loan.",
        });
      }
    } else if (activeLoanCount >= 5) {
      return res.status(409).json({
        success: false,
        message:
          "This student already has the maximum of 5 books. A librarian must issue an extra loan if an additional book is required.",
      });
    }

    const issueDate = new Date();

    let calculatedDueDate;

    if (dueDate) {
      calculatedDueDate = new Date(dueDate);

      if (Number.isNaN(calculatedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid due date.",
        });
      }

      if (calculatedDueDate <= issueDate) {
        return res.status(400).json({
          success: false,
          message: "Due date must be after the issue date.",
        });
      }
    } else {
      calculatedDueDate = new Date(issueDate);

      calculatedDueDate.setDate(calculatedDueDate.getDate() + 14);
    }

    /*
     * The physical copy has already been resolved and
     * validated above.
     */

    /*
     * ============================================================
     * UPDATE PHYSICAL COPY STATE
     * ============================================================
     *
     * PhysicalCopy is the source of truth for inventory.
     *
     * READY:
     *     RESERVED → ISSUED
     *
     * NORMAL:
     *     AVAILABLE → ISSUED
     */

    if (studentReadyReservation) {
      /*
       * READY reservation:
       *
       * The exact reserved physical copy must be issued.
       */

      if (
        physicalCopy.status !== "reserved" ||
        physicalCopy.reservedFor?.toString() !== studentId.toString()
      ) {
        return res.status(409).json({
          success: false,
          message: "The physical copy is not reserved for this student.",
        });
      }

      physicalCopy.status = "issued";
      physicalCopy.issuedTo = studentId;
      physicalCopy.reservedFor = null;

      await physicalCopy.save();
    } else {
      /*
       * NORMAL ISSUE:
       *
       * Only an available physical copy
       * can be issued.
       */

      if (physicalCopy.status !== "available") {
        return res.status(409).json({
          success: false,
          message: "The selected physical copy is not currently available.",
        });
      }

      physicalCopy.status = "issued";
      physicalCopy.issuedTo = studentId;
      physicalCopy.reservedFor = null;

      await physicalCopy.save();
    }

    /*
     * Synchronize Book counters from actual
     * PhysicalCopy records.
     */
    await syncBookInventory(bookId);

    const transaction = await Circulation.create({
      student: studentId,
      book: bookId,
      physicalCopy: physicalCopy._id,
      type: "Issue",
      status: "Completed",
      issuedAt: issueDate,
      dueDate: calculatedDueDate,
      isExtraLoan: Boolean(isExtraLoan),
      extraLoanReason: isExtraLoan ? extraLoanReason.trim() : null,
      processedBy: req.user._id,
    });

    /*
     * ============================================================
     * COMPLETE READY RESERVATION
     * ============================================================
     *
     * A reservation can become COLLECTED only after:
     *
     * PENDING
     *    ↓
     * CLAIM
     *    ↓
     * READY
     *    ↓
     * LIBRARIAN ISSUES PHYSICAL COPY
     */

    const collectedReservation = await Reservation.findOneAndUpdate(
      {
        student: studentId,
        book: bookId,
        status: "ready",
      },
      {
        $set: {
          status: "collected",
          expiresAt: null,
          claimBatchId: null,
          claimWindowStartedAt: null,
          claimWindowExpiresAt: null,
          claimedAt: null,
        },
      },
      {
        new: true,
      },
    );

    /*
     * ============================================================
     * COMPLETE CLAIM BATCH
     * ============================================================
     *
     * At this point the physical copy has actually been
     * issued to the student.
     *
     * Therefore the reservation is now COLLECTED.
     */

    if (collectedReservation) {
      await ReservationClaimBatch.findOneAndUpdate(
        {
          book: bookId,
          status: {
            $in: ["active", "claimed"],
          },
          claimedReservation: collectedReservation._id,
        },
        {
          $set: {
            status: "completed",
          },
        },
      );
    }

    await createNotification({
      recipient: studentId,
      title: "Book issued successfully",
      message: `${book.title} has been issued to you. Please return it by ${calculatedDueDate.toLocaleDateString(
        "en-IN",
      )}.`,
      category: "due",
      relatedBook: book._id,
      relatedCirculation: transaction._id,
    });

    const populatedTransaction = await Circulation.findById(transaction._id)
      .populate("student", "name email studentId")
      .populate("book", "title author isbn coverImage")
      .populate(
        "physicalCopy",
        "copyNumber barcode status condition issuedTo reservedFor",
      )
      .populate("processedBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Book issued successfully.",
      transaction: populatedTransaction,
    });
  } catch (error) {
    console.error("Issue book error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to issue the book.",
    });
  }
};

const returnBook = async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required.",
      });
    }

    /*
     * The librarian completes the return when the
     * physical book is actually received.
     */
    const transaction = await Circulation.findOne({
      _id: transactionId,
      type: "Issue",
      status: "Completed",
      returnedAt: null,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Active circulation transaction not found.",
      });
    }

    const book = await Book.findById(transaction.book);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book associated with this transaction was not found.",
      });
    }

    const physicalCopy = transaction.physicalCopy
      ? await PhysicalCopy.findById(transaction.physicalCopy)
      : null;

    if (!physicalCopy) {
      return res.status(404).json({
        success: false,
        message:
          "The physical copy associated with this transaction was not found.",
      });
    }

    /*
     * Older physical-copy records may have been created
     * before copyNumber became required.
     *
     * Generate a stable numeric copy number before saving.
     */
    if (!physicalCopy.copyNumber) {
      const existingCopyNumbers = await PhysicalCopy.find({
        book: transaction.book,
        copyNumber: {
          $exists: true,
          $ne: null,
        },
      })
        .select("copyNumber")
        .lean();

      const usedNumbers = existingCopyNumbers
        .map((copy) => Number(copy.copyNumber))
        .filter(Number.isInteger);

      const nextNumber =
        usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;

      physicalCopy.copyNumber = nextNumber;
    }

    /*
     * Validate the physical copy state before
     * changing inventory.
     */
    /*
     * ============================================================
     * VALIDATE PHYSICAL COPY
     * ============================================================
     *
     * The physical copy must:
     *
     * 1. Belong to the same book as the circulation transaction.
     * 2. Currently be ISSUED.
     * 3. Currently be issued to the same student.
     *
     * This prevents a different physical copy from being
     * accidentally returned against this transaction.
     */

    if (
      physicalCopy.book?.toString() !== transaction.book.toString() ||
      physicalCopy.status !== "issued" ||
      physicalCopy.issuedTo?.toString() !== transaction.student.toString()
    ) {
      return res.status(409).json({
        success: false,
        message: "The physical copy does not match this active loan.",
      });
    }

    const returnedAt = new Date();

    /*
     * The librarian has physically received the book.
     *
     * Only NOW do we complete the actual loan return.
     */
    transaction.returnedAt = returnedAt;
    transaction.returnRequested = false;
    transaction.returnRequestedAt = null;

    await transaction.save();

    /*
     * The exact physical copy has been returned.
     *
     * ISSUED → AVAILABLE
     */
    physicalCopy.status = "available";
    physicalCopy.issuedTo = null;
    physicalCopy.reservedFor = null;

    await physicalCopy.save();

    /*
     * Keep Book inventory synchronized with the
     * actual physical copy.
     */
    await syncBookInventory(transaction.book);

    /*
     * The physical copy is now available.
     *
     * Automatically create the 5-student / 30-minute
     * claim batch if students are waiting.
     */
    await createAutomaticClaimBatch({
      bookId: transaction.book,
      physicalCopyId: physicalCopy._id,
    });

    /*
     * Create the actual Return transaction.
     */
    const returnTransaction = await Circulation.create({
      student: transaction.student,
      book: transaction.book,
      physicalCopy: physicalCopy._id,
      type: "Return",
      status: "Completed",
      returnedAt,
      processedBy: req.user._id,
    });

    /*
     * The returned physical copy is now available.
     *
     * IMPORTANT:
     * Do NOT automatically assign this copy to
     * the oldest pending reservation.
     *
     * The 5-student / 30-minute claim-batch system
     * will handle pending reservations.
     */

    const populatedTransaction = await Circulation.findById(
      returnTransaction._id,
    )
      .populate("student", "name email studentId")
      .populate("book", "title author isbn coverImage")
      .populate(
        "physicalCopy",
        "copyNumber barcode status condition issuedTo reservedFor",
      )
      .populate("processedBy", "name email");

    /*
     * Notify the student that the librarian has
     * actually completed the return.
     */
    await createNotification({
      recipient: transaction.student,
      title: "Book return completed",
      message: `${populatedTransaction.book.title} has been received and returned successfully.`,
      category: "announcement",
      relatedBook: populatedTransaction.book._id,
      relatedCirculation: returnTransaction._id,
    });

    return res.status(201).json({
      success: true,
      message: "Book return completed successfully.",
      transaction: populatedTransaction,
    });
  } catch (error) {
    console.error("Return book error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete the book return.",
    });
  }
};

const renewBook = async (req, res) => {
  try {
    const { transactionId, dueDate } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required.",
      });
    }

    const transaction = await Circulation.findOne({
      _id: transactionId,
      type: "Issue",
      status: "Completed",
      returnedAt: null,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Active circulation transaction not found.",
      });
    }

    const renewalCount = transaction.renewalCount || 0;

    if (renewalCount >= 2) {
      return res.status(400).json({
        success: false,
        message: "This book has reached the maximum renewal limit.",
      });
    }

    // Do not allow renewal when another student is waiting
    // for this same book.
    /*
     * ============================================================
     * CHECK RESERVATION QUEUE BEFORE RENEWAL
     * ============================================================
     *
     * Renewal is not allowed when another student is waiting
     * for the same book.
     *
     * Waiting states:
     *
     * PENDING
     *     → student is in the reservation queue
     *
     * READY
     *     → student has already won a physical-copy claim
     *
     * Both states mean the current borrower should not extend
     * the loan.
     */

    /*
     * ============================================================
     * CHECK RESERVATION QUEUE BEFORE RENEWAL
     * ============================================================
     *
     * Renewal is not allowed when another student is waiting
     * for the same book.
     *
     * PENDING:
     *   Student is waiting in the reservation queue.
     *
     * READY:
     *   Student has already claimed a physical copy and
     *   is waiting to collect it.
     */

    const waitingReservation = await Reservation.findOne({
      book: transaction.book,
      status: {
        $in: ["pending", "ready"],
      },
      student: {
        $ne: transaction.student,
      },
    })
      .sort({
        reservedAt: 1,
        createdAt: 1,
      })
      .lean();

    if (waitingReservation) {
      return res.status(400).json({
        success: false,
        message:
          "This book cannot be renewed because another student is waiting for it.",
      });
    }

    if (waitingReservation) {
      return res.status(400).json({
        success: false,
        message:
          "This book cannot be renewed because another student is waiting for it.",
      });
    }

    const currentDueDate = transaction.dueDate
      ? new Date(transaction.dueDate)
      : new Date();

    let newDueDate;

    if (dueDate) {
      newDueDate = new Date(dueDate);

      if (Number.isNaN(newDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid due date.",
        });
      }

      if (newDueDate <= currentDueDate) {
        return res.status(400).json({
          success: false,
          message: "New due date must be after the current due date.",
        });
      }
    } else {
      newDueDate = new Date(currentDueDate);
      newDueDate.setDate(newDueDate.getDate() + 14);
    }

    if (newDueDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Renewal due date must be in the future.",
      });
    }

    transaction.dueDate = newDueDate;
    transaction.renewalCount = renewalCount + 1;

    await transaction.save();

    const renewalTransaction = await Circulation.create({
      student: transaction.student,
      book: transaction.book,
      physicalCopy: transaction.physicalCopy || null,
      type: "Renew",
      status: "Completed",
      dueDate: newDueDate,
      renewalCount: transaction.renewalCount,
      processedBy: req.user._id,
    });

    const populatedTransaction = await Circulation.findById(
      renewalTransaction._id,
    )
      .populate("student", "name email studentId")
      .populate("book", "title author isbn coverImage")
      .populate("processedBy", "name email");

    await createNotification({
      recipient: transaction.student,
      title: "Book renewed successfully",
      message: `${populatedTransaction.book.title} has been renewed. Your new due date is ${newDueDate.toLocaleDateString(
        "en-IN",
      )}.`,
      category: "due",
      relatedBook: populatedTransaction.book._id,
      relatedCirculation: renewalTransaction._id,
    });

    return res.status(201).json({
      success: true,
      message: "Book renewed successfully.",
      transaction: populatedTransaction,
    });
  } catch (error) {
    console.error("Renew book error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to renew the book.",
    });
  }
};
const getLibrarianDashboard = async (req, res) => {
  try {
    const User = require("../models/User");

    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const startOfSevenDaysAgo = new Date(startOfToday);
    startOfSevenDaysAgo.setDate(startOfSevenDaysAgo.getDate() - 6);

    const [
      totalBooks,
      books,
      activeStudents,
      activeLoans,
      overdueLoans,
      todayIssues,
      todayReturns,
      activeReservations,
      recentTransactions,
      dueSoonTransactions,
    ] = await Promise.all([
      Book.countDocuments(),

      Book.find().select("availableCopies totalCopies").lean(),

      User.countDocuments({
        role: "student",
      }),

      Circulation.countDocuments({
        type: "Issue",
        status: "Completed",
        returnedAt: null,
      }),

      Circulation.countDocuments({
        type: "Issue",
        status: "Completed",
        returnedAt: null,
        dueDate: {
          $lt: now,
        },
      }),

      Circulation.countDocuments({
        type: "Issue",
        status: "Completed",
        issuedAt: {
          $gte: startOfToday,
          $lt: startOfTomorrow,
        },
      }),

      Circulation.countDocuments({
        type: "Return",
        status: "Completed",
        returnedAt: {
          $gte: startOfToday,
          $lt: startOfTomorrow,
        },
      }),

      Reservation.countDocuments({
        status: {
          $in: ["pending", "ready"],
        },
      }),

      Circulation.find({
        type: {
          $in: ["Issue", "Return"],
        },
        createdAt: {
          $gte: startOfSevenDaysAgo,
        },
      })
        .populate("student", "name")
        .populate("book", "title")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      Circulation.find({
        type: "Issue",
        status: "Completed",
        returnedAt: null,
        dueDate: {
          $gte: startOfToday,
          $lte: new Date(startOfToday.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      })
        .populate("student", "name")
        .populate("book", "title")
        .sort({ dueDate: 1 })
        .limit(10)
        .lean(),
    ]);

    const totalCopies = books.reduce(
      (sum, book) => sum + (book.totalCopies || 0),
      0,
    );

    const availableCopies = books.reduce(
      (sum, book) => sum + (book.availableCopies || 0),
      0,
    );

    const transactionsThisWeek = recentTransactions.length;

    const chartTransactions = await Circulation.find({
      type: {
        $in: ["Issue", "Return"],
      },
      createdAt: {
        $gte: startOfSevenDaysAgo,
        $lt: startOfTomorrow,
      },
    })
      .select("type createdAt")
      .lean();

    const weeklyChart = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfSevenDaysAgo);
      date.setDate(startOfSevenDaysAgo.getDate() + index);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const issues = chartTransactions.filter(
        (transaction) =>
          transaction.type === "Issue" &&
          new Date(transaction.createdAt) >= date &&
          new Date(transaction.createdAt) < nextDate,
      ).length;

      const returns = chartTransactions.filter(
        (transaction) =>
          transaction.type === "Return" &&
          new Date(transaction.createdAt) >= date &&
          new Date(transaction.createdAt) < nextDate,
      ).length;

      return {
        day: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        issue: issues,
        returnValue: returns,
      };
    });

    const activity = recentTransactions.map((transaction) => ({
      type: transaction.type,
      student: transaction.student?.name || "Unknown student",
      book: transaction.book?.title || "Unknown book",
      createdAt: transaction.createdAt,
    }));

    const dueSoon = dueSoonTransactions.map((transaction) => {
      const dueDate = new Date(transaction.dueDate);

      const startToday = new Date(startOfToday);

      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24),
      );

      let due = dueDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });

      if (daysUntilDue <= 0) {
        due = "Today";
      } else if (daysUntilDue === 1) {
        due = "Tomorrow";
      }

      return {
        title: transaction.book?.title || "Unknown book",
        student: transaction.student?.name || "Unknown student",
        due,
        dueDate: transaction.dueDate,
      };
    });

    return res.json({
      success: true,
      dashboard: {
        totalBooks,
        totalCopies,
        availableCopies,
        activeStudents,
        activeLoans,
        overdueLoans,
        todayIssues,
        todayReturns,
        activeReservations,
        transactionsThisWeek,
        weeklyChart,
        activity,
        dueSoon,
      },
    });
  } catch (error) {
    console.error("Get librarian dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load librarian dashboard.",
    });
  }
};
const getMyLoans = async (req, res) => {
  try {
    const transactions = await Circulation.find({
      student: req.user._id,
      type: "Issue",
      status: "Completed",
      returnedAt: null,
      book: { $ne: null },
    })
      .populate(
        "book",
        "title author isbn coverImage availableCopies totalCopies",
      )
      .populate(
        "physicalCopy",
        "book copyNumber barcode status issuedTo reservedFor",
      )
      .sort({ createdAt: -1 })
      .lean();

    const validTransactions = transactions.filter(
      (transaction) => transaction.book,
    );

    return res.json({
      success: true,
      transactions: validTransactions,
    });
  } catch (error) {
    console.error("Get my loans error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your active loans.",
    });
  }
};

const returnMyBook = async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required.",
      });
    }

    /*
     * Find the student's active loan.
     *
     * The book is still considered borrowed at this point.
     */
    const transaction = await Circulation.findOne({
      _id: transactionId,
      student: req.user._id,
      type: "Issue",
      status: "Completed",
      returnedAt: null,
    }).populate("book", "title author isbn coverImage");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Active loan not found.",
      });
    }

    /*
     * ============================================================
     * VALIDATE PHYSICAL COPY
     * ============================================================
     *
     * The student's active circulation must point to a physical
     * copy that is currently issued to that same student.
     *
     * The student only submits a return REQUEST here.
     *
     * The librarian will actually complete the return later.
     */

    const physicalCopy = transaction.physicalCopy
      ? await PhysicalCopy.findById(transaction.physicalCopy)
      : null;

    if (!physicalCopy) {
      return res.status(409).json({
        success: false,
        message:
          "The physical copy associated with this loan could not be found.",
      });
    }

    if (
      physicalCopy.status !== "issued" ||
      physicalCopy.issuedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(409).json({
        success: false,
        message: "The physical copy does not match your active loan.",
      });
    }

    /*
     * Prevent duplicate return requests.
     */
    if (transaction.returnRequested) {
      return res.status(409).json({
        success: false,
        message: "A return request has already been submitted.",
      });
    }

    /*
     * IMPORTANT:
     *
     * We DO NOT:
     * - set returnedAt
     * - increase availableCopies
     * - create a Return transaction
     * - promote a reservation
     *
     * The student has only requested a return.
     */
    transaction.returnRequested = true;
    transaction.returnRequestedAt = new Date();

    await transaction.save();

    /*
     * Notify the student that the request was recorded.
     */
    await createNotification({
      recipient: req.user._id,
      title: "Return request submitted",
      message: `${transaction.book.title} return request has been submitted. Please give the physical book to the librarian for confirmation.`,
      category: "announcement",
      relatedBook: transaction.book._id,
      relatedCirculation: transaction._id,
    });

    /*
     * Notify librarians that a physical return
     * is waiting to be received.
     */
    const User = require("../models/User");

    const librarians = await User.find({
      role: "librarian",
    })
      .select("_id")
      .lean();

    for (const librarian of librarians) {
      await createNotification({
        recipient: librarian._id,
        title: "Return request received",
        message: `${req.user.name} has requested to return "${transaction.book.title}". Please receive the physical book and complete the return.`,
        category: "announcement",
        relatedBook: transaction.book._id,
        relatedCirculation: transaction._id,
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Return request submitted. Please give the book to the librarian.",
      transaction,
    });
  } catch (error) {
    console.error("Return request error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit the return request.",
    });
  }
};

module.exports = {
  getCirculation,
  getStudentsForCirculation,
  getBooksForCirculation,
  issueBook,
  returnBook,
  renewBook,
  getLibrarianDashboard,
  getMyLoans,
  returnMyBook,
};
