import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateBooking, type ValidateOptions, type ValidationResult } from "./rules";
import type { Booking, BookingInput } from "./types";

const now = new Date(2026, 9, 24, 12, 0);
const today = "2026-10-24";
const tomorrow = "2026-10-25";

function validate(
  input: BookingInput,
  existing: Booking[] = [],
  options: ValidateOptions = {},
): ValidationResult {
  return validateBooking(input, existing, { now, ...options });
}

function failure(result: ValidationResult) {
  assert.equal(result.ok, false);
  if (result.ok) throw new Error("expected a failure");
  return result;
}

describe("working hours and duration", () => {
  it("accepts a valid booking", () => {
    assert.deepEqual(validate({ date: tomorrow, start: "09:00", end: "10:00" }), { ok: true });
  });

  it("accepts the edges of the working day", () => {
    assert.deepEqual(validate({ date: tomorrow, start: "17:00", end: "18:00" }), { ok: true });
  });

  it("rejects times outside the working day", () => {
    const early = failure(validate({ date: tomorrow, start: "08:30", end: "09:30" }));
    const late = failure(validate({ date: tomorrow, start: "17:30", end: "18:30" }));
    assert.match(early.message, /between 09:00 and 18:00/);
    assert.match(late.message, /between 09:00 and 18:00/);
  });

  it("requires start < end", () => {
    assert.match(
      failure(validate({ date: tomorrow, start: "10:00", end: "10:00" })).message,
      /after the start/,
    );
    assert.match(
      failure(validate({ date: tomorrow, start: "11:00", end: "10:00" })).message,
      /after the start/,
    );
  });

  it("enforces the 30 minute minimum and 2 hour maximum", () => {
    assert.deepEqual(validate({ date: tomorrow, start: "09:00", end: "09:30" }), { ok: true });
    assert.deepEqual(validate({ date: tomorrow, start: "09:00", end: "11:00" }), { ok: true });
    assert.match(
      failure(validate({ date: tomorrow, start: "09:00", end: "11:30" })).message,
      /longer than 2 hours/,
    );
  });

  it("enforces 30 minute steps", () => {
    assert.match(
      failure(validate({ date: tomorrow, start: "09:10", end: "10:00" })).message,
      /30-minute steps/,
    );
    assert.match(
      failure(validate({ date: tomorrow, start: "09:00", end: "09:45" })).message,
      /30-minute steps/,
    );
  });
});

describe("input shape", () => {
  it("rejects impossible dates and malformed times", () => {
    assert.match(
      failure(validate({ date: "2026-02-30", start: "09:00", end: "10:00" })).message,
      /valid calendar date/,
    );
    assert.match(
      failure(validate({ date: tomorrow, start: "9:00", end: "10:00" })).message,
      /valid start and end/,
    );
  });

  it("measures the title after trimming", () => {
    const padded = `  ${"a".repeat(120)}  `;
    assert.deepEqual(validate({ date: tomorrow, start: "09:00", end: "10:00", title: padded }), {
      ok: true,
    });
    assert.match(
      failure(validate({ date: tomorrow, start: "09:00", end: "10:00", title: "a".repeat(121) }))
        .message,
      /120 characters/,
    );
  });
});

describe("the past", () => {
  it("rejects past dates", () => {
    const result = failure(validate({ date: "2026-10-23", start: "10:00", end: "11:00" }));
    assert.equal(result.kind, "invalid");
    assert.match(result.message, /past date/);
  });

  it("rejects slots that already started today", () => {
    assert.match(
      failure(validate({ date: today, start: "11:30", end: "12:30" })).message,
      /future/,
    );
    assert.match(
      failure(validate({ date: today, start: "12:00", end: "13:00" })).message,
      /future/,
    );
    assert.deepEqual(validate({ date: today, start: "12:30", end: "13:00" }), { ok: true });
  });

  it("lets a meeting under way be edited while its start is unchanged", () => {
    const underWay: Booking = { id: "u", date: today, start: "11:00", end: "12:30" };
    const options = { excludeId: "u", previous: underWay };

    assert.deepEqual(
      validate({ date: today, start: "11:00", end: "12:30", title: "Renamed" }, [underWay], options),
      { ok: true },
    );
    assert.match(
      failure(validate({ date: today, start: "11:30", end: "12:30" }, [underWay], options)).message,
      /future/,
    );
    assert.match(
      failure(validate({ date: today, start: "11:00", end: "12:30" })).message,
      /future/,
    );
  });
});

describe("overlaps", () => {
  const existing: Booking[] = [
    { id: "a", date: tomorrow, start: "09:00", end: "10:00" },
    { id: "b", date: today, start: "14:00", end: "15:00" },
  ];

  it("reports an overlap as a conflict", () => {
    const result = failure(validate({ date: tomorrow, start: "09:30", end: "10:30" }, existing));
    assert.equal(result.kind, "conflict");
  });

  it("allows touching edges", () => {
    assert.deepEqual(validate({ date: tomorrow, start: "10:00", end: "11:00" }, existing), {
      ok: true,
    });  });

  it("ignores bookings on other dates", () => {
    assert.deepEqual(validate({ date: "2026-10-26", start: "09:00", end: "10:00" }, existing), {
      ok: true,
    });
  });

  it("never conflicts with the booking being edited", () => {
    assert.deepEqual(
      validate({ date: tomorrow, start: "09:00", end: "10:00" }, existing, { excludeId: "a" }),
      { ok: true },
    );
  });
});
