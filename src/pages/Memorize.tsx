import { useEffect, useMemo, useState } from 'react';
import { db, type MemoryCard } from '../db/db';
import { gradeCard, maskByStage, type Grade } from '../lib/srs';
import { recordLesson } from '../lib/xp';
import { Brain, RotateCcw, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import starterDeck from '../data/memory-verses.json';
import { createCard } from '../lib/srs';

export default function Memorize() {
  const all = useLiveQuery(() => db.memoryCards.toArray(), [], []);
  const [tab, setTab] = useState<'due' | 'browse'>('due');
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    (async () => {
      const count = await db.memoryCards.count();
      if (count === 0 && !seeded) {
        const now = Date.now();
        const items = (starterDeck as { ref: string; text: string }[]).map(v => createCard(v.ref, v.text, now));
        await db.memoryCards.bulkAdd(items);
        setSeeded(true);
      }
    })();
  }, [seeded]);

  const due = useMemo(() => (all ?? []).filter(c => c.dueAt <= Date.now()), [all]);

  return (
    <div className="space-y-4 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2"><Brain size={24} /> Memorize</h1>
          <p className="text-sm text-ink-600 dark:text-ink-300">{due.length} due · {all?.length ?? 0} total</p>
        </div>
      </header>

      <div className="flex gap-2">
        <button onClick={() => setTab('due')} className={`flex-1 py-2 rounded-full font-medium text-sm transition ${
          tab === 'due' ? 'bg-gold-500 text-white' : 'text-ink-600 dark:text-ink-300 bg-white/70 dark:bg-ink-800/70 border border-gold-100 dark:border-ink-700'
        }`}>Due today</button>
        <button onClick={() => setTab('browse')} className={`flex-1 py-2 rounded-full font-medium text-sm transition ${
          tab === 'browse' ? 'bg-gold-500 text-white' : 'text-ink-600 dark:text-ink-300 bg-white/70 dark:bg-ink-800/70 border border-gold-100 dark:border-ink-700'
        }`}>Browse all</button>
      </div>

      {tab === 'due' && <ReviewSession cards={due} />}
      {tab === 'browse' && <BrowseList cards={all ?? []} />}
    </div>
  );
}

function ReviewSession({ cards }: { cards: MemoryCard[] }) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (cards.length === 0) {
    return (
      <div className="card text-center space-y-3">
        <div className="text-4xl">✨</div>
        <h3 className="font-serif text-xl text-gold-700 dark:text-gold-300">All caught up</h3>
        <p className="text-sm text-ink-600 dark:text-ink-300">No verses due right now. Come back later, or browse to add more.</p>
      </div>
    );
  }

  const card = cards[Math.min(idx, cards.length - 1)];
  const masked = maskByStage(card.text, card.stage);

  const grade = async (g: Grade) => {
    const r = gradeCard(card, g);
    await db.memoryCards.update(card.id!, { ...r, lastReviewedAt: Date.now() });
    await recordLesson(g === 'again' ? 2 : g === 'hard' ? 4 : g === 'good' ? 6 : 8, 1);
    setRevealed(false);
    if (idx + 1 < cards.length) setIdx(idx + 1);
    else setIdx(cards.length); // end-state
  };

  if (idx >= cards.length) {
    return (
      <div className="card text-center space-y-3">
        <div className="text-4xl">🌾</div>
        <h3 className="font-serif text-xl text-gold-700 dark:text-gold-300">Session complete</h3>
        <p className="text-sm text-ink-600 dark:text-ink-300">You reviewed {cards.length} verse{cards.length === 1 ? '' : 's'}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-ink-500 dark:text-ink-300/70">Card {idx + 1} of {cards.length} · stage {card.stage}</div>
      <div className="card space-y-3">
        <div className="text-sm font-medium text-gold-700 dark:text-gold-400">{card.ref}</div>
        <div className="verse-text italic whitespace-pre-wrap">{revealed ? card.text : masked}</div>
        <button onClick={() => setRevealed(r => !r)} className="btn-ghost self-start">
          {revealed ? <><EyeOff size={16} /> Hide</> : <><Eye size={16} /> Reveal</>}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => grade('again')} className="px-3 py-3 rounded-xl border border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 font-medium flex flex-col items-center">
          <RotateCcw size={16} /> Again
        </button>
        <button onClick={() => grade('hard')} className="px-3 py-3 rounded-xl border border-orange-300 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 font-medium">
          Hard
        </button>
        <button onClick={() => grade('good')} className="px-3 py-3 rounded-xl border border-gold-300 text-gold-700 dark:text-gold-300 hover:bg-gold-50 dark:hover:bg-ink-700 font-medium">
          Good
        </button>
        <button onClick={() => grade('easy')} className="px-3 py-3 rounded-xl border border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 font-medium">
          Easy
        </button>
      </div>
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
        <div className="card text-center text-ink-500 dark:text-ink-300/70">No verses yet.</div>
      ) : (
        cards.sort((a, b) => a.dueAt - b.dueAt).map(c => (
          <div key={c.id} className="card-tight flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gold-700 dark:text-gold-400">{c.ref}</div>
              <div className="text-sm text-ink-700 dark:text-ink-200 truncate font-serif italic">{c.text}</div>
              <div className="text-xs text-ink-500 dark:text-ink-300/70 mt-1">
                Stage {c.stage} · due {c.dueAt <= Date.now() ? 'now' : new Date(c.dueAt).toLocaleDateString()}
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
