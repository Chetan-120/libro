const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Book = require("./models/Book");
const PhysicalCopy = require("./models/PhysicalCopy");

dotenv.config();

const verifyPhysicalCopies = async () => {
  const total = await PhysicalCopy.countDocuments();

  const available = await PhysicalCopy.countDocuments({
    status: "available",
  });

  const issued = await PhysicalCopy.countDocuments({
    status: "issued",
  });

  const reserved = await PhysicalCopy.countDocuments({
    status: "reserved",
  });

  console.log("================================");
  console.log("PHYSICAL COPY STATUS");
  console.log("Total:", total);
  console.log("Available:", available);
  console.log("Issued:", issued);
  console.log("Reserved:", reserved);
  console.log("================================");
};

const createPhysicalCopies = async () => {
  try {
    await connectDB();

    const books = await Book.find();

    let created = 0;

    for (const book of books) {
      const existingCopies = await PhysicalCopy.find({
        book: book._id,
      }).sort({ copyNumber: 1 });

      const existingCount = existingCopies.length;
      const requiredCount = Number(book.totalCopies) || 0;

      if (existingCount >= requiredCount) {
        continue;
      }

      for (
        let copyNumber = existingCount + 1;
        copyNumber <= requiredCount;
        copyNumber++
      ) {
        const shortBookId = book._id.toString().slice(-6).toUpperCase();

        const barcode = `LIBRO-${shortBookId}-${String(copyNumber).padStart(
          3,
          "0",
        )}`;

        await PhysicalCopy.create({
          book: book._id,
          copyNumber,
          barcode,
          status: "available",
          condition: "good",
          issuedTo: null,
          reservedFor: null,
        });

        created++;
      }
    }

    console.log("================================");
    console.log("PHYSICAL COPY SYNC COMPLETE");
    console.log("Created:", created);
    console.log("================================");

    process.exit(0);
  } catch (error) {
    console.error("Physical copy sync failed:", error);
    process.exit(1);
  }
};

createPhysicalCopies().then(async () => {
  await verifyPhysicalCopies();
});
