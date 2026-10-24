import type { Booking, BookingInput } from "./types";

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export const WORKING_DAY = {
  startHour: 9,
  endHour: 18,
  startMinutes: 9 * 60,
  endMinutes: 18 * 60,
  durationMinutes: (18 - 9) * 60,
  minimumBookingMinutes: 30,
  maximumBookingMinutes: 120,
} as const;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isBookingInput(value: unknown): value is BookingInput {
  if (!value || typeof value !== "object") return false;

  const input = value as Record<string, unknown>;
  return (
    typeof input.date === "string" &&
    typeof input.start === "string" &&
    typeof input.end === "string" &&
    (input.title === undefined || typeof input.title === "string")
  );
}

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function timeToMinutes(value: string): number {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}

export function getTimelinePosition(time: string): number {
  return ((timeToMinutes(time) - WORKING_DAY.startMinutes) / WORKING_DAY.durationMinutes) * 100;
}

export function getTimelinePositionAtHour(hour: number): number {
  return ((hour * 60 - WORKING_DAY.startMinutes) / WORKING_DAY.durationMinutes) * 100;
}

export function getTimelineDuration(start: string, end: string): number {
  return ((timeToMinutes(end) - timeToMinutes(start)) / WORKING_DAY.durationMinutes) * 100;
}

export function getBookingDuration(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start);
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function validateBooking(
  input: BookingInput,
  bookings: Booking[],
  excludedId?: string,
  now = new Date(),
): ValidationResult {
  if (!isValidDate(input.date)) {
    return { valid: false, message: "Choose a valid calendar date." };
  }
  if (!TIME_PATTERN.test(input.start) || !TIME_PATTERN.test(input.end)) {
    return { valid: false, message: "Enter a valid start and end time." };
  }

  const start = timeToMinutes(input.start);
  const end = timeToMinutes(input.end);

  if (start >= end) {
    return { valid: false, message: "The end time must be after the start time." };
  }
  if (start < WORKING_DAY.startMinutes || end > WORKING_DAY.endMinutes) {
    return { valid: false, message: "Bookings must be between 09:00 and 18:00." };
  }
  if (end - start < WORKING_DAY.minimumBookingMinutes) {
    return { valid: false, message: "Bookings must be at least 30 minutes long." };
  }
  if (end - start > WORKING_DAY.maximumBookingMinutes) {
    return { valid: false, message: "Bookings cannot be longer than 2 hours." };
  }

  const today = formatLocalDate(now);
  if (input.date < today) {
    return { valid: false, message: "Bookings cannot be made on a past date." };
  }
  if (input.date === today && start <= now.getHours() * 60 + now.getMinutes()) {
    return { valid: false, message: "The start time must be in the future." };
  }

  const conflict = bookings.some((booking) => {
    if (booking.id === excludedId || booking.date !== input.date) return false;
    return start < timeToMinutes(booking.end) && end > timeToMinutes(booking.start);
  });
  if (conflict) {
    return {
      valid: false,
      message: "That time overlaps another meeting. Please choose a different time.",
    };
  }

  if (input.title && input.title.trim().length > 120) {
    return { valid: false, message: "Meeting name must be 120 characters or fewer." };
  }

  return { valid: true };
}
