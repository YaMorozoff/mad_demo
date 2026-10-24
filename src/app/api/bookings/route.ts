import { NextResponse } from "next/server";
import { errorResponse, readBookingInput, readDateParam } from "@/lib/bookings/api";
import { createBooking, listBookings } from "@/lib/bookings/store";

export async function GET(request: Request) {
  try {
    return NextResponse.json({ bookings: listBookings(readDateParam(request)) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const booking = createBooking(await readBookingInput(request));
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
