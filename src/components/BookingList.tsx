import { PencilIcon, TrashIcon } from "@/components/icons";
import { getBookingTitle } from "@/lib/bookings/booking";
import { ROOM } from "@/lib/bookings/constants";
import { getBookingDuration } from "@/lib/bookings/time";
import type { Booking } from "@/lib/bookings/types";

interface BookingListProps {
  bookings: Booking[];
  deletingId: string | null;
  disabled: boolean;
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
}

export default function BookingList({
  bookings,
  deletingId,
  disabled,
  onEdit,
  onDelete,
}: BookingListProps) {
  return (
    <section aria-label="Bookings for this date" className="booking-list">
      <h3 className="booking-list-heading">
        Bookings for this day
        <span>
          {bookings.length} {bookings.length === 1 ? "meeting" : "meetings"}
        </span>
      </h3>
      <p className="sr-only" role="status">
        {deletingId ? "Deleting booking…" : ""}
      </p>
      {bookings.map((booking) => {
        const title = getBookingTitle(booking);
        const label = `${title}, ${booking.start} to ${booking.end}`;
        const deleting = deletingId === booking.id;

        return (
          <article className="booking-list-item" key={booking.id}>
            <div aria-hidden="true" className="booking-color-bar" />
            <div className="booking-list-time">
              <time dateTime={booking.start}>{booking.start}</time>
              <span aria-hidden="true">—</span>
              <time dateTime={booking.end}>{booking.end}</time>
            </div>
            <div className="booking-list-details">
              <strong>{title}</strong>
              <span>
                {ROOM.name} · {getBookingDuration(booking.start, booking.end)} min
              </span>
            </div>
            <div className="booking-actions">
              <button
                aria-label={`Edit ${label}`}
                className="icon-button"
                disabled={disabled}
                onClick={() => onEdit(booking)}
                type="button"
              >
                <PencilIcon />
              </button>
              <button
                aria-busy={deleting}
                aria-label={`Delete ${label}`}
                className="icon-button delete-button"
                disabled={disabled}
                onClick={() => onDelete(booking)}
                type="button"
              >
                {deleting ? <span aria-hidden="true" className="spinner spinner-dark" /> : <TrashIcon />}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
