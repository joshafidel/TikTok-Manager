/**
 * Every date in this app is a local-time `YYYY-MM-DD` string. Filming and
 * posting happen in the host's timezone, so UTC conversion only ever
 * introduces off-by-one-day bugs.
 */
export type ISODate = string;

export function toISODate(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: ISODate): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = fromISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function startOfMonth(s: ISODate): ISODate {
  const d = fromISODate(s);
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonth(s: ISODate): ISODate {
  const d = fromISODate(s);
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function addMonths(s: ISODate, n: number): ISODate {
  const d = fromISODate(s);
  return toISODate(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

/** Six weeks of dates covering the month `s` falls in, Sunday-first. */
export function monthGrid(s: ISODate): ISODate[] {
  const first = fromISODate(startOfMonth(s));
  const start = new Date(first);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return toISODate(d);
  });
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function dayOfWeek(s: ISODate): number {
  return fromISODate(s).getDay();
}

export function formatLong(s: ISODate): string {
  const d = fromISODate(s);
  return `${DAY_NAMES[d.getDay()]}, ${d.toLocaleString("en-US", { month: "long" })} ${d.getDate()}`;
}

export function formatShort(s: ISODate): string {
  const d = fromISODate(s);
  return `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}`;
}

export function formatMonthYear(s: ISODate): string {
  const d = fromISODate(s);
  return `${d.toLocaleString("en-US", { month: "long" })} ${d.getFullYear()}`;
}

export function isSameMonth(a: ISODate, b: ISODate): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

export function relativeLabel(s: ISODate): string | null {
  const t = todayISO();
  if (s === t) return "Today";
  if (s === addDays(t, 1)) return "Tomorrow";
  if (s === addDays(t, -1)) return "Yesterday";
  return null;
}
