"use client";

import { useId, useState, type FormEvent } from "react";
import Modal from "@/components/Modal";
import { normalizeBookingInput } from "@/lib/bookings/booking";
import { MAX_TITLE_LENGTH, WORKING_DAY } from "@/lib/bookings/constants";
import { validateBooking } from "@/lib/bookings/rules";
import { getErrorMessage } from "@/lib/bookings/service";
import {
  describeMinutes,
  getDefaultSlot,
  getEarliestStart,
  minutesToTime,
} from "@/lib/bookings/time";
import type { Booking, BookingInput } from "@/lib/bookings/types";

interface BookingDialogProps {
  booking: Booking | null;
  bookings: Booking[];
  date: string;
  dateLabel: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: BookingInput, id?: string) => Promise<void>;
}

export default function BookingDialog({
  booking,
  bookings,
  date,
  dateLabel,
  saving,
  onClose,
  onSubmit,
}: BookingDialogProps) {
  const [error, setError] = useState("");
  const titleId = useId();
  const hintId = useId();

  const [defaults] = useState(() => booking ?? getDefaultSlot(date));
  const [earliestStart] = useState(() =>
    booking
      ? WORKING_DAY.startTime
      : minutesToTime(
          Math.min(getEarliestStart(date), WORKING_DAY.endMinutes - WORKING_DAY.minimumBookingMinutes),
        ),
  );
  const stepSeconds = WORKING_DAY.slotMinutes * 60;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = normalizeBookingInput({
      date,
      start: String(data.get("start") ?? ""),
      end: String(data.get("end") ?? ""),
      title: String(data.get("title") ?? ""),
    });

    const result = validateBooking(input, bookings, {
      excludeId: booking?.id,
      previous: booking ?? undefined,
    });
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError("");
    try {
      await onSubmit(input, booking?.id);
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Unable to save this booking. Please try again."));
    }
  }

  return (
    <Modal describedBy={hintId} labelledBy={titleId} locked={saving} onClose={onClose}>
      <div className="dialog-heading">
        <div>
          <p className="eyebrow">{booking ? "UPDATE DETAILS" : "NEW RESERVATION"}</p>
          <h2 id={titleId}>{booking ? "Edit booking" : "Book this room"}</h2>
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
        <p className="form-hint">{dateLabel}</p>
        <div className="form-time-row">
          <label>
            <span>Starts</span>
            <input
              data-autofocus
              defaultValue={defaults.start}
              max={WORKING_DAY.endTime}
              min={earliestStart}
              name="start"
              required
              step={stepSeconds}
              type="time"
            />
          </label>
          <label>
            <span>Ends</span>
            <input
              defaultValue={defaults.end}
              max={WORKING_DAY.endTime}
              min={WORKING_DAY.startTime}
              name="end"
              required
              step={stepSeconds}
              type="time"
            />
          </label>
        </div>
        <label>
          <span>
            Meeting name <span className="optional-label">Optional</span>
          </span>
          <input
            defaultValue={booking?.title ?? ""}
            maxLength={MAX_TITLE_LENGTH}
            name="title"
            placeholder="e.g. Product planning"
            type="text"
          />
        </label>

        {error && (
          <p aria-live="assertive" className="form-error" role="alert">
            {error}
          </p>
        )}
        <p className="form-hint" id={hintId}>
          Bookings are {describeMinutes(WORKING_DAY.minimumBookingMinutes)} to{" "}
          {describeMinutes(WORKING_DAY.maximumBookingMinutes)}, between {WORKING_DAY.startTime} and{" "}
          {WORKING_DAY.endTime}.
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
    </Modal>
  );
}
