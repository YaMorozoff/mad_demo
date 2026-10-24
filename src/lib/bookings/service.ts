import { isBooking } from "./guards";
import type { ApiError, Booking, BookingInput } from "./types";

const NETWORK_ERROR = "Can't reach the server. Check your connection and try again.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

export class BookingApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "BookingApiError";
  }
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof BookingApiError ? error.message : fallback;
}

function expectBooking(payload: unknown): Booking {
  if (!isBooking(payload)) throw new BookingApiError(GENERIC_ERROR, 502);
  return payload;
}

async function request(url: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new BookingApiError(NETWORK_ERROR, 0);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && typeof (payload as ApiError).error === "string"
        ? (payload as ApiError).error
        : GENERIC_ERROR;
    throw new BookingApiError(message, response.status);
  }
  return payload;
}

function withJsonBody(method: "POST" | "PATCH", body: BookingInput): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function fetchBookings(date: string, signal?: AbortSignal): Promise<Booking[]> {
  const query = new URLSearchParams({ date });
  const payload = await request(`/api/bookings?${query.toString()}`, {
    signal: signal ?? null,
    cache: "no-store",
  });
  const bookings =
    payload && typeof payload === "object" ? (payload as { bookings?: unknown }).bookings : null;
  if (!Array.isArray(bookings) || !bookings.every(isBooking)) {
    throw new BookingApiError(GENERIC_ERROR, 502);
  }
  return bookings;
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  return expectBooking(await request("/api/bookings", withJsonBody("POST", input)));
}

export async function updateBooking(id: string, input: BookingInput): Promise<Booking> {
  const url = `/api/bookings/${encodeURIComponent(id)}`;
  return expectBooking(await request(url, withJsonBody("PATCH", input)));
}

export async function deleteBooking(id: string): Promise<void> {
  await request(`/api/bookings/${encodeURIComponent(id)}`, { method: "DELETE" });
}
