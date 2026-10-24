import { MAX_TITLE_LENGTH, WORKING_DAY } from "./constants";
import { describeMinutes, formatLocalDate, isValidDate, isValidTime, timeToMinutes } from "./time";
import type { Booking, BookingInput } from "./types";

export type ValidationResult =
  | { ok: true }
  | { ok: false; kind: "invalid" | "conflict"; message: string };

export interface ValidateOptions {
  excludeId?: string | undefined;
  previous?: Booking | undefined;
  now?: Date;
}

const invalid = (message: string): ValidationResult => ({ ok: false, kind: "invalid", message });

export function validateBooking(
  input: BookingInput,
  existing: readonly Booking[],
  options: ValidateOptions = {},
): ValidationResult {
  const { excludeId, previous, now = new Date() } = options;
  const { slotMinutes, minimumBookingMinutes, maximumBookingMinutes } = WORKING_DAY;

  if (!isValidDate(input.date)) return invalid("Choose a valid calendar date.");
  if (!isValidTime(input.start) || !isValidTime(input.end)) {
    return invalid("Enter a valid start and end time.");
  }
  if ((input.title?.trim().length ?? 0) > MAX_TITLE_LENGTH) {
    return invalid(`Meeting name must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  }

  const start = timeToMinutes(input.start);
  const end = timeToMinutes(input.end);

  if (start >= end) return invalid("The end time must be after the start time.");
  if (start < WORKING_DAY.startMinutes || end > WORKING_DAY.endMinutes) {
    return invalid(`Bookings must be between ${WORKING_DAY.startTime} and ${WORKING_DAY.endTime}.`);
  }
  if (start % slotMinutes !== 0 || end % slotMinutes !== 0) {
    return invalid(`Start and end times must be in ${slotMinutes}-minute steps.`);
  }
  if (end - start < minimumBookingMinutes) {
    return invalid(`Bookings must be at least ${describeMinutes(minimumBookingMinutes)} long.`);
  }
  if (end - start > maximumBookingMinutes) {
    return invalid(`Bookings cannot be longer than ${describeMinutes(maximumBookingMinutes)}.`);
  }

  const startUnchanged =
    previous !== undefined && previous.date === input.date && previous.start === input.start;
  if (!startUnchanged) {
    const today = formatLocalDate(now);
    if (input.date < today) return invalid("Bookings cannot be made on a past date.");
    if (input.date === today && start <= now.getHours() * 60 + now.getMinutes()) {
      return invalid("The start time must be in the future.");
    }
  }

  const overlaps = existing.some(
    (booking) =>
      booking.id !== excludeId &&
      booking.date === input.date &&
      start < timeToMinutes(booking.end) &&
      end > timeToMinutes(booking.start),
  );
  if (overlaps) {
    return {
      ok: false,
      kind: "conflict",
      message: "That time overlaps another meeting. Please choose a different time.",
    };
  }

  return { ok: true };
}
