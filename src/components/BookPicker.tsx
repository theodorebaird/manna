import { useEffect, useState } from 'react';
import { BOOKS, CHRONOLOGICAL_ORDER, bookById, type BookInfo } from '../lib/bible';
import { X } from 'lucide-react';
import { getSettings, updateSettings, type Settings } from '../db/db';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (book: BookInfo, chapter: number) => void;
  currentBookId?: string;
  currentChapter?: number;
}

type OrderMode = 'canonical' | 'chronological';

export default function BookPicker({ open, onClose, onPick, currentBookId }: Props) {
  const [selected, setSelected] = useState<BookInfo | null>(
    BOOKS.find(b => b.id === currentBookId) ?? null
  );
  const [tab, setTab] = useState<'OT' | 'NT'>('OT');
  const [orderMode, setOrderMode] = useState<OrderMode>('canonical');

  useEffect(() => {
    if (!open) return;
    (async () => {
      const s: Settings = await getSettings();
      if (s.bibleOrder === 'chronological') setOrderMode('chronological');
    })();
  }, [open]);

  const changeOrder = async (m: OrderMode) => {
    setOrderMode(m);
    await updateSettings({ bibleOrder: m });
  };

  if (!open) return null;

  const renderBooks = () => {
    if (orderMode === 'canonical') {
      return BOOKS.filter(b => b.testament === tab).map(b => (
        <button
          key={b.id}
          onClick={() => setSelected(b)}
          className="text-left px-3 py-2 rounded-xl border border-gold-100 dark:border-ink-700 hover:bg-gold-50 dark:hover:bg-ink-700 text-ink-800 dark:text-ink-100 transition"
        >
          <div className="font-medium">{b.name}</div>
          <div className="text-xs text-ink-500 dark:text-ink-300/70">{b.chapters} chapters</div>
        </button>
      ));
    }
    // Chronological — flat single-column list with era labels
    const filtered = CHRONOLOGICAL_ORDER
      .map(({ id, era }) => ({ book: bookById(id), era }))
      .filter(x => x.book && x.book.testament === tab) as { book: BookInfo; era: string }[];
    return filtered.map(({ book, era }) => (
      <button
        key={book.id}
        onClick={() => setSelected(book)}
        className="text-left px-3 py-2 rounded-xl border border-gold-100 dark:border-ink-700 hover:bg-gold-50 dark:hover:bg-ink-700 text-ink-800 dark:text-ink-100 transition col-span-2"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium">{book.name}</div>
          <div className="text-xs text-ink-500 dark:text-ink-300/70">{book.chapters} ch</div>
        </div>
        <div className="text-[11px] text-gold-700 dark:text-gold-400 italic mt-0.5">{era}</div>
      </button>
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[88vh] bg-white dark:bg-ink-800 rounded-t-2xl sm:rounded-2xl border border-gold-200 dark:border-ink-700 shadow-soft flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gold-100 dark:border-ink-700">
          <h3 className="font-serif text-xl text-gold-700 dark:text-gold-300">
            {selected ? `${selected.name} — pick chapter` : 'Choose a book'}
          </h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-800 dark:hover:text-ink-100">
            <X size={22} />
          </button>
        </div>

        {!selected && (
          <>
            <div className="flex gap-2 p-3 border-b border-gold-100 dark:border-ink-700">
              <button
                onClick={() => setTab('OT')}
                className={`flex-1 py-2 rounded-full font-medium text-sm transition ${
                  tab === 'OT' ? 'bg-gold-500 text-white' : 'text-ink-600 dark:text-ink-300 hover:bg-gold-50 dark:hover:bg-ink-700'
                }`}
              >
                Old Testament
              </button>
              <button
                onClick={() => setTab('NT')}
                className={`flex-1 py-2 rounded-full font-medium text-sm transition ${
                  tab === 'NT' ? 'bg-gold-500 text-white' : 'text-ink-600 dark:text-ink-300 hover:bg-gold-50 dark:hover:bg-ink-700'
                }`}
              >
                New Testament
              </button>
            </div>
            <div className="px-3 pt-3 -mb-1">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-ink-100/70 dark:bg-ink-700/70 border border-gold-100 dark:border-ink-700">
                <button
                  onClick={() => changeOrder('canonical')}
                  className={`py-1.5 rounded-lg text-xs font-medium transition ${
                    orderMode === 'canonical' ? 'bg-white dark:bg-ink-800 text-gold-700 dark:text-gold-300 shadow-soft' : 'text-ink-600 dark:text-ink-300'
                  }`}
                >
                  Canonical
                </button>
                <button
                  onClick={() => changeOrder('chronological')}
                  className={`py-1.5 rounded-lg text-xs font-medium transition ${
                    orderMode === 'chronological' ? 'bg-white dark:bg-ink-800 text-gold-700 dark:text-gold-300 shadow-soft' : 'text-ink-600 dark:text-ink-300'
                  }`}
                >
                  Chronological
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-3 grid grid-cols-2 gap-2">
              {renderBooks()}
            </div>
          </>
        )}

        {selected && (
          <>
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-gold-600 dark:text-gold-400 px-4 pt-3 self-start"
            >
              ← Back to books
            </button>
            <div className="overflow-y-auto p-3 grid grid-cols-6 gap-2">
              {Array.from({ length: selected.chapters }, (_, i) => i + 1).map(ch => (
                <button
                  key={ch}
                  onClick={() => { onPick(selected, ch); onClose(); }}
                  className="aspect-square rounded-xl border border-gold-200 dark:border-ink-600 hover:bg-gold-500 hover:text-white hover:border-gold-500 font-medium text-ink-800 dark:text-ink-100 transition"
                >
                  {ch}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
