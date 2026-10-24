import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  describeMinutes,
  getDefaultSlot,
  getEarliestStart,
  isValidDate,
  isValidTime,
  minutesToTime,
  timeToMinutes,
} from "./time";

const today = "2026-10-24";
const tomorrow = "2026-10-25";
const at = (hour: number, minute = 0) => new Date(2026, 9, 24, hour, minute);

describe("parsing", () => {
  it("round-trips times", () => {
    assert.equal(timeToMinutes("09:30"), 570);
    assert.equal(minutesToTime(570), "09:30");
  });

  it("validates dates and times", () => {
    assert.equal(isValidDate("2026-02-28"), true);
    assert.equal(isValidDate("2026-02-30"), false);
    assert.equal(isValidDate("26-02-28"), false);
    assert.equal(isValidTime("23:59"), true);
    assert.equal(isValidTime("24:00"), false);
    assert.equal(isValidTime("9:00"), false);
  });

  it("describes durations", () => {
    assert.equal(describeMinutes(30), "30 minutes");
    assert.equal(describeMinutes(60), "1 hour");
    assert.equal(describeMinutes(120), "2 hours");
  });
});

describe("earliest start and default slot", () => {
  it("starts the working day on any other date", () => {
    assert.equal(getEarliestStart(tomorrow, at(15)), 9 * 60);
    assert.deepEqual(getDefaultSlot(tomorrow, at(15)), { start: "09:00", end: "10:00" });
  });

  it("is the next slot boundary strictly after now", () => {
    assert.equal(getEarliestStart(today, at(10, 15)), 10 * 60 + 30);
    assert.equal(getEarliestStart(today, at(10, 0)), 10 * 60 + 30);
    assert.equal(getEarliestStart(today, at(10, 30)), 11 * 60);
  });

  it("never goes before the working day", () => {
    assert.equal(getEarliestStart(today, at(7, 0)), 9 * 60);
  });

  it("keeps the default slot inside the working day", () => {
    assert.deepEqual(getDefaultSlot(today, at(19, 0)), { start: "17:00", end: "18:00" });
    assert.deepEqual(getDefaultSlot(today, at(10, 15)), { start: "10:30", end: "11:30" });
  });
});
