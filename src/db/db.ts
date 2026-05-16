import Dexie, { type Table } from 'dexie';

export interface Settings {
  id: 'singleton';
  userName: string;
  themePref: 'light' | 'dark' | 'system';
  dailyXpGoal: number;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  hearts: number;
  heartsRegenAt: number;     // epoch ms
  lastReadRef: string | null;
}

export interface ProgressEntry {
  id?: number;
  lessonId: string;
  unitId: string;
  skillId: string;
  completedAt: number;
  score: number;             // 0..100
  xpEarned: number;
}

export interface MemoryCard {
  id?: number;
  ref: string;               // e.g. "John 3:16"
  text: string;              // KJV text snapshot
  masteryPercent: number;    // 0-100, drives blanking difficulty + scheduling
  consecutiveCorrect: number;
  dueAt: number;             // epoch ms
  createdAt: number;
  lastReviewedAt: number | null;
  // Legacy fields kept for old records; not used by new logic
  stage?: 1 | 2 | 3 | 4;
  easeFactor?: number;
  intervalDays?: number;
}

export interface Bookmark {
  id?: number;
  ref: string;
  text: string;
  createdAt: number;
}

export interface Note {
  id?: number;
  ref: string;
  body: string;
  createdAt: number;
}

export interface DailyStat {
  date: string;              // YYYY-MM-DD
  xp: number;
  minutes: number;
  lessonsDone: number;
}

export interface ReadingHistoryEntry {
  id?: number;
  ref: string;               // "Book Chapter"
  readAt: number;
}

class MannaDB extends Dexie {
  settings!: Table<Settings, 'singleton'>;
  progress!: Table<ProgressEntry, number>;
  memoryCards!: Table<MemoryCard, number>;
  bookmarks!: Table<Bookmark, number>;
  notes!: Table<Note, number>;
  dailyStats!: Table<DailyStat, string>;
  readingHistory!: Table<ReadingHistoryEntry, number>;

  constructor() {
    super('manna');
    this.version(1).stores({
      settings: 'id',
      progress: '++id, lessonId, unitId, skillId, completedAt',
      memoryCards: '++id, ref, dueAt, stage',
      bookmarks: '++id, ref, createdAt',
      notes: '++id, ref, createdAt',
      dailyStats: 'date',
      readingHistory: '++id, ref, readAt'
    });
    this.version(2).stores({
      memoryCards: '++id, ref, dueAt, masteryPercent'
    }).upgrade(tx => tx.table('memoryCards').toCollection().modify(card => {
      // Convert legacy stage (1-4) to mastery%. Stage 1→0%, 2→33%, 3→66%, 4→90%.
      const legacyStage = card.stage ?? 1;
      card.masteryPercent = Math.min(100, Math.max(0, (legacyStage - 1) * 33));
      card.consecutiveCorrect = 0;
    }));
  }
}

export const db = new MannaDB();

const HEART_MAX = 5;
const HEART_REGEN_MS = 30 * 60 * 1000; // 30 min per heart

export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.get('singleton');
  if (existing) return existing;
  const fresh: Settings = {
    id: 'singleton',
    userName: '',
    themePref: 'system',
    dailyXpGoal: 30,
    fontSize: 'md',
    hearts: HEART_MAX,
    heartsRegenAt: Date.now(),
    lastReadRef: null
  };
  await db.settings.put(fresh);
  return fresh;
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = { ...current, ...patch, id: 'singleton' as const };
  await db.settings.put(next);
  return next;
}

export async function regenerateHearts(): Promise<Settings> {
  const s = await getSettings();
  if (s.hearts >= HEART_MAX) return s;
  const now = Date.now();
  const elapsed = now - s.heartsRegenAt;
  const regen = Math.floor(elapsed / HEART_REGEN_MS);
  if (regen <= 0) return s;
  const newHearts = Math.min(HEART_MAX, s.hearts + regen);
  const carryMs = elapsed - regen * HEART_REGEN_MS;
  return updateSettings({ hearts: newHearts, heartsRegenAt: now - carryMs });
}

export async function loseHeart(): Promise<Settings> {
  const s = await getSettings();
  const newHearts = Math.max(0, s.hearts - 1);
  const regenAt = s.hearts === HEART_MAX ? Date.now() : s.heartsRegenAt;
  return updateSettings({ hearts: newHearts, heartsRegenAt: regenAt });
}

export { HEART_MAX, HEART_REGEN_MS };
