import { NextResponse } from "next/server";
import { errorResponse, readBookingInput } from "@/lib/bookings/api";
import { removeBooking, updateBooking } from "@/lib/bookings/store";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const booking = updateBooking(id, await readBookingInput(request));
    return NextResponse.json(booking);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    removeBooking(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
