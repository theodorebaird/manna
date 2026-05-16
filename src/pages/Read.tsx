import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BookOpen, Bookmark as BookmarkIcon, Brain, Sparkles } from 'lucide-react';
import { useScripture } from '../components/ScriptureProvider';
import { bookById, BOOKS, type BookInfo, type Verse, formatRef } from '../lib/bible';
import VerseList from '../components/VerseList';
import BookPicker from '../components/BookPicker';
import { db, getSettings, updateSettings, type Settings } from '../db/db';
import { createCard } from '../lib/srs';
import historyCards from '../data/history-cards.json';
import prophecyCards from '../data/prophecy-cards.json';

interface AttachedCards {
  history: { id: string; title: string }[];
  prophecy: { id: string; title: string }[];
}

function getAttachedCards(book: BookInfo, chapter: number): AttachedCards {
  const ref = `${book.name} ${chapter}`;
  const h = (historyCards as { id: string; title: string; refs: string[] }[]).filter(c =>
    c.refs.some(r => r.startsWith(ref))
  );
  const p = (prophecyCards as { id: string; title: string; prediction: { ref: string }; fulfillment: { ref: string } }[]).filter(c =>
    c.prediction.ref.startsWith(ref) || c.fulfillment.ref.startsWith(ref)
  );
  return {
    history: h.map(c => ({ id: c.id, title: c.title })),
    prophecy: p.map(c => ({ id: c.id, title: c.title }))
  };
}

export default function Read() {
  const params = useParams<{ book?: string; chapter?: string }>();
  const navigate = useNavigate();
  const { getChapter } = useScripture();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [picker, setPicker] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const bookId = params.book ?? 'john';
  const chapter = Math.max(1, parseInt(params.chapter ?? '1', 10));
  const book = bookById(bookId) ?? BOOKS[42]; // John fallback

  const cards = getAttachedCards(book, chapter);

  useEffect(() => {
    (async () => {
      setSettings(await getSettings());
    })();
  }, []);

  useEffect(() => {
    if (!params.book || !params.chapter) {
      navigate(`/read/${book.id}/${chapter}`, { replace: true });
      return;
    }
    setVerses([]);
    setSelectedVerse(null);
    (async () => {
      const v = await getChapter(book.id, chapter);
      setVerses(v);
      await updateSettings({ lastReadRef: `${book.name} ${chapter}` });
      await db.readingHistory.add({ ref: `${book.name} ${chapter}`, readAt: Date.now() });
    })();
  }, [book.id, chapter, params.book, params.chapter, getChapter, navigate]);

  const goPrev = () => {
    if (chapter > 1) navigate(`/read/${book.id}/${chapter - 1}`);
    else {
      const idx = BOOKS.findIndex(b => b.id === book.id);
      if (idx > 0) {
        const prev = BOOKS[idx - 1];
        navigate(`/read/${prev.id}/${prev.chapters}`);
      }
    }
  };
  const goNext = () => {
    if (chapter < book.chapters) navigate(`/read/${book.id}/${chapter + 1}`);
    else {
      const idx = BOOKS.findIndex(b => b.id === book.id);
      if (idx < BOOKS.length - 1) navigate(`/read/${BOOKS[idx + 1].id}/1`);
    }
  };

  const bookmark = async (v: Verse) => {
    const ref = `${book.name} ${chapter}:${v.v}`;
    await db.bookmarks.add({ ref, text: v.t, createdAt: Date.now() });
    flash(`Bookmarked ${ref}`);
  };

  const toMemorize = async (v: Verse) => {
    const ref = `${book.name} ${chapter}:${v.v}`;
    const exists = await db.memoryCards.where('ref').equals(ref).first();
    if (exists) { flash(`Already in your memory deck`); return; }
    await db.memoryCards.add(createCard(ref, v.t));
    flash(`Added ${ref} to memorize`);
  };

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <header className="flex items-center justify-between gap-2">
        <button onClick={() => setPicker(true)} className="btn-outline flex-1">
          <BookOpen size={18} />
          {book.name} {chapter}
        </button>
      </header>

      <div className="card">
        <VerseList
          verses={verses}
          highlightVerse={selectedVerse?.v}
          fontSize={settings?.fontSize ?? 'md'}
          onVerseClick={v => setSelectedVerse(prev => (prev?.v === v.v ? null : v))}
        />
      </div>

      {selectedVerse && (
        <div className="card animate-slide-up space-y-3">
          <div className="text-sm font-medium text-gold-700 dark:text-gold-400">
            {formatRef({ book, chapter, verseStart: selectedVerse.v })}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => bookmark(selectedVerse)} className="chip">
              <BookmarkIcon size={14} className="mr-1.5" /> Bookmark
            </button>
            <button onClick={() => toMemorize(selectedVerse)} className="chip">
              <Brain size={14} className="mr-1.5" /> Memorize
            </button>
          </div>
        </div>
      )}

      {(cards.history.length > 0 || cards.prophecy.length > 0) && (
        <div className="card space-y-3">
          <div className="section-label flex items-center gap-1.5"><Sparkles size={14} /> Study this passage</div>
          <div className="flex flex-col gap-2">
            {cards.history.map(c => (
              <div key={c.id} className="text-sm px-3 py-2 rounded-xl border border-gold-100 dark:border-ink-700 bg-gold-50/60 dark:bg-ink-700/40">
                <span className="text-xs uppercase tracking-wide text-gold-700 dark:text-gold-400 font-semibold mr-2">History</span>
                {c.title}
              </div>
            ))}
            {cards.prophecy.map(c => (
              <div key={c.id} className="text-sm px-3 py-2 rounded-xl border border-gold-100 dark:border-ink-700 bg-gold-50/60 dark:bg-ink-700/40">
                <span className="text-xs uppercase tracking-wide text-gold-700 dark:text-gold-400 font-semibold mr-2">Prophecy</span>
                {c.title}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between gap-2">
        <button onClick={goPrev} className="btn-ghost"><ChevronLeft size={18} /> Prev</button>
        <button onClick={goNext} className="btn-ghost">Next <ChevronRight size={18} /></button>
      </div>

      <BookPicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={(b, c) => navigate(`/read/${b.id}/${c}`)}
        currentBookId={book.id}
        currentChapter={chapter}
      />

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ink-900 text-gold-100 px-4 py-2 rounded-full text-sm shadow-soft animate-fade-in z-40">
          {toast}
        </div>
      )}
    </div>
  );
}
