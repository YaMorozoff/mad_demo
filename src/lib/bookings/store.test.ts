import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BookingError } from "./errors";
import { createBooking, listBookings, removeBooking, updateBooking } from "./store";

const day = "2099-01-05";

function statusOf(action: () => unknown): number | null {
  try {
    action();
    return null;
  } catch (error) {
    assert.ok(error instanceof BookingError);
    return error.status;
  }
}

describe("store", () => {
  it("creates bookings, trims titles and lists them sorted per date", () => {
    const late = createBooking({ date: day, start: "15:00", end: "16:00", title: "  Late  " });
    const early = createBooking({ date: day, start: "09:00", end: "10:00" });

    assert.equal(late.title, "Late");
    assert.equal("title" in early, false);
    assert.deepEqual(listBookings(day).map((booking) => booking.start), ["09:00", "15:00"]);
    assert.deepEqual(listBookings("2099-01-06"), []);
  });

  it("answers 409 for an overlap and 422 for a rule violation", () => {
    assert.equal(statusOf(() => createBooking({ date: day, start: "09:30", end: "10:30" })), 409);
    assert.equal(statusOf(() => createBooking({ date: day, start: "11:00", end: "14:00" })), 422);
  });

  it("allows touching bookings", () => {
    const touching = createBooking({ date: day, start: "10:00", end: "11:00" });
    assert.equal(touching.start, "10:00");
    assert.equal(removeBooking(touching.id), true);
  });

  it("updates without conflicting with itself and answers 404 for unknown ids", () => {
    const [first] = listBookings(day);
    assert.ok(first);

    const updated = updateBooking(first.id, { date: day, start: "09:00", end: "10:30", title: "Longer" });
    assert.equal(updated.end, "10:30");
    assert.equal(
      statusOf(() => updateBooking("missing", { date: day, start: "11:00", end: "12:00" })),
      404,
    );
  });

  it("removes idempotently", () => {
    const [first] = listBookings(day);
    assert.ok(first);
    assert.equal(removeBooking(first.id), true);
    assert.equal(removeBooking(first.id), false);
  });
});
