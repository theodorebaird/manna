import { format, differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';

export function todayKey(d: Date = new Date()): string {
  return format(startOfDay(d), 'yyyy-MM-dd');
}

export function fmtDate(iso: string): string {
  return format(parseISO(iso), 'MMM d');
}

export function dayDiff(a: string, b: string): number {
  return differenceInCalendarDays(parseISO(a), parseISO(b));
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}
