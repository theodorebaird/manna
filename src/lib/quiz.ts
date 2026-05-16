import { normalizeWord } from './srs';

function normalizeAnswer(s: string): string {
  return s.toLowerCase().replace(/[^\w\s']/g, '').replace(/\s+/g, ' ').trim();
}

function compareAnswer(expected: string, given: string): { correct: boolean } {
  const a = normalizeAnswer(expected);
  const b = normalizeAnswer(given);
  if (!a || !b) return { correct: false };
  if (a === b) return { correct: true };
  // Tolerant fuzzy match for single-word and short answers
  const aw = a.split(' ');
  const bw = b.split(' ');
  if (aw.length === 1) return { correct: normalizeWord(a) === normalizeWord(b) };
  let hits = 0;
  const len = Math.max(aw.length, bw.length);
  for (let i = 0; i < len; i++) if (aw[i] && bw[i] && aw[i] === bw[i]) hits++;
  return { correct: hits / len >= 0.85 };
}

export type QuizQuestion =
  | { kind: 'mc'; prompt: string; options: string[]; answerIndex: number; explain?: string }
  | { kind: 'fill'; prompt: string; answer: string; explain?: string }
  | { kind: 'order'; prompt: string; items: string[]; explain?: string }
  | { kind: 'match'; prompt: string; pairs: { left: string; right: string }[]; explain?: string };

export function evaluate(q: QuizQuestion, response: unknown): boolean {
  switch (q.kind) {
    case 'mc': {
      return typeof response === 'number' && response === q.answerIndex;
    }
    case 'fill': {
      if (typeof response !== 'string') return false;
      const cmp = compareAnswer(q.answer, response);
      return cmp.correct;
    }
    case 'order': {
      if (!Array.isArray(response)) return false;
      if (response.length !== q.items.length) return false;
      return q.items.every((item, i) => normalizeAnswer(item) === normalizeAnswer(String(response[i])));
    }
    case 'match': {
      if (!Array.isArray(response)) return false;
      if (response.length !== q.pairs.length) return false;
      return q.pairs.every((p, i) => {
        const r = response[i] as { left: string; right: string } | undefined;
        return !!r && normalizeAnswer(r.left) === normalizeAnswer(p.left) && normalizeAnswer(r.right) === normalizeAnswer(p.right);
      });
    }
  }
}

export const PASS_THRESHOLD = 0.8;
export const XP_PER_CORRECT = 10;

export function gradeLesson(correctCount: number, total: number): { passed: boolean; score: number; xp: number } {
  const ratio = total === 0 ? 0 : correctCount / total;
  return {
    passed: ratio >= PASS_THRESHOLD,
    score: Math.round(ratio * 100),
    xp: correctCount * XP_PER_CORRECT
  };
}
