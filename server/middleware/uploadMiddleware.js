const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

/*
 * ============================================================
 * BOOK COVER UPLOAD DIRECTORY
 * ============================================================
 */

const uploadDirectory = path.join(__dirname, "../uploads/books");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

/*
 * ============================================================
 * STORAGE
 * ============================================================
 */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueId = crypto.randomBytes(12).toString("hex");

    const filename = `book-${Date.now()}-${uniqueId}${extension}`;

    cb(null, filename);
  },
});

/*
 * ============================================================
 * FILE FILTER
 * ============================================================
 *
 * Libro currently supports:
 *
 * JPG
 * PNG
 * WEBP
 */

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG and WEBP images are allowed."));
  }
};

/*
 * ============================================================
 * MULTER CONFIGURATION
 * ============================================================
 */

const upload = multer({
  storage,
  fileFilter,

  limits: {
    /*
     * Maximum book-cover size:
     *
     * 5 MB
     */

    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
