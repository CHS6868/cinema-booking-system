const express = require("express");
const db = require("../database/db");
const { requireAuth } = require("../auth/session");

const router = express.Router();

function cancellationError(status, message) {
  const error = new Error(message);
  error.httpStatus = status;
  return error;
}

// PATCH /api/bookings/:id/cancel
router.patch("/:id/cancel", requireAuth, (req, res) => {
  const bookingId = Number(req.params.id);
  if (!Number.isSafeInteger(bookingId) || bookingId < 1) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

  let transactionStarted = false;
  try {
    db.exec("BEGIN IMMEDIATE");
    transactionStarted = true;

    // Restrict lookup to the authenticated user's own bookings.
    const booking = db.prepare(`
      SELECT b.id, b.status, s.date, s.time
      FROM bookings AS b
      JOIN showtimes AS s ON s.id = b.showtime_id
      WHERE b.id = ? AND b.user_id = ?
    `).get(bookingId, req.user.id);

    if (!booking) {
      throw cancellationError(404, "Booking not found");
    }
    if (booking.status !== "CONFIRMED") {
      throw cancellationError(409, "Booking is not confirmed");
    }

    const startsAt = new Date(`${booking.date}T${booking.time}:00`);
    if (Number.isNaN(startsAt.getTime())) {
      throw new Error("Invalid showtime date or time in database");
    }
    if (startsAt.getTime() <= Date.now()) {
      throw cancellationError(400, "Cannot cancel a showtime that has started");
    }

    const bookingUpdate = db.prepare(`
      UPDATE bookings
      SET status = 'CANCELLED'
      WHERE id = ? AND user_id = ? AND status = 'CONFIRMED'
    `).run(bookingId, req.user.id);

    const seatUpdate = db.prepare(`
      UPDATE booking_seats
      SET status = 'CANCELLED'
      WHERE booking_id = ? AND status = 'CONFIRMED'
    `).run(bookingId);

    if (Number(bookingUpdate.changes) !== 1 || Number(seatUpdate.changes) < 1) {
      throw new Error("Booking or seat state is inconsistent");
    }

    db.exec("COMMIT");
    transactionStarted = false;
    return res.status(200).json({
      message: "Booking cancelled successfully",
      bookingId,
      status: "CANCELLED",
      releasedSeats: Number(seatUpdate.changes)
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        db.exec("ROLLBACK");
      } catch (rollbackError) {
        console.error("Cancellation rollback failed:", rollbackError);
      }
    }
    if (error.httpStatus) {
      return res.status(error.httpStatus).json({ message: error.message });
    }
    console.error("Cancellation API error:", error);
    return res.status(500).json({ message: "Unable to cancel booking" });
  }
});

module.exports = router;
