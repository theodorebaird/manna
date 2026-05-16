import type { MemoryCard } from '../db/db';

export type Grade = 'again' | 'hard' | 'good' | 'easy';

const DAY = 24 * 60 * 60 * 1000;

export interface ReviewResult {
  stage: 1 | 2 | 3 | 4;
  easeFactor: number;
  intervalDays: number;
  dueAt: number;
}

export function gradeCard(card: MemoryCard, grade: Grade, now: number = Date.now()): ReviewResult {
  let { stage, easeFactor, intervalDays } = card;

  if (grade === 'again') {
    stage = 1;
    intervalDays = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (grade === 'hard') {
    intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.05);
    stage = stage < 4 ? ((stage + 0) as MemoryCard['stage']) : stage;
  } else if (grade === 'good') {
    intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
    if (stage < 4) stage = ((stage + 1) as MemoryCard['stage']);
  } else {
    intervalDays = Math.max(1, Math.round(intervalDays * easeFactor * 1.3));
    easeFactor = easeFactor + 0.15;
    if (stage < 4) stage = ((stage + 1) as MemoryCard['stage']);
  }

  return {
    stage,
    easeFactor: Math.round(easeFactor * 100) / 100,
    intervalDays,
    dueAt: now + intervalDays * DAY
  };
}

export function createCard(ref: string, text: string, now: number = Date.now()): Omit<MemoryCard, 'id'> {
  return {
    ref,
    text,
    stage: 1,
    easeFactor: 2.5,
    intervalDays: 0,
    dueAt: now,
    createdAt: now,
    lastReviewedAt: null
  };
}

/** Mask a percentage of words based on the card stage (1=none, 2=33%, 3=50%, 4=100%) */
export function maskByStage(text: string, stage: 1 | 2 | 3 | 4): string {
  if (stage === 1) return text;
  const words = text.split(/(\s+)/);
  const ratio = stage === 2 ? 1 / 3 : stage === 3 ? 1 / 2 : 1;
  let counter = 0;
  return words
    .map(tok => {
      if (/^\s+$/.test(tok)) return tok;
      counter++;
      const shouldMask =
        stage === 4
          ? true
          : stage === 3
          ? counter % 2 === 0
          : counter % 3 === 0;
      if (!shouldMask) return tok;
      return tok.replace(/\w/g, '_');
    })
    .join('');
  void ratio;
}

export function normalizeAnswer(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

export function compareAnswer(expected: string, given: string): { correct: boolean; ratio: number } {
  const a = normalizeAnswer(expected);
  const b = normalizeAnswer(given);
  if (!a || !b) return { correct: false, ratio: 0 };
  if (a === b) return { correct: true, ratio: 1 };
  const aw = a.split(' ');
  const bw = b.split(' ');
  let hits = 0;
  const len = Math.max(aw.length, bw.length);
  for (let i = 0; i < len; i++) if (aw[i] && bw[i] && aw[i] === bw[i]) hits++;
  const ratio = hits / len;
  return { correct: ratio >= 0.85, ratio };
}
