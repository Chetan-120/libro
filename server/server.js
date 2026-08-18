const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const bookRoutes = require("./routes/bookRoutes");
const physicalCopyRoutes = require("./routes/physicalCopyRoutes");
const circulationRoutes = require("./routes/circulationRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const reservationClaimRoutes = require("./routes/reservationClaimRoutes");
const fineRoutes = require("./routes/fineRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// Reservation workers
const {
  expireReadyReservations,
} = require("./controllers/reservationController");

const { expireClaimBatches } = require("./services/reservationClaimService");

dotenv.config();

const app = express();

/*
 * ============================================================
 * DATABASE
 * ============================================================
 */

connectDB();

/*
 * ============================================================
 * MIDDLEWARE
 * ============================================================
 */

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    limit: "10mb",
    extended: true,
  }),
);

/*
 * ============================================================
 * API ROUTES
 * ============================================================
 */

app.use("/api/auth", authRoutes);

app.use("/api/books", bookRoutes);

app.use("/api/reservations", reservationRoutes);

app.use("/api/circulation", circulationRoutes);

app.use("/api/fines", fineRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/users", userRoutes);

app.use("/api/reservation-claims", reservationClaimRoutes);

/*
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Libro API is running.",
  });
});

/*
 * ============================================================
 * API HEALTH CHECK
 * ============================================================
 */

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Libro backend is healthy.",
  });
});

/*
 * ============================================================
 * 404 HANDLER
 * ============================================================
 */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
 * ============================================================
 * ERROR HANDLER
 * ============================================================
 */

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error.",
  });
});

/*
 * ============================================================
 * RESERVATION WORKERS
 * ============================================================
 *
 * These workers keep the reservation system alive without
 * requiring a user or librarian to open the application.
 *
 * 1. Claim batches:
 *    30-minute claim window
 *
 * 2. Ready reservations:
 *    2-day pickup window
 *
 * Both are checked every minute.
 */

const RESERVATION_WORKER_INTERVAL = 60 * 1000;

let reservationWorkerRunning = false;

const runReservationWorkers = async () => {
  /*
   * Prevent overlapping worker runs.
   */

  if (reservationWorkerRunning) {
    return;
  }

  reservationWorkerRunning = true;

  try {
    await expireClaimBatches();

    await expireReadyReservations();
  } catch (error) {
    console.error("Reservation worker error:", error);
  } finally {
    reservationWorkerRunning = false;
  }
};

/*
 * ============================================================
 * SERVER START
 * ============================================================
 */

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Libro server running on http://localhost:${PORT}`);

  /*
   * Run once immediately when the
   * server starts.
   */

  runReservationWorkers();

  /*
   * Continue checking every minute.
   */

  setInterval(runReservationWorkers, RESERVATION_WORKER_INTERVAL);
});

/*
 * ============================================================
 * GRACEFUL SHUTDOWN
 * ============================================================
 */

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down Libro server...`);

  server.close(() => {
    console.log("Libro server stopped.");

    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));

process.on("SIGTERM", () => shutdown("SIGTERM"));
