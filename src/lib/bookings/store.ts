import { randomUUID } from "node:crypto";
import { normalizeBookingInput, sortBookings } from "./booking";
import { BookingConflictError, BookingNotFoundError, BookingValidationError } from "./errors";
import { validateBooking, type ValidationResult } from "./rules";
import type { Booking, BookingInput } from "./types";

interface BookingStoreState {
  bookings: Booking[];
}

const globalStore = globalThis as typeof globalThis & {
  meetingRoomBookingStore?: BookingStoreState;
};

const store: BookingStoreState = (globalStore.meetingRoomBookingStore ??= { bookings: [] });

function assertValid(result: ValidationResult): void {
  if (result.ok) return;
  throw result.kind === "conflict"
    ? new BookingConflictError(result.message)
    : new BookingValidationError(result.message);
}

export function listBookings(date: string): Booking[] {
  return sortBookings(store.bookings.filter((booking) => booking.date === date));
}

export function createBooking(input: BookingInput): Booking {
  const normalized = normalizeBookingInput(input);
  assertValid(validateBooking(normalized, store.bookings));

  const booking: Booking = { id: randomUUID(), ...normalized };
  store.bookings.push(booking);
  return booking;
}

export function updateBooking(id: string, input: BookingInput): Booking {
  const index = store.bookings.findIndex((booking) => booking.id === id);
  const previous = store.bookings[index];
  if (index === -1 || !previous) throw new BookingNotFoundError();

  const normalized = normalizeBookingInput(input);
  assertValid(validateBooking(normalized, store.bookings, { excludeId: id, previous }));

  const updated: Booking = { id, ...normalized };
  store.bookings[index] = updated;
  return updated;
}

export function removeBooking(id: string): boolean {
  const index = store.bookings.findIndex((booking) => booking.id === id);
  if (index === -1) return false;
  store.bookings.splice(index, 1);
  return true;
}
