import { useState } from 'react';
import { BOOKS, type BookInfo } from '../lib/bible';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (book: BookInfo, chapter: number) => void;
  currentBookId?: string;
  currentChapter?: number;
}

export default function BookPicker({ open, onClose, onPick, currentBookId }: Props) {
  const [selected, setSelected] = useState<BookInfo | null>(
    BOOKS.find(b => b.id === currentBookId) ?? null
  );
  const [tab, setTab] = useState<'OT' | 'NT'>('OT');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[85vh] bg-white dark:bg-ink-800 rounded-t-2xl sm:rounded-2xl border border-gold-200 dark:border-ink-700 shadow-soft flex flex-col animate-slide-up"
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
            <div className="overflow-y-auto p-3 grid grid-cols-2 gap-2">
              {BOOKS.filter(b => b.testament === tab).map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className="text-left px-3 py-2 rounded-xl border border-gold-100 dark:border-ink-700 hover:bg-gold-50 dark:hover:bg-ink-700 text-ink-800 dark:text-ink-100 transition"
                >
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-ink-500 dark:text-ink-300/70">{b.chapters} chapters</div>
                </button>
              ))}
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
