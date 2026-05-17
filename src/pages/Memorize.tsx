import { useEffect, useMemo, useState } from 'react';
import { db, getSettings, updateSettings, type MemoryCard, type Settings } from '../db/db';
import {
  applyResult, chooseDifficulty, planBlanks, expectedWords, checkAnswer,
  checkFullRecall, createCard, renderMasked, renderFirstLetters
} from '../lib/srs';
import { recordLesson } from '../lib/xp';
import {
  Brain, Plus, Trash2, CheckCircle2, XCircle, ArrowRight,
  BookOpen, Settings as Cog, X, Type, AlignJustify, Eye, KeyRound
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import starterDeck from '../data/memory-verses.json';

type MemorizeMode = 'fill-blanks' | 'first-letters' | 'type-full' | 'read-along';

const MODE_LABEL: Record<MemorizeMode, string> = {
  'fill-blanks': 'Fill in the blanks',
  'first-letters': 'First letters only',
  'type-full': 'Type the whole verse',
  'read-along': 'Read along (no test)'
};

const MODE_DESC: Record<MemorizeMode, string> = {
  'fill-blanks': 'Some words are hidden. Type the missing words. Difficulty grows with your mastery.',
  'first-letters': 'You see only the first letter of each word. Recite the verse, then check.',
  'type-full': 'Type the entire verse from memory. Hardest mode — best for verses you know well.',
  'read-along': 'Just read the verse to refresh it. No test. Use when you want light review.'
};

const MODE_ICON: Record<MemorizeMode, typeof Brain> = {
  'fill-blanks': AlignJustify,
  'first-letters': KeyRound,
  'type-full': Type,
  'read-along': Eye
};

export default function Memorize() {
  const all = useLiveQuery(() => db.memoryCards.toArray(), [], []);
  const [tab, setTab] = useState<'due' | 'browse'>('due');
  const [seeded, setSeeded] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showModeSheet, setShowModeSheet] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettings(s);
      const count = await db.memoryCards.count();
      if (count === 0 && !seeded) {
        const now = Date.now();
        const items = (starterDeck as { ref: string; text: string }[]).map(v => createCard(v.ref, v.text, now));
        await db.memoryCards.bulkAdd(items);
        setSeeded(true);
      }
    })();
  }, [seeded]);

  const mode: MemorizeMode = settings?.memorizeMode ?? 'fill-blanks';
  const setMode = async (m: MemorizeMode) => {
    const next = await updateSettings({ memorizeMode: m });
    setSettings(next);
    setShowModeSheet(false);
  };

  const due = useMemo(() => (all ?? []).filter(c => c.dueAt <= Date.now()), [all]);
  const mastered = useMemo(() => (all ?? []).filter(c => (c.masteryPercent ?? 0) >= 95).length, [all]);

  const ModeIcon = MODE_ICON[mode];

  return (
    <div className="space-y-4 animate-fade-in">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="page-title flex items-center gap-2"><Brain size={24} /> Memorize</h1>
          <p className="text-sm text-ink-600 dark:text-ink-300">
            {due.length} due · {all?.length ?? 0} total · {mastered} mastered
          </p>
        </div>
        <button
          onClick={() => setShowModeSheet(true)}
          className="chip text-xs flex-shrink-0"
          title="Change memorize mode"
        >
          <ModeIcon size={12} className="mr-1.5" />
          {MODE_LABEL[mode].split(' ')[0]}
          <Cog size={11} className="ml-1.5 opacity-60" />
        </button>
      </header>

      <div className="flex gap-2">
        <button onClick={() => setTab('due')} className={`flex-1 py-2 rounded-full font-medium text-sm transition ${
          tab === 'due' ? 'bg-gold-500 text-white' : 'text-ink-600 dark:text-ink-300 bg-white/70 dark:bg-ink-800/70 border border-gold-100 dark:border-ink-700'
        }`}>Due today</button>
        <button onClick={() => setTab('browse')} className={`flex-1 py-2 rounded-full font-medium text-sm transition ${
          tab === 'browse' ? 'bg-gold-500 text-white' : 'text-ink-600 dark:text-ink-300 bg-white/70 dark:bg-ink-800/70 border border-gold-100 dark:border-ink-700'
        }`}>Browse all</button>
      </div>

      {tab === 'due' && <ReviewSession cards={due} mode={mode} />}
      {tab === 'browse' && <BrowseList cards={all ?? []} />}

      {showModeSheet && (
        <ModeSheet currentMode={mode} onPick={setMode} onClose={() => setShowModeSheet(false)} />
      )}
    </div>
  );
}

