import { getBookingTitle } from "@/lib/bookings/booking";
import { WORKING_DAY } from "@/lib/bookings/constants";
import {
  getTimelineDuration,
  getTimelinePosition,
  getTimelinePositionAtHour,
} from "@/lib/bookings/timeline";
import type { Booking } from "@/lib/bookings/types";

const HOURS = Array.from(
  { length: WORKING_DAY.endHour - WORKING_DAY.startHour + 1 },
  (_, index) => WORKING_DAY.startHour + index,
);

interface TimelineProps {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
}

export default function Timeline({ bookings, onEdit }: TimelineProps) {
  return (
    <div aria-hidden="true" className="timeline">
      <div className="hour-labels">
        {HOURS.map((hour) => (
          <span key={hour}>{String(hour).padStart(2, "0")}:00</span>
        ))}
      </div>
      <div className="timeline-track">
        <div className="hour-lines">
          {HOURS.map((hour) => (
            <span key={hour} style={{ top: `${getTimelinePositionAtHour(hour)}%` }} />
          ))}
        </div>
        {bookings.map((booking) => {
          const title = getBookingTitle(booking);
          return (
            <button
              className="timeline-booking"
              key={booking.id}
              onClick={() => onEdit(booking)}
              style={{
                top: `${getTimelinePosition(booking.start)}%`,
                height: `${getTimelineDuration(booking.start, booking.end)}%`,
              }}
              tabIndex={-1}
              title={`${title}, ${booking.start}–${booking.end}`}
              type="button"
            >
              <span className="timeline-booking-title">{title}</span>
              <span className="timeline-booking-time">
                {booking.start}–{booking.end}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
