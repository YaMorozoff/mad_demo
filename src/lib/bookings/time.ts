import { WORKING_DAY } from "./constants";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(total: number): string {
  const hours = String(Math.floor(total / 60)).padStart(2, "0");
  const minutes = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function describeMinutes(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  return `${minutes} minutes`;
}

export function getBookingDuration(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start);
}

export function getEarliestStart(date: string, now = new Date()): number {
  const { startMinutes, slotMinutes } = WORKING_DAY;
  if (date !== formatLocalDate(now)) return startMinutes;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nextSlot = Math.ceil((nowMinutes + 1) / slotMinutes) * slotMinutes;
  return Math.max(startMinutes, nextSlot);
}

export function getDefaultSlot(date: string, now = new Date()): { start: string; end: string } {
  const { endMinutes, defaultBookingMinutes } = WORKING_DAY;
  const start = Math.min(getEarliestStart(date, now), endMinutes - defaultBookingMinutes);
  return { start: minutesToTime(start), end: minutesToTime(start + defaultBookingMinutes) };
}