function ModeSheet({ currentMode, onPick, onClose }: {
  currentMode: MemorizeMode;
  onPick: (m: MemorizeMode) => void;
  onClose: () => void;
}) {
  const modes: MemorizeMode[] = ['fill-blanks', 'first-letters', 'type-full', 'read-along'];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-ink-800 rounded-t-2xl sm:rounded-2xl border border-gold-200 dark:border-ink-700 shadow-soft p-4 space-y-3 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl text-gold-700 dark:text-gold-300">Memorize mode</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-800 dark:hover:text-ink-100"><X size={20} /></button>
        </div>
        <div className="space-y-2">
          {modes.map(m => {
            const active = m === currentMode;
            const Icon = MODE_ICON[m];
            return (
              <button
                key={m}
                onClick={() => onPick(m)}
                className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 ${
                  active
                    ? 'border-gold-500 bg-gold-50 dark:bg-ink-700'
                    : 'border-gold-100 dark:border-ink-700 hover:bg-gold-50 dark:hover:bg-ink-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  active ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-white' : 'bg-gold-100 dark:bg-ink-600 text-gold-700 dark:text-gold-300'
                }`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink-800 dark:text-ink-100 flex items-center gap-2">
                    {MODE_LABEL[m]}
                    {active && <span className="text-xs text-gold-700 dark:text-gold-300">Active</span>}
                  </div>
                  <div className="text-xs text-ink-500 dark:text-ink-300/70 mt-0.5">{MODE_DESC[m]}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type Phase = 'learn' | 'test' | 'result';

function ReviewSession({ cards, mode }: { cards: MemoryCard[]; mode: MemorizeMode }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('learn');
  const [answers, setAnswers] = useState<string[]>([]);
  const [fullRecall, setFullRecall] = useState('');
  const [scoreResult, setScoreResult] = useState<{ score: number; perWord?: { expected: string; given: string; ok: boolean }[]; before: number; after: number } | null>(null);

  const [sessionCards, setSessionCards] = useState<MemoryCard[]>([]);
  useEffect(() => {
    const userHasntStarted = idx === 0 && answers.length === 0 && fullRecall === '' && scoreResult === null;
    if (cards.length > sessionCards.length && userHasntStarted) {
      setSessionCards(cards);
    }
  }, [cards, sessionCards.length, idx, answers.length, fullRecall, scoreResult]);

  const card = sessionCards[idx];
  const mastery = card?.masteryPercent ?? 0;
  const adaptiveDifficulty = useMemo(() => card ? chooseDifficulty(mastery) : 'easy', [card, mastery]);
  // For fill-blanks mode use adaptive difficulty; other modes have fixed behavior
  const fillPlan = useMemo(
    () => card ? planBlanks(card.text, adaptiveDifficulty, card.id ?? 1) : null,
    [card, adaptiveDifficulty]
  );
  const expWords = useMemo(
    () => card && fillPlan ? expectedWords(card.text, fillPlan) : [],
    [card, fillPlan]
  );

  // Auto-skip the Learn step for cards already in practice range (except for read-along)
  useEffect(() => {
    if (card && phase === 'learn' && mastery >= 25 && mode !== 'read-along') setPhase('test');
  }, [card, phase, mastery, mode]);

  if (sessionCards.length === 0) {
    return (
      <div className="card text-center space-y-3">
        <div className="text-4xl">✨</div>
        <h3 className="font-serif text-xl text-gold-700 dark:text-gold-300">All caught up</h3>
        <p className="text-sm text-ink-600 dark:text-ink-300">No verses due right now. Come back later, or add more in Browse.</p>
      </div>
    );
  }

  if (idx >= sessionCards.length || !card || !fillPlan) {
    return (
      <div className="card text-center space-y-3">
        <div className="text-4xl">🌾</div>
        <h3 className="font-serif text-xl text-gold-700 dark:text-gold-300">Session complete</h3>
        <p className="text-sm text-ink-600 dark:text-ink-300">You reviewed {sessionCards.length} verse{sessionCards.length === 1 ? '' : 's'}.</p>
      </div>
    );
  }

  const submit = async () => {
    let result;
    if (mode === 'fill-blanks') {
      result = checkAnswer(expWords, answers);
    } else if (mode === 'type-full' || mode === 'first-letters') {
      result = checkFullRecall(card.text, fullRecall);
    } else {
      // read-along: treat as full credit, no test
      result = { correct: true, perWord: undefined as undefined | { expected: string; given: string; ok: boolean }[], score: 1 };
    }
    const before = mastery;
    const update = applyResult(card, result.score);
    await db.memoryCards.update(card.id!, update);
    await recordLesson(result.correct ? 8 : result.score >= 0.75 ? 4 : 2, 1);
    setScoreResult({ score: result.score, perWord: result.perWord, before, after: update.masteryPercent });
    setPhase('result');
  };

  const next = () => {
    setAnswers([]);
    setFullRecall('');
    setScoreResult(null);
    setPhase('learn');
    setIdx(idx + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-500 dark:text-ink-300/70">Card {idx + 1} of {sessionCards.length}</span>
        <span className="text-gold-700 dark:text-gold-400 font-medium">{Math.round(mastery)}% mastery</span>
      </div>
      <MasteryBar percent={mastery} />

      {phase === 'learn' && (
        <LearnView card={card} mode={mode} onReady={() => mode === 'read-along' ? submit() : setPhase('test')} />
      )}

      {phase === 'test' && (
        mode === 'fill-blanks' ? (
          <FillBlanksView card={card} plan={fillPlan} answers={answers} setAnswers={setAnswers} onSubmit={submit} />
        ) : mode === 'first-letters' ? (
          <FirstLettersView card={card} value={fullRecall} onChange={setFullRecall} onSubmit={submit} />
        ) : mode === 'type-full' ? (
          <TypeFullView card={card} value={fullRecall} onChange={setFullRecall} onSubmit={submit} />
        ) : null
      )}

      {phase === 'result' && scoreResult && (
        <ResultView
          result={scoreResult}
          card={card}
          mode={mode}
          onContinue={next}
        />
      )}
    </div>
  );
}

function MasteryBar({ percent }: { percent: number }) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-700 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function LearnView({ card, mode, onReady }: { card: MemoryCard; mode: MemorizeMode; onReady: () => void }) {
  const buttonLabel = mode === 'read-along' ? 'I read it (+ continue)' : "I'm ready to try";
  const hint = mode === 'read-along'
    ? 'Read this verse carefully. Tap below to mark it reviewed and move on.'
    : mode === 'fill-blanks'
    ? "Read carefully. Next: some words will be hidden and you'll type them in."
    : mode === 'first-letters'
    ? "Read carefully. Next: you'll see only the first letter of each word and type the verse out."
    : "Read carefully. Next: type the entire verse from memory.";

  return (
    <>
      <div className="card space-y-3 animate-fade-in">
        <div className="text-sm font-medium text-gold-700 dark:text-gold-400">{card.ref}</div>
        <div className="verse-text italic whitespace-pre-wrap">{card.text}</div>
        <div className="text-xs text-ink-500 dark:text-ink-300/70 italic">{hint}</div>
      </div>
      <button onClick={onReady} className="btn-primary w-full">
        {buttonLabel} <ArrowRight size={18} />
      </button>
    </>
  );
}

function FillBlanksView({
  card, plan, answers, setAnswers, onSubmit
}: {
  card: MemoryCard;
  plan: ReturnType<typeof planBlanks>;
  answers: string[];
  setAnswers: (a: string[]) => void;
  onSubmit: () => void;
}) {
  const masked = renderMasked(card.text, plan);
  const blanks = plan.blankIndexes.length;
  const allFilled = answers.length === blanks && answers.every(a => a.trim().length > 0);

  const setAt = (i: number, v: string) => {
    const next = [...answers];
    while (next.length < blanks) next.push('');
    next[i] = v;
    setAnswers(next);
  };

  return (
    <>
      <div className="card space-y-3 animate-fade-in">
        <div className="text-sm font-medium text-gold-700 dark:text-gold-400">{card.ref}</div>
        <div className="verse-text italic whitespace-pre-wrap">{masked}</div>
        <div className="text-xs text-ink-500 dark:text-ink-300/70">{plan.label}. Fill in the missing words in order.</div>
      </div>

      <div className="card space-y-2">
        <div className="section-label">Your answers</div>
        {Array.from({ length: blanks }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 text-right text-xs text-ink-500 dark:text-ink-300/70 font-medium">{i + 1}.</span>
            <input
              autoFocus={i === 0}
              type="text"
              value={answers[i] ?? ''}
              onChange={e => setAt(i, e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && allFilled) onSubmit(); }}
              placeholder="missing word"
              className="input flex-1"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
        ))}
      </div>

      <button onClick={onSubmit} disabled={!allFilled} className="btn-primary w-full">
        Check
      </button>
    </>
  );
}

function FirstLettersView({
  card, value, onChange, onSubmit
}: {
  card: MemoryCard;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const hint = renderFirstLetters(card.text);
  return (
    <>
      <div className="card space-y-3 animate-fade-in">
        <div className="text-sm font-medium text-gold-700 dark:text-gold-400">{card.ref}</div>
        <div className="font-serif text-lg leading-relaxed text-ink-800 dark:text-ink-100 whitespace-pre-wrap tracking-wider">
          {hint}
        </div>
        <div className="text-xs text-ink-500 dark:text-ink-300/70 italic">
          Type the verse out using these first-letter clues.
        </div>
      </div>
      <div className="card">
        <textarea
          autoFocus
          rows={5}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type the verse…"
          className="input resize-none w-full"
        />
      </div>
      <button onClick={onSubmit} disabled={value.trim().length < 5} className="btn-primary w-full">
        Check
      </button>
    </>
  );
}

function TypeFullView({
  card, value, onChange, onSubmit
}: {
  card: MemoryCard;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <div className="card space-y-3 animate-fade-in">
        <div className="text-sm font-medium text-gold-700 dark:text-gold-400">{card.ref}</div>
        <div className="text-sm text-ink-700 dark:text-ink-200">Type the entire verse from memory.</div>
      </div>
      <div className="card">
        <textarea
          autoFocus
          rows={6}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Recall the whole verse…"
          className="input resize-none w-full"
        />
      </div>
      <button onClick={onSubmit} disabled={value.trim().length < 10} className="btn-primary w-full">
        Check
      </button>
    </>
  );
}

function ResultView({
  result, card, mode, onContinue
}: {
  result: { score: number; perWord?: { expected: string; given: string; ok: boolean }[]; before: number; after: number };
  card: MemoryCard;
  mode: MemorizeMode;
  onContinue: () => void;
}) {
  const fullCorrect = result.score >= 0.999;
  const partial = !fullCorrect && result.score >= 0.5;
  const dropped = result.after < result.before;
  const isReadAlong = mode === 'read-along';

  return (
    <div className="space-y-4 animate-fade-in">
      <div className={`card text-center space-y-2 ${
        fullCorrect ? 'border-emerald-300 dark:border-emerald-700/60' :
        partial    ? 'border-gold-300 dark:border-gold-700/60' :
                     'border-rose-300 dark:border-rose-700/60'
      }`}>
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
          fullCorrect ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' :
          partial    ? 'bg-gold-100 dark:bg-ink-700 text-gold-700 dark:text-gold-300' :
                       'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
        }`}>
          {fullCorrect ? <CheckCircle2 size={32} /> : partial ? <ArrowRight size={32} /> : <XCircle size={32} />}
        </div>
        <h3 className="font-serif text-xl text-ink-800 dark:text-ink-100">
          {isReadAlong ? 'Marked reviewed' : fullCorrect ? 'Perfect!' : partial ? 'Almost there' : 'Keep practicing'}
        </h3>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          {result.before === result.after
            ? `Mastery: ${Math.round(result.after)}%`
            : <>Mastery: <strong>{Math.round(result.before)}% → {Math.round(result.after)}%</strong> {dropped ? '↓' : '↑'}</>
          }
        </p>
        <MasteryBar percent={result.after} />
      </div>

      {result.perWord && (
        <div className="card space-y-2">
          <div className="section-label">Word-by-word</div>
          <div className="flex flex-wrap gap-1.5">
            {result.perWord.map((w, i) => (
              <span key={i} className={`px-2 py-1 rounded text-xs font-medium ${
                w.ok
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'
              }`}>
                {w.ok ? (w.given || w.expected) : <>{w.given || '∅'} → <strong>{w.expected}</strong></>}
              </span>
            ))}
          </div>
        </div>
      )}

      {!result.perWord && !isReadAlong && !fullCorrect && (
        <div className="card space-y-2">
          <div className="section-label">Correct verse</div>
          <div className="verse-text italic whitespace-pre-wrap">{card.text}</div>
        </div>
      )}

      <button onClick={onContinue} className="btn-primary w-full">
        Continue <ArrowRight size={18} />
      </button>
    </div>
  );
}

function BrowseList({ cards }: { cards: MemoryCard[] }) {
  const [adding, setAdding] = useState(false);
  const [newRef, setNewRef] = useState('');
  const [newText, setNewText] = useState('');

  const add = async () => {
    if (!newRef.trim() || !newText.trim()) return;
    await db.memoryCards.add(createCard(newRef.trim(), newText.trim()));
    setNewRef(''); setNewText(''); setAdding(false);
  };

  return (
    <div className="space-y-3">
      {!adding && (
        <button onClick={() => setAdding(true)} className="btn-primary w-full">
          <Plus size={18} /> Add a verse
        </button>
      )}
      {adding && (
        <div className="card space-y-2">
          <input className="input" placeholder="Reference (e.g. John 3:16)" value={newRef} onChange={e => setNewRef(e.target.value)} />
          <textarea className="input resize-none" rows={3} placeholder="Verse text" value={newText} onChange={e => setNewText(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={add} className="btn-primary flex-1">Save</button>
            <button onClick={() => setAdding(false)} className="btn-ghost flex-1">Cancel</button>
          </div>
        </div>
      )}
      {cards.length === 0 ? (
        <div className="card text-center text-ink-500 dark:text-ink-300/70">
          <BookOpen size={28} className="mx-auto text-gold-500 mb-2" />
          No verses yet. Add one above or open the Read tab and tap a verse.
        </div>
      ) : (
        cards.sort((a, b) => (b.masteryPercent ?? 0) - (a.masteryPercent ?? 0)).map(c => (
          <div key={c.id} className="card-tight flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gold-700 dark:text-gold-400">{c.ref}</div>
              <div className="text-sm text-ink-700 dark:text-ink-200 truncate font-serif italic">{c.text}</div>
              <div className="mt-1.5"><MasteryBar percent={c.masteryPercent ?? 0} /></div>
              <div className="text-xs text-ink-500 dark:text-ink-300/70 mt-1">
                {Math.round(c.masteryPercent ?? 0)}% mastered · due {c.dueAt <= Date.now() ? 'now' : new Date(c.dueAt).toLocaleDateString()}
              </div>
            </div>
            <button onClick={async () => { if (confirm('Remove this verse?')) await db.memoryCards.delete(c.id!); }} className="text-ink-400 hover:text-rose-500 p-1">
              <Trash2 size={16} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
