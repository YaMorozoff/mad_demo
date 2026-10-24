export interface Booking {
  id: string;
  date: string;
  start: string;
  end: string;
  title?: string;
}

export type BookingInput = Omit<Booking, "id">;

export interface ApiError {
  error: string;
}

export interface BookingResponse {
  bookings: Booking[];
}
