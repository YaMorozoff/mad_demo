const START_HOUR = 9;
const END_HOUR = 18;

const pad = (value: number) => String(value).padStart(2, "0");

export const WORKING_DAY = {
  startHour: START_HOUR,
  endHour: END_HOUR,
  startMinutes: START_HOUR * 60,
  endMinutes: END_HOUR * 60,
  durationMinutes: (END_HOUR - START_HOUR) * 60,
  startTime: `${pad(START_HOUR)}:00`,
  endTime: `${pad(END_HOUR)}:00`,
  slotMinutes: 30,
  minimumBookingMinutes: 30,
  maximumBookingMinutes: 120,
  defaultBookingMinutes: 60,
} as const;

export const ROOM = {
  name: "Room 01",
  capacity: 8,
} as const;

export const MAX_TITLE_LENGTH = 120;
