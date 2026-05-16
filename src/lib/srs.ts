import type { MemoryCard } from '../db/db';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

export type Difficulty = 'easy' | 'medium' | 'hard' | 'recall';

export interface BlankPlan {
  /** Same length as the word tokens in the verse; true = hide this word */
  mask: boolean[];
  /** Indexes into the word tokens that the user must fill in */
  blankIndexes: number[];
  difficulty: Difficulty;
  /** Human-friendly summary, e.g. "2 words hidden" */
  label: string;
}

/** Choose blanking strategy based on current mastery %. */
export function chooseDifficulty(masteryPercent: number): Difficulty {
  if (masteryPercent < 25) return 'easy';        // ~2 blanks
  if (masteryPercent < 50) return 'medium';      // every 4th word
  if (masteryPercent < 80) return 'hard';        // every other word
  return 'recall';                               // type the whole verse
}

interface Token { word: string; original: string; }

function tokenize(text: string): { tokens: (string | Token)[]; wordIdxs: number[] } {
  // Split keeping whitespace as separators
  const parts = text.split(/(\s+)/);
  const tokens: (string | Token)[] = [];
  const wordIdxs: number[] = [];
  let wordCount = 0;
  for (const p of parts) {
    if (!p) continue;
    if (/^\s+$/.test(p)) {
      tokens.push(p);
    } else {
      // Strip leading/trailing punctuation from the "word" for matching
      const m = p.match(/^([^\w]*)(\w[\w'-]*)([^\w]*)$/);
      if (m) {
        tokens.push({ word: m[2], original: p });
      } else {
        tokens.push(p); // pure punctuation or unrecognized — treat as separator
        continue;
      }
      wordIdxs.push(tokens.length - 1);
      wordCount++;
    }
  }
  void wordCount;
  return { tokens, wordIdxs };
}

/** Build a deterministic mask given seed; "easy" picks 2 words near the start/middle. */
export function planBlanks(text: string, difficulty: Difficulty, seed = 1): BlankPlan {
  const { tokens, wordIdxs } = tokenize(text);
  const total = wordIdxs.length;
  const mask = new Array(tokens.length).fill(false);
  let pickedWordPositions: number[] = []; // positions in wordIdxs

  if (difficulty === 'easy') {
    // Hide ~max(2, 15%) words, spread across the verse
    const count = Math.max(2, Math.round(total * 0.15));
    pickedWordPositions = spread(count, total, seed);
  } else if (difficulty === 'medium') {
    // Every 4th word starting at offset (seed % 4)
    for (let i = (seed % 4); i < total; i += 4) pickedWordPositions.push(i);
  } else if (difficulty === 'hard') {
    // Every other word starting at offset (seed % 2)
    for (let i = (seed % 2); i < total; i += 2) pickedWordPositions.push(i);
  } else {
    // recall: all words
    for (let i = 0; i < total; i++) pickedWordPositions.push(i);
  }

  for (const p of pickedWordPositions) {
    mask[wordIdxs[p]] = true;
  }

  const label =
    difficulty === 'easy'   ? `${pickedWordPositions.length} words hidden` :
    difficulty === 'medium' ? 'Every 4th word hidden' :
    difficulty === 'hard'   ? 'Every other word hidden' :
                              'Recall the whole verse';

  return { mask, blankIndexes: pickedWordPositions.map(p => wordIdxs[p]), difficulty, label };
}

function spread(count: number, total: number, seed: number): number[] {
  if (count >= total) return Array.from({ length: total }, (_, i) => i);
  const out: number[] = [];
  const stride = total / count;
  for (let i = 0; i < count; i++) {
    out.push(Math.min(total - 1, Math.floor(i * stride + (seed % Math.max(1, Math.floor(stride))))));
  }
  // De-duplicate
  return [...new Set(out)];
}

/** Render the verse with hidden tokens shown as ____ (underscores match word length). */
export function renderMasked(text: string, plan: BlankPlan): string {
  const { tokens } = tokenize(text);
  return tokens.map((tok, i) => {
    if (typeof tok === 'string') return tok;
    return plan.mask[i] ? tok.word.replace(/\w/g, '_') : tok.original;
  }).join('');
}

/** Get just the expected words at the blank positions, in order. */
export function expectedWords(text: string, plan: BlankPlan): string[] {
  const { tokens } = tokenize(text);
  return plan.blankIndexes.map(i => (tokens[i] as Token).word);
}

export function normalizeWord(s: string): string {
  return s.toLowerCase().replace(/[^\w']/g, '').trim();
}

export interface CheckResult {
  correct: boolean;
  perWord: { expected: string; given: string; ok: boolean }[];
  score: number; // 0..1
}

export function checkAnswer(expected: string[], given: string[]): CheckResult {
  const perWord = expected.map((e, i) => {
    const g = given[i] ?? '';
    return { expected: e, given: g, ok: normalizeWord(e) === normalizeWord(g) };
  });
  const okCount = perWord.filter(w => w.ok).length;
  const score = expected.length === 0 ? 0 : okCount / expected.length;
  return { correct: score === 1, perWord, score };
}

/** For "recall" difficulty: compare full text token-by-token. */
export function checkFullRecall(expectedText: string, givenText: string): CheckResult {
  const expectedWords = tokenize(expectedText).tokens
    .filter((t): t is Token => typeof t !== 'string').map(t => t.word);
  const givenWords = tokenize(givenText).tokens
    .filter((t): t is Token => typeof t !== 'string').map(t => t.word);
  return checkAnswer(expectedWords, givenWords);
}

/** Update card mastery + due date based on test outcome. */
export function applyResult(card: MemoryCard, score: number, now: number = Date.now()): {
  masteryPercent: number;
  consecutiveCorrect: number;
  dueAt: number;
  lastReviewedAt: number;
} {
  const wasFullCorrect = score >= 0.999;
  const wasMostlyCorrect = score >= 0.75;
  let mastery = card.masteryPercent ?? 0;
  let streak = card.consecutiveCorrect ?? 0;

  if (wasFullCorrect) {
    const gain =
      mastery < 25 ? 20 :
      mastery < 50 ? 15 :
      mastery < 80 ? 18 :
      8;
    mastery = Math.min(100, mastery + gain);
    streak = streak + 1;
  } else if (wasMostlyCorrect) {
    mastery = Math.min(100, mastery + 5);
    streak = 0;
  } else {
    mastery = Math.max(0, mastery - 10);
    streak = 0;
  }

  // Schedule next review based on new mastery
  const dueAt = now + intervalFor(mastery, streak);
  return { masteryPercent: mastery, consecutiveCorrect: streak, dueAt, lastReviewedAt: now };
}

function intervalFor(mastery: number, streak: number): number {
  if (mastery < 25) return 5 * MINUTE;       // back this session
  if (mastery < 50) return 1 * DAY;          // tomorrow
  if (mastery < 75) return 3 * DAY;
  if (mastery < 90) return 7 * DAY;
  // Mastered: 14 days, doubling with streak (cap at 60 days)
  return Math.min(60, 14 * Math.pow(1.4, Math.min(streak, 6))) * DAY;
}

export function createCard(ref: string, text: string, now: number = Date.now()): Omit<MemoryCard, 'id'> {
  return {
    ref,
    text,
    masteryPercent: 0,
    consecutiveCorrect: 0,
    dueAt: now,
    createdAt: now,
    lastReviewedAt: null
  };
}
