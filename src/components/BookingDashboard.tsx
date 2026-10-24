"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import BookingDialog from "@/components/BookingDialog";
import BookingList from "@/components/BookingList";
import ConfirmDialog from "@/components/ConfirmDialog";
import Timeline from "@/components/Timeline";
import { getBookingTitle } from "@/lib/bookings/booking";
import { ROOM, WORKING_DAY } from "@/lib/bookings/constants";
import { formatDateLabel, formatLocalDate } from "@/lib/bookings/time";
import type { Booking, BookingInput } from "@/lib/bookings/types";
import { useBookings } from "@/lib/bookings/useBookings";

type Overlay =
  | { kind: "none" }
  | { kind: "new" }
  | { kind: "edit"; booking: Booking }
  | { kind: "delete"; booking: Booking };

const subscribeToNothing = () => () => {};
const getToday = () => formatLocalDate(new Date());
const getServerToday = () => "";

export default function BookingDashboard() {
  const today = useSyncExternalStore(subscribeToNothing, getToday, getServerToday);
  const [pickedDate, setPickedDate] = useState("");
  const [overlay, setOverlay] = useState<Overlay>({ kind: "none" });

  const selectedDate = pickedDate || today;
  const dateLabel = selectedDate ? formatDateLabel(selectedDate) : "Loading date…";

  const {
    bookings,
    loading,
    loadError,
    actionError,
    saving,
    deletingId,
    busy,
    reload,
    save,
    remove,
  } = useBookings(selectedDate);

  const pageError = loadError || actionError;
  const canEdit = !loading && !loadError && !busy;

  function selectDate(value: string) {
    if (value && value >= today) setPickedDate(value);
  }

  function closeOverlay() {
    setOverlay({ kind: "none" });
  }

  function openNewBooking() {
    if (canEdit) setOverlay({ kind: "new" });
  }

  function openEditBooking(booking: Booking) {
    if (canEdit) setOverlay({ kind: "edit", booking });
  }

  function askToDelete(booking: Booking) {
    if (canEdit) setOverlay({ kind: "delete", booking });
  }

  async function submitBooking(input: BookingInput, id?: string) {
    await save(input, id);
    closeOverlay();
  }

  function confirmDelete(booking: Booking) {
    closeOverlay();
    void remove(booking);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link aria-label="Roomly home" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">R</span>
          <span>roomly<span className="brand-dot">.</span></span>
        </Link>
        <span className="topbar-note"><span aria-hidden="true" className="status-dot" /> Team spaces</span>
      </header>

      <section className="welcome">
        <div>
          <p className="eyebrow">YOUR SPACE, ON YOUR SCHEDULE</p>
          <h1>Meeting room</h1>
          <p className="welcome-copy">A little room to do big things.</p>
        </div>
        <button
          className="button button-primary new-booking-button"
          disabled={!canEdit}
          onClick={openNewBooking}
          type="button"
        >
          <span aria-hidden="true" className="plus-icon">+</span>
          New booking
        </button>
      </section>

      <section aria-label="Meeting room schedule" className="schedule-panel">
        <div className="schedule-header">
          <div>
            <p className="eyebrow">
              {ROOM.name.toUpperCase()} <span className="eyebrow-divider">/</span> {ROOM.capacity} PEOPLE
            </p>
            <h2>Daily schedule</h2>
          </div>
          <div className="date-control">
            <label className="sr-only" htmlFor="schedule-date">Choose a date</label>
            <span aria-hidden="true" className="calendar-icon">▦</span>
            <input
              id="schedule-date"
              disabled={!today || busy}
              min={today}
              onChange={(event) => selectDate(event.target.value)}
              type="date"
              value={selectedDate}
            />
          </div>
        </div>

        <div className="selected-date-row">
          <h3>{dateLabel}</h3>
          <div aria-label="Schedule legend" className="legend">
            <span aria-hidden="true" className="legend-booked" /> Booked
            <span aria-hidden="true" className="legend-open" /> Available
          </div>
        </div>

        {pageError && (
          <div aria-live="assertive" className="page-error" role="alert">
            <span>{pageError}</span>
            <button className="text-button" onClick={reload} type="button">
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div aria-label="Loading schedule" className="loading-state" role="status">
            <span aria-hidden="true" className="spinner spinner-large" />
            <span>Loading the room schedule…</span>
          </div>
        )}

        {!loading && !loadError && (
          <>
            <Timeline bookings={bookings} onEdit={openEditBooking} />
            {bookings.length === 0 ? (
              <div className="empty-state">
                <span aria-hidden="true" className="empty-icon">✳</span>
                <div>
                  <h3>{selectedDate === today ? "A clear day ahead" : "Nothing on the calendar"}</h3>
                  <p>This room is available all day. Make it yours.</p>
                </div>
                <button
                  className="button button-secondary"
                  disabled={!canEdit}
                  onClick={openNewBooking}
                  type="button"
                >
                  Book a time
                </button>
              </div>
            ) : (
              <BookingList
                bookings={bookings}
                deletingId={deletingId}
                disabled={busy}
                onDelete={askToDelete}
                onEdit={openEditBooking}
              />
            )}
          </>
        )}
      </section>

      <footer className="app-footer">
        <span>Made for better meetings.</span>
        <span>Working hours <strong>{WORKING_DAY.startTime}–{WORKING_DAY.endTime}</strong></span>
      </footer>

      {(overlay.kind === "new" || overlay.kind === "edit") && (
        <BookingDialog
          key={overlay.kind === "edit" ? overlay.booking.id : "new"}
          booking={overlay.kind === "edit" ? overlay.booking : null}
          bookings={bookings}
          date={selectedDate}
          dateLabel={dateLabel}
          onClose={closeOverlay}
          onSubmit={submitBooking}
          saving={saving}
        />
      )}

      {overlay.kind === "delete" && (
        <ConfirmDialog
          confirmLabel="Delete booking"
          message={`“${getBookingTitle(overlay.booking)}” from ${overlay.booking.start} to ${overlay.booking.end} will be removed from the schedule.`}
          onCancel={closeOverlay}
          onConfirm={() => confirmDelete(overlay.booking)}
          title="Delete this booking?"
        />
      )}
    </main>
  );
}
