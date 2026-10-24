import { useCallback, useEffect, useState } from "react";
import { sortBookings } from "./booking";
import {
  BookingApiError,
  createBooking,
  deleteBooking,
  fetchBookings,
  getErrorMessage,
  updateBooking,
} from "./service";
import type { Booking, BookingInput } from "./types";

interface Snapshot {
  key: string;
  bookings: Booking[];
  error: string;
}

interface ActionError {
  key: string;
  message: string;
}

const NO_BOOKINGS: Booking[] = [];

export function useBookings(date: string) {
  const [reloadCount, setReloadCount] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [actionError, setActionError] = useState<ActionError | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const key = `${date}#${reloadCount}`;
  const current = date !== "" && snapshot !== null && snapshot.key === key ? snapshot : null;

  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();

    fetchBookings(date, controller.signal).then(
      (list) => {
        if (controller.signal.aborted) return;
        setSnapshot({ key, bookings: sortBookings(list), error: "" });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setSnapshot({
          key,
          bookings: [],
          error: getErrorMessage(error, "Unable to load bookings. Please try again."),
        });
      },
    );

    return () => controller.abort();
  }, [date, key]);

  const applyChange = useCallback(
    (change: (list: Booking[]) => Booking[]) => {
      setSnapshot((state) =>
        state && state.key === key
          ? { ...state, bookings: sortBookings(change(state.bookings)) }
          : state,
      );
    },
    [key],
  );

  const refresh = useCallback(async () => {
    try {
      const latest = await fetchBookings(date);
      setSnapshot((state) =>
        state && state.key === key
          ? { ...state, bookings: sortBookings(latest), error: "" }
          : state,
      );
    } catch {
      return;
    }
  }, [date, key]);

  const save = useCallback(
    async (input: BookingInput, id?: string) => {
      setSaving(true);
      setActionError(null);
      try {
        const saved = id ? await updateBooking(id, input) : await createBooking(input);
        applyChange((list) => [
          ...list.filter((booking) => booking.id !== saved.id),
          ...(saved.date === date ? [saved] : []),
        ]);
      } catch (error) {
        if (error instanceof BookingApiError && (error.status === 409 || error.status === 404)) {
          void refresh();
        }
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [applyChange, date, refresh],
  );

  const remove = useCallback(
    async (booking: Booking) => {
      setDeletingId(booking.id);
      setActionError(null);
      try {
        await deleteBooking(booking.id);
        applyChange((list) => list.filter((item) => item.id !== booking.id));
      } catch (error) {
        setActionError({
          key,
          message: getErrorMessage(error, "Unable to delete this booking. Please try again."),
        });
        void refresh();
      } finally {
        setDeletingId(null);
      }
    },
    [applyChange, key, refresh],
  );

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    bookings: current?.bookings ?? NO_BOOKINGS,
    loading: current === null,
    loadError: current?.error ?? "",
    actionError: actionError?.key === key ? actionError.message : "",
    saving,
    deletingId,
    busy: saving || deletingId !== null,
    reload,
    save,
    remove,
  };
}
