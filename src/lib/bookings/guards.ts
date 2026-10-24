import type { Booking, BookingInput } from "./types";

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

export function isBooking(value: unknown): value is Booking {
  return isBookingInput(value) && typeof (value as { id?: unknown }).id === "string";
}
