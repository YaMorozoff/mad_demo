import { WORKING_DAY } from "./constants";
import { getBookingDuration, timeToMinutes } from "./time";

export function getTimelinePosition(time: string): number {
  return ((timeToMinutes(time) - WORKING_DAY.startMinutes) / WORKING_DAY.durationMinutes) * 100;
}

export function getTimelinePositionAtHour(hour: number): number {
  return ((hour * 60 - WORKING_DAY.startMinutes) / WORKING_DAY.durationMinutes) * 100;
}

export function getTimelineDuration(start: string, end: string): number {
  return (getBookingDuration(start, end) / WORKING_DAY.durationMinutes) * 100;
}
