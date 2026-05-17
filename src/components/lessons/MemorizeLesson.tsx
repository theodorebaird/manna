import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { planBlanks, expectedWords, checkAnswer, renderMasked, normalizeWord } from '../../lib/srs';
import { db } from '../../db/db';
import { createCard } from '../../lib/srs';

interface Props {
  verseRef: string;
  text: string;
  onDone: (xp: number) => void;
}

type Phase = 'learn' | 'test' | 'result';

export default function MemorizeLesson({ verseRef, text, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('learn');
  const [answers, setAnswers] = useState<string[]>([]);
  const [score, setScore] = useState<{ score: number; perWord: { expected: string; given: string; ok: boolean }[] } | null>(null);

  // One-shot lesson: pick a mid-difficulty challenge (every 4th word hidden)
  const plan = useMemo(() => planBlanks(text, 'medium', 1), [text]);
  const expWords = useMemo(() => expectedWords(text, plan), [text, plan]);
  const masked = renderMasked(text, plan);
  const allFilled = answers.length === plan.blankIndexes.length && answers.every(a => a.trim().length > 0);

  const setAt = (i: number, v: string) => {
    const next = [...answers];
    while (next.length < plan.blankIndexes.length) next.push('');
    next[i] = v;
    setAnswers(next);
  };

  const submit = () => {
    const result = checkAnswer(expWords, answers);
    setScore(result);
    setPhase('result');
  };

  const finish = async () => {
    // Add to user's spaced-repetition deck (idempotent)
    const exists = await db.memoryCards.where('ref').equals(verseRef).first();
    if (!exists) await db.memoryCards.add(createCard(verseRef, text));
    onDone(15);
  };

  if (phase === 'learn') {
    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <div className="section-label">Memorize · Learn the verse</div>
          <h2 className="font-serif text-2xl text-gold-700 dark:text-gold-300">{verseRef}</h2>
        </div>
        <div className="card space-y-3">
          <div className="verse-text italic whitespace-pre-wrap">{text}</div>
          <div className="text-xs text-ink-500 dark:text-ink-300/70 italic">
            Read this verse a few times. When you feel ready, tap below — some words will be hidden and you'll fill them in.
          </div>
        </div>
        <button onClick={() => setPhase('test')} className="btn-primary w-full">
          I'm ready to try <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  if (phase === 'test') {
    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <div className="section-label">Memorize · {plan.label}</div>
          <h2 className="font-serif text-2xl text-gold-700 dark:text-gold-300">{verseRef}</h2>
        </div>
        <div className="card space-y-3">
          <div className="verse-text italic whitespace-pre-wrap">{masked}</div>
        </div>
        <div className="card space-y-2">
          <div className="section-label">Fill in the missing words (in order)</div>
          {Array.from({ length: plan.blankIndexes.length }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-right text-xs text-ink-500 dark:text-ink-300/70 font-medium">{i + 1}.</span>
              <input
                autoFocus={i === 0}
                type="text"
                value={answers[i] ?? ''}
                onChange={e => setAt(i, e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && allFilled) submit(); }}
                placeholder="missing word"
                className="input flex-1"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          ))}
        </div>
        <button onClick={submit} disabled={!allFilled} className="btn-primary w-full">
          Check
        </button>
      </div>
    );
  }

  // Result phase
  const full = score!.score >= 0.999;
  const partial = !full && score!.score >= 0.5;
  return (
    <div className="space-y-5 animate-fade-in">
      <div className={`card text-center space-y-2 ${
        full ? 'border-emerald-300 dark:border-emerald-700/60' :
        partial ? 'border-gold-300 dark:border-gold-700/60' :
                  'border-rose-300 dark:border-rose-700/60'
      }`}>
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
          full ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' :
          partial ? 'bg-gold-100 dark:bg-ink-700 text-gold-700 dark:text-gold-300' :
                    'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
        }`}>
          {full ? <CheckCircle2 size={32} /> : partial ? <ArrowRight size={32} /> : <XCircle size={32} />}
        </div>
        <h3 className="font-serif text-xl text-ink-800 dark:text-ink-100">
          {full ? 'Perfect!' : partial ? `${Math.round(score!.score * 100)}% — close!` : `${Math.round(score!.score * 100)}% — keep practicing`}
        </h3>
      </div>

      <div className="card space-y-2">
        <div className="section-label">Word-by-word</div>
        <div className="flex flex-wrap gap-1.5">
          {score!.perWord.map((w, i) => (
            <span key={i} className={`px-2 py-1 rounded text-xs font-medium ${
              w.ok
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'
            }`}>
              {w.ok ? (w.given || w.expected) : <>{normalizeWord(w.given) || '∅'} → <strong>{w.expected}</strong></>}
            </span>
          ))}
        </div>
      </div>

      <div className="card space-y-2">
        <div className="section-label">The verse</div>
        <div className="verse-text italic whitespace-pre-wrap">{text}</div>
      </div>

      <button onClick={finish} className="btn-primary w-full">
        Add to my Memorize deck (+15 XP) <ArrowRight size={18} />
      </button>
    </div>
  );
}
