import dayjs from "dayjs";

/** Returns true if a date is strictly in the past (before today's start) */
export const isPastDate = (date: Date): boolean => dayjs(date).isBefore(dayjs().startOf("day"));

/** Returns true if an event started in the past */
export const isPastEvent = (startDate: string): boolean => isPastDate(new Date(startDate));
