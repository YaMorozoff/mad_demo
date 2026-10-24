import type { Booking, BookingInput } from "./types";

export function normalizeBookingInput(input: BookingInput): BookingInput {
  const title = input.title?.trim();
  return {
    date: input.date,
    start: input.start,
    end: input.end,
    ...(title ? { title } : {}),
  };
}

export function sortBookings(bookings: readonly Booking[]): Booking[] {
  return [...bookings].sort(
    (first, second) => first.start.localeCompare(second.start) || first.id.localeCompare(second.id),
  );
}

export function getBookingTitle(booking: Pick<Booking, "title">): string {
  return booking.title || "Meeting";
}
