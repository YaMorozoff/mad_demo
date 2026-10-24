"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Booking, BookingInput } from "@/lib/bookings/types";
import { validateBooking, WORKING_DAY } from "@/lib/bookings/validation";

interface BookingFormProps {
  date: string;
  today: string;
  booking: Booking | null;
  bookings: Booking[];
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (input: BookingInput, id?: string) => Promise<void>;
}

export default function BookingForm({
  date,
  today,
  booking,
  bookings,
  saving,
  error,
  onClose,
  onSubmit,
}: BookingFormProps) {
  const [formDate, setFormDate] = useState(booking?.date ?? date);
  const [start, setStart] = useState(booking?.start ?? "09:00");
  const [end, setEnd] = useState(booking?.end ?? "10:00");
  const [title, setTitle] = useState(booking?.title ?? "");
  const [validationError, setValidationError] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const savingRef = useRef(saving);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    savingRef.current = saving;
    onCloseRef.current = onClose;
  }, [onClose, saving]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;
    const firstInput = dialog?.querySelector<HTMLInputElement>("input");
    firstInput?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!savingRef.current) onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        requestAnimationFrame(() => {
          if (previouslyFocused.isConnected) previouslyFocused.focus();
        });
      }
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: BookingInput = {
      date: formDate,
      start,
      end,
      ...(title.trim() ? { title: title.trim() } : {}),
    };
    const validation = validateBooking(input, bookings, booking?.id);
    if (!validation.valid) {
      setValidationError(validation.message ?? "Please check the booking details.");
      return;
    }
    setValidationError("");
    await onSubmit(input, booking?.id);
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        aria-describedby="booking-form-guidance"
        aria-labelledby="booking-form-title"
        aria-modal="true"
        className="booking-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">{booking ? "UPDATE DETAILS" : "NEW RESERVATION"}</p>
            <h2 id="booking-form-title">{booking ? "Edit booking" : "Book this room"}</h2>
          </div>
          <button
            aria-label="Close booking form"
            className="icon-button"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <form className="booking-form" onSubmit={handleSubmit}>
          <label>
            <span>Date</span>
            <input
              max="9999-12-31"
              min={today}
              onChange={(event) => setFormDate(event.target.value)}
              required
              type="date"
              value={formDate}
            />
          </label>
          <div className="form-time-row">
            <label>
              <span>Starts</span>
              <input
                max="18:00"
                min="09:00"
                onChange={(event) => setStart(event.target.value)}
                required
                step={WORKING_DAY.minimumBookingMinutes * 60}
                type="time"
                value={start}
              />
            </label>
            <label>
              <span>Ends</span>
              <input
                max="18:00"
                min="09:00"
                onChange={(event) => setEnd(event.target.value)}
                required
                step={WORKING_DAY.minimumBookingMinutes * 60}
                type="time"
                value={end}
              />
            </label>
          </div>
          <label>
            <span>Meeting name <span className="optional-label">Optional</span></span>
            <input
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Product planning"
              type="text"
              value={title}
            />
          </label>
          {(validationError || error) && (
            <p aria-live="assertive" className="form-error" role="alert">
              {error || validationError}
            </p>
          )}
          <p className="form-hint" id="booking-form-guidance">
            Bookings are 30 minutes to 2 hours, between 09:00 and 18:00.
          </p>
          <div className="dialog-actions">
            <button
              className="button button-secondary"
              disabled={saving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button className="button button-primary" disabled={saving} type="submit">
              {saving && <span aria-hidden="true" className="spinner" />}
              {saving ? "Saving…" : booking ? "Save changes" : "Confirm booking"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
