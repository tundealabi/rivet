import type { DurationLikeObject } from "luxon";
import { DateTime, Duration } from "luxon";

const nowUtc = () => DateTime.utc();
const nowLocal = (zone = "Africa/Lagos") => DateTime.now().setZone(zone);
const fromISO = (iso: string, zone = "utc") => DateTime.fromISO(iso, { zone });
const fromJSDate = (date: Date, zone = "utc") =>
  DateTime.fromJSDate(date, { zone });
const toISO = (dt: DateTime) => dt.toISO();
const toJSDate = (dt: DateTime) => dt.toJSDate();
const diffInMinutes = (a: DateTime, b: DateTime) =>
  a.diff(b, "minutes").minutes;
const addDays = (dt: DateTime, days: number) => dt.plus({ days });
const addHours = (dt: DateTime, hours: number) => dt.plus({ hours });
const addMinutes = (dt: DateTime, mins: number) => dt.plus({ minutes: mins });
const addSeconds = (dt: DateTime, seconds: number) => dt.plus({ seconds });
const subtractDays = (dt: DateTime, days: number) => dt.minus({ days });
const isAfter = (a: DateTime, b: DateTime) => a.toMillis() > b.toMillis();
const isBefore = (a: DateTime, b: DateTime) => a.toMillis() < b.toMillis();
const isFuture = (dt: DateTime) => dt.toMillis() > nowUtc().toMillis();
const isPast = (dt: DateTime) => dt.toMillis() < nowUtc().toMillis();
const format = (dt: DateTime, format = "yyyy-MM-dd HH:mm") =>
  dt.toFormat(format);
/** Duration length in ms, not an absolute epoch. */
const durationToMillis = (values: DurationLikeObject) =>
  Duration.fromObject(values).toMillis();

const getUtcToday = () => nowUtc().startOf("day");
const parseUtcDateOnly = (value: unknown): Date | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const s = value.trim();
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (ymd) {
    const y = Number(ymd[1]);
    const mo = Number(ymd[2]);
    const d = Number(ymd[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const date = new Date(Date.UTC(y, mo - 1, d));
    if (
      date.getUTCFullYear() !== y ||
      date.getUTCMonth() !== mo - 1 ||
      date.getUTCDate() !== d
    )
      return null;
    return date;
  }
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  const date = new Date(t);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
};
const isUtcCalendarDateStrictlyBeforeToday = (value: unknown): boolean => {
  const parsed = parseUtcDateOnly(value);
  if (!parsed) return false;
  return fromJSDate(parsed) < getUtcToday();
};
const isUtcCalendarDateStrictlyAfterToday = (value: unknown): boolean => {
  const parsed = parseUtcDateOnly(value);
  if (!parsed) return false;
  return fromJSDate(parsed) > getUtcToday();
};
const parseUtcCalendarDateOnly = (value: unknown): Date | null => {
  return parseUtcDateOnly(value);
};
const utcCalendarMonthRange = (now: Date): { end: Date; start: Date } => {
  const start = fromJSDate(now).startOf("month");
  return {
    start: toJSDate(start),
    end: toJSDate(start.plus({ months: 1 })),
  };
};

export const DATE_UTILS = {
  nowUtc,
  nowLocal,
  fromISO,
  fromJSDate,
  toISO,
  toJSDate,
  diffInMinutes,
  addDays,
  addHours,
  addMinutes,
  addSeconds,
  subtractDays,
  isAfter,
  isBefore,
  isFuture,
  isPast,
  format,
  durationToMillis,
  getUtcToday,
  parseUtcDateOnly,
  isUtcCalendarDateStrictlyBeforeToday,
  isUtcCalendarDateStrictlyAfterToday,
  parseUtcCalendarDateOnly,
  utcCalendarMonthRange,
};
