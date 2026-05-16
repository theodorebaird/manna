import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { QuizQuestion } from '../../lib/quiz';
import { evaluate, gradeLesson } from '../../lib/quiz';
import { loseHeart } from '../../db/db';

interface Props {
  questions: QuizQuestion[];
  onDone: (result: { passed: boolean; score: number; xp: number }) => void;
}

export default function QuizLesson({ questions, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [response, setResponse] = useState<unknown>(null);
  const [verdict, setVerdict] = useState<'correct' | 'wrong' | null>(null);
  const q = questions[idx];

  const submit = async () => {
    const ok = evaluate(q, response);
    if (ok) {
      setVerdict('correct');
      setCorrectCount(c => c + 1);
    } else {
      setVerdict('wrong');
      await loseHeart();
    }
  };

  const advance = () => {
    setVerdict(null);
    setResponse(null);
    if (idx + 1 >= questions.length) {
      onDone(gradeLesson(correctCount + (verdict === 'correct' ? 0 : 0), questions.length));
      // correctCount already includes this one
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="section-label">Question {idx + 1} of {questions.length}</div>
        <div className="h-1.5 mt-2 rounded-full bg-ink-100 dark:bg-ink-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all"
            style={{ width: `${((idx + (verdict ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="card space-y-4">
        {q.kind === 'mc' && (
          <>
            <h3 className="font-serif text-xl text-ink-800 dark:text-ink-100">{q.prompt}</h3>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const picked = response === i;
                const correctIdx = q.answerIndex;
                const reveal = verdict !== null;
                const cls = reveal
                  ? i === correctIdx
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-ink-800 dark:text-emerald-100'
                    : picked
                    ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/30 text-ink-800 dark:text-rose-100'
                    : 'border-gold-100 dark:border-ink-700 opacity-60'
                  : picked
                  ? 'border-gold-500 bg-gold-50 dark:bg-ink-700'
                  : 'border-gold-100 dark:border-ink-700 hover:bg-gold-50 dark:hover:bg-ink-700';
                return (
                  <button
                    key={i}
                    disabled={reveal}
                    onClick={() => setResponse(i)}
                    className={`w-full text-left px-4 py-3 rounded-xl border font-medium transition ${cls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {q.kind === 'fill' && (
          <>
            <h3 className="font-serif text-xl text-ink-800 dark:text-ink-100">{q.prompt}</h3>
            <input
              type="text"
              value={(response as string) ?? ''}
              onChange={e => setResponse(e.target.value)}
              disabled={verdict !== null}
              placeholder="Type your answer…"
              className="input"
            />
            {verdict === 'wrong' && (
              <div className="text-sm text-ink-600 dark:text-ink-300">Correct: <strong>{q.answer}</strong></div>
            )}
          </>
        )}

        {q.kind === 'order' && (
          <OrderQuestion q={q} response={response} setResponse={setResponse} disabled={verdict !== null} />
        )}

        {q.kind === 'match' && (
          <MatchQuestion q={q} response={response} setResponse={setResponse} disabled={verdict !== null} />
        )}

        {verdict && q.explain && (
          <div className="text-sm text-ink-600 dark:text-ink-300 border-l-4 border-gold-400 pl-3 italic">{q.explain}</div>
        )}
      </div>

      {verdict === null ? (
        <button onClick={submit} disabled={response == null} className="btn-primary w-full">
          Check
        </button>
      ) : (
        <div className="space-y-3">
          <div className={`flex items-center gap-2 font-semibold ${
            verdict === 'correct' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {verdict === 'correct' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            {verdict === 'correct' ? 'Correct!' : 'Not quite'}
          </div>
          <button onClick={advance} className="btn-primary w-full">
            {idx + 1 >= questions.length ? 'Finish' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}

function OrderQuestion({ q, response, setResponse, disabled }: {
  q: Extract<QuizQuestion, { kind: 'order' }>;
  response: unknown;
  setResponse: (r: unknown) => void;
  disabled: boolean;
}) {
  const [pool, setPool] = useState(() => shuffle(q.items));
  const ordered = (response as string[]) ?? [];

  const pick = (item: string) => {
    if (disabled) return;
    const next = [...ordered, item];
    setResponse(next);
    setPool(pool.filter(x => x !== item));
  };
  const unpick = (i: number) => {
    if (disabled) return;
    const next = [...ordered];
    const [removed] = next.splice(i, 1);
    setResponse(next);
    setPool([...pool, removed]);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-serif text-xl text-ink-800 dark:text-ink-100">{q.prompt}</h3>
      <div className="space-y-2 min-h-[3rem] p-2 rounded-xl border-2 border-dashed border-gold-200 dark:border-ink-600">
        {ordered.map((item, i) => (
          <button key={i} onClick={() => unpick(i)} className="block w-full text-left px-3 py-2 rounded-lg bg-gold-100 dark:bg-ink-700 text-ink-800 dark:text-ink-100 text-sm">
            {i + 1}. {item}
          </button>
        ))}
        {ordered.length === 0 && <div className="text-sm text-ink-400 px-2 py-1">Tap items below in order</div>}
      </div>
      <div className="space-y-2">
        {pool.map(item => (
          <button key={item} onClick={() => pick(item)} className="block w-full text-left px-3 py-2 rounded-lg border border-gold-200 dark:border-ink-600 text-ink-800 dark:text-ink-100 hover:bg-gold-50 dark:hover:bg-ink-700 text-sm">
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function MatchQuestion({ q, response, setResponse, disabled }: {
  q: Extract<QuizQuestion, { kind: 'match' }>;
  response: unknown;
  setResponse: (r: unknown) => void;
  disabled: boolean;
}) {
  const lefts = q.pairs.map(p => p.left);
  const [rights] = useState(() => shuffle(q.pairs.map(p => p.right)));
  const current = (response as { left: string; right: string }[]) ?? lefts.map(l => ({ left: l, right: '' }));

  const setRight = (left: string, right: string) => {
    if (disabled) return;
    const next = current.map(c => c.left === left ? { left, right } : c);
    setResponse(next);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-serif text-xl text-ink-800 dark:text-ink-100">{q.prompt}</h3>
      <div className="space-y-2">
        {lefts.map(left => {
          const picked = current.find(c => c.left === left)?.right ?? '';
          return (
            <div key={left} className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-gold-50 dark:bg-ink-700 text-sm font-medium text-ink-800 dark:text-ink-100">{left}</div>
              <select
                value={picked}
                onChange={e => setRight(left, e.target.value)}
                disabled={disabled}
                className="px-3 py-2 rounded-lg border border-gold-200 dark:border-ink-600 bg-white dark:bg-ink-800 text-sm text-ink-800 dark:text-ink-100"
              >
                <option value="">— pick —</option>
                {rights.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
