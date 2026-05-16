import { db, type DailyStat } from '../db/db';
import { todayKey, yesterdayKey } from './dates';

export async function recordLesson(xp: number, minutes: number): Promise<void> {
  const date = todayKey();
  const existing = await db.dailyStats.get(date);
  const next: DailyStat = existing
    ? { ...existing, xp: existing.xp + xp, minutes: existing.minutes + minutes, lessonsDone: existing.lessonsDone + 1 }
    : { date, xp, minutes, lessonsDone: 1 };
  await db.dailyStats.put(next);
}

export async function getTodayStats(): Promise<DailyStat> {
  const date = todayKey();
  const s = await db.dailyStats.get(date);
  return s ?? { date, xp: 0, minutes: 0, lessonsDone: 0 };
}

export async function getStreak(): Promise<number> {
  const all = await db.dailyStats.toArray();
  if (all.length === 0) return 0;
  const byDate = new Map(all.map(s => [s.date, s]));
  const today = todayKey();
  const yest = yesterdayKey();
  // Streak counts back from today, allowing today not done yet (use yesterday as anchor)
  const anchor = byDate.has(today) && (byDate.get(today)!.lessonsDone > 0) ? today : yest;
  if (!byDate.has(anchor) || byDate.get(anchor)!.lessonsDone === 0) return 0;
  let streak = 0;
  let cursor = new Date(anchor);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    const entry = byDate.get(key);
    if (entry && entry.lessonsDone > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}

export async function getLast7Days(): Promise<DailyStat[]> {
  const out: DailyStat[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const s = await db.dailyStats.get(key);
    out.push(s ?? { date: key, xp: 0, minutes: 0, lessonsDone: 0 });
  }
  return out;
}
