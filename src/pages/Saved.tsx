import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bookmark as BookmarkIcon, Trash2, Pencil, X, Save, Highlighter } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Bookmark } from '../db/db';

export default function Saved() {
  const bookmarks = useLiveQuery(() => db.bookmarks.orderBy('createdAt').reverse().toArray(), [], []);
  const highlights = useLiveQuery(() => db.highlights.orderBy('createdAt').reverse().toArray(), [], []);
  const [tab, setTab] = useState<'bookmarks' | 'highlights'>('bookmarks');
  const [editing, setEditing] = useState<Bookmark | null>(null);

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <header className="flex items-center justify-between">
        <Link to="/" className="btn-ghost"><ArrowLeft size={18} /> Home</Link>
      </header>

      <div>
        <h1 className="page-title flex items-center gap-2"><BookmarkIcon size={24} /> Saved</h1>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          Verses you bookmarked and chapters where you've highlighted text.
        </p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('bookmarks')} className={`flex-1 py-2 rounded-full font-medium text-sm transition ${
          tab === 'bookmarks' ? 'bg-gold-500 text-white' : 'text-ink-600 dark:text-ink-300 bg-white/70 dark:bg-ink-800/70 border border-gold-100 dark:border-ink-700'
        }`}>Bookmarks ({bookmarks?.length ?? 0})</button>
        <button onClick={() => setTab('highlights')} className={`flex-1 py-2 rounded-full font-medium text-sm transition ${
          tab === 'highlights' ? 'bg-gold-500 text-white' : 'text-ink-600 dark:text-ink-300 bg-white/70 dark:bg-ink-800/70 border border-gold-100 dark:border-ink-700'
        }`}>Highlights ({highlights?.length ?? 0})</button>
      </div>

      {tab === 'bookmarks' && (
        <div className="space-y-3">
          {(bookmarks ?? []).length === 0 && (
            <div className="card text-center text-ink-500 dark:text-ink-300/70">
              No bookmarks yet. Open Read, tap any verse, and choose Bookmark.
            </div>
          )}
          {(bookmarks ?? []).map(b => (
            <BookmarkCard key={b.id} bookmark={b} onEdit={() => setEditing(b)} />
          ))}
        </div>
      )}

      {tab === 'highlights' && (
        <div className="space-y-3">
          {(highlights ?? []).length === 0 && (
            <div className="card text-center text-ink-500 dark:text-ink-300/70">
              No highlights yet. In Read, tap a verse and choose <Highlighter size={12} className="inline" /> Highlight.
            </div>
          )}
          {(highlights ?? []).map(h => (
            <Link
              key={h.id}
              to={`/read/${h.bookId}/${h.chapter}`}
              className="block card-tight hover:shadow-glow transition"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                    style={{ backgroundColor: { yellow: '#FDE68A', green: '#6EE7B7', blue: '#93C5FD', pink: '#F472B6', orange: '#FDBA74' }[h.color] ?? '#FDE68A' }}
                  />
                  <span className="text-sm font-medium text-gold-700 dark:text-gold-400">{h.ref}</span>
                </div>
                <button
                  onClick={async e => { e.preventDefault(); if (confirm('Remove this highlight?')) await db.highlights.delete(h.id!); }}
                  className="text-ink-400 hover:text-rose-500 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {editing && <EditNoteModal bookmark={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function BookmarkCard({ bookmark, onEdit }: { bookmark: Bookmark; onEdit: () => void }) {
  const remove = async () => {
    if (confirm('Remove this bookmark?')) await db.bookmarks.delete(bookmark.id!);
  };
  const slug = bookmark.ref.toLowerCase().replace(/^(\d)\s+/, '$1-').replace(/\s+\d+:\d+(-\d+)?$/, '').replace(/\s+/g, '-');
  const chapterMatch = bookmark.ref.match(/(\d+):/);
  const chapter = chapterMatch ? chapterMatch[1] : '1';

  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Link to={`/read/${slug}/${chapter}`} className="text-sm font-medium text-gold-700 dark:text-gold-400">
          {bookmark.ref}
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="text-ink-500 hover:text-gold-700 dark:hover:text-gold-400 p-1" title={bookmark.note ? 'Edit note' : 'Add note'}>
            <Pencil size={14} />
          </button>
          <button onClick={remove} className="text-ink-400 hover:text-rose-500 p-1">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="verse-text italic text-base">{bookmark.text}</div>
      {bookmark.note && (
        <div className="text-sm text-ink-700 dark:text-ink-200 border-l-2 border-gold-300 dark:border-gold-700 pl-3 italic mt-2">
          {bookmark.note}
        </div>
      )}
    </div>
  );
}

function EditNoteModal({ bookmark, onClose }: { bookmark: Bookmark; onClose: () => void }) {
  const [note, setNote] = useState(bookmark.note ?? '');

  const save = async () => {
    await db.bookmarks.update(bookmark.id!, { note: note.trim() || undefined, updatedAt: Date.now() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-ink-800 rounded-t-2xl sm:rounded-2xl border border-gold-200 dark:border-ink-700 shadow-soft p-4 space-y-3 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl text-gold-700 dark:text-gold-300">Note on {bookmark.ref}</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-800 dark:hover:text-ink-100"><X size={20} /></button>
        </div>
        <div className="verse-text italic text-sm text-ink-700 dark:text-ink-200">{bookmark.text}</div>
        <textarea
          autoFocus
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={5}
          placeholder="What does this verse mean to you? What did God show you?"
          className="input resize-none"
        />
        <button onClick={save} className="btn-primary w-full">
          <Save size={16} /> Save note
        </button>
      </div>
    </div>
  );
}
