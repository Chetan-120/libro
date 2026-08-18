const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");

dotenv.config();

const seedUsers = async () => {
  try {
    await connectDB();

    // =========================================================
    // PASSWORDS
    // =========================================================

    const studentPassword = await bcrypt.hash("Student@123", 10);
    const librarianPassword = await bcrypt.hash("Librarian@123", 10);

    // =========================================================
    // STUDENT 1
    // =========================================================

    await User.findOneAndUpdate(
      {
        email: "chetan@libro.com",
      },
      {
        $set: {
          name: "Chetan",
          password: studentPassword,
          role: "student",
          studentId: "LIB2026001",
          isActive: true,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    );

    // =========================================================
    // STUDENT 2
    // =========================================================

    await User.findOneAndUpdate(
      {
        email: "karan@libro.com",
      },
      {
        $set: {
          name: "Karan",
          password: studentPassword,
          role: "student",
          studentId: "LIB2026002",
          isActive: true,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    );

    // =========================================================
    // LIBRARIAN
    // =========================================================

    await User.findOneAndUpdate(
      {
        email: "librarian@libro.com",
      },
      {
        $set: {
          name: "Librarian",
          password: librarianPassword,
          role: "librarian",
          studentId: null,
          isActive: true,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      },
    );

    // =========================================================
    // SUCCESS
    // =========================================================

    console.log("");
    console.log("========================================");
    console.log("      LIBRO USERS SEEDED SUCCESSFULLY");
    console.log("========================================");
    console.log("");
    console.log("Students:");
    console.log("1. chetan@libro.com");
    console.log("   Password: Student@123");
    console.log("   Student ID: LIB2026001");
    console.log("");
    console.log("2. karan@libro.com");
    console.log("   Password: Student@123");
    console.log("   Student ID: LIB2026002");
    console.log("");
    console.log("Librarian:");
    console.log("1. librarian@libro.com");
    console.log("   Password: Librarian@123");
    console.log("");
    console.log("All accounts are active.");
    console.log("========================================");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error("       LIBRO USER SEEDING FAILED");
    console.error("========================================");
    console.error(error.message);
    console.error("");

    process.exit(1);
  }
};

seedUsers();
