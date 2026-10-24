import { NextResponse } from "next/server";
import { BadRequestError, BookingError } from "./errors";
import { isBookingInput } from "./guards";
import { isValidDate } from "./time";
import type { BookingInput } from "./types";

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof BookingError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

export async function readBookingInput(request: Request): Promise<BookingInput> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }
  if (!isBookingInput(payload)) {
    throw new BadRequestError("A date, start time, and end time are required.");
  }
  return payload;
}

export function readDateParam(request: Request): string {
  const date = new URL(request.url).searchParams.get("date");
  if (!date || !isValidDate(date)) {
    throw new BadRequestError("A valid date (YYYY-MM-DD) is required.");
  }
  return date;
}
