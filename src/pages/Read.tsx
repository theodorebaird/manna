import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, BookOpen, Bookmark as BookmarkIcon, Brain,
  Sparkles, Highlighter, ZoomIn, ZoomOut, X, Save, Pencil, BookText,
  Volume2, Pause, Play as PlayIcon, Square
} from 'lucide-react';
import { Speaker, isSupported as ttsSupported } from '../lib/tts';
import { useScripture, TRANSLATIONS } from '../components/ScriptureProvider';
import { bookById, BOOKS, CHRONOLOGICAL_IDS, CHRONOLOGICAL_ORDER, type BookInfo, type Verse } from '../lib/bible';
import BookPicker from '../components/BookPicker';
import { db, getSettings, updateSettings, type Settings, type Highlight } from '../db/db';
import { CalendarRange, BookOpenCheck } from 'lucide-react';
import { createCard } from '../lib/srs';
import { useLiveQuery } from 'dexie-react-hooks';
import historyCards from '../data/history-cards.json';
import prophecyCards from '../data/prophecy-cards.json';
import crossRefs from '../data/cross-references.json';

interface AttachedCards {
  history: { id: string; title: string; body: string; sources?: string[] }[];
  prophecy: { id: string; title: string }[];
}

function getAttachedCards(book: BookInfo, chapter: number): AttachedCards {
  const ref = `${book.name} ${chapter}`;
  const h = (historyCards as { id: string; title: string; body: string; refs: string[]; sources?: string[] }[]).filter(c =>
    c.refs.some(r => r === ref || r.startsWith(ref + ':') || r.startsWith(book.name + ' ' + chapter + '-'))
  );
  const p = (prophecyCards as { id: string; title: string; prediction: { ref: string }; fulfillment: { ref: string } }[]).filter(c =>
    c.prediction.ref.startsWith(ref) || c.fulfillment.ref.startsWith(ref)
  );
  return {
    history: h.map(c => ({ id: c.id, title: c.title, body: c.body, sources: c.sources })),
    prophecy: p.map(c => ({ id: c.id, title: c.title }))
  };
}

const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink', 'orange'] as const;
type HL = typeof HIGHLIGHT_COLORS[number];

const HL_SWATCH: Record<HL, string> = {
  yellow: '#FDE68A',
  green: '#6EE7B7',
  blue: '#93C5FD',
  pink: '#F472B6',
  orange: '#FDBA74'
};

const HL_BG_LIGHT: Record<HL, string> = {
  yellow: 'rgba(252, 211, 77, 0.5)',
  green: 'rgba(110, 231, 183, 0.5)',
  blue: 'rgba(147, 197, 253, 0.5)',
  pink: 'rgba(244, 114, 182, 0.45)',
  orange: 'rgba(253, 186, 116, 0.55)'
};
const HL_BG_DARK: Record<HL, string> = {
  yellow: 'rgba(180, 83, 9, 0.45)',
  green: 'rgba(6, 95, 70, 0.55)',
  blue: 'rgba(30, 64, 175, 0.45)',
  pink: 'rgba(157, 23, 77, 0.5)',
  orange: 'rgba(154, 52, 18, 0.5)'
};

const SIZE_SCALE = { sm: 0.9, md: 1, lg: 1.15, xl: 1.3 } as const;

export default function Read() {
  const params = useParams<{ book?: string; chapter?: string }>();
  const navigate = useNavigate();
  const { getChapter, translationId } = useScripture();
  const translation = TRANSLATIONS.find(t => t.id === translationId);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [picker, setPicker] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [zoomDelta, setZoomDelta] = useState(0);
  const [studyVerse, setStudyVerse] = useState<{ verse: Verse; ref: string } | null>(null);
  const [noteVerse, setNoteVerse] = useState<{ verse: Verse; ref: string; existingNote: string } | null>(null);
  const [audioState, setAudioState] = useState<'stopped' | 'playing' | 'paused'>('stopped');
  const [speakingVerse, setSpeakingVerse] = useState<number | null>(null);
  const speakerRef = useMemo(() => new Speaker(), []);

  const bookId = params.book ?? 'john';
  const chapter = Math.max(1, parseInt(params.chapter ?? '1', 10));
  const book = bookById(bookId) ?? BOOKS[42];

  const cards = getAttachedCards(book, chapter);

  const highlights = useLiveQuery(
    () => db.highlights.where('[bookId+chapter]').equals([book.id, chapter]).toArray(),
    [book.id, chapter],
    []
  );
  const highlightMap = useMemo(() => {
    const m = new Map<number, HL>();
    for (const h of highlights ?? []) m.set(h.verse, h.color as HL);
    return m;
  }, [highlights]);

  useEffect(() => {
    (async () => { setSettings(await getSettings()); })();
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

  const order = settings?.bibleOrder === 'chronological' ? 'chronological' : 'canonical';
  const orderedIds = order === 'chronological' ? CHRONOLOGICAL_IDS : BOOKS.map(b => b.id);
  const currentBookEra = order === 'chronological'
    ? CHRONOLOGICAL_ORDER.find(c => c.id === book.id)?.era
    : null;

  const prevLabel = (() => {
    if (chapter > 1) return `${book.name} ${chapter - 1}`;
    const idx = orderedIds.indexOf(book.id);
    if (idx > 0) { const prev = bookById(orderedIds[idx - 1]); return prev ? `${prev.name} ${prev.chapters}` : ''; }
    return '';
  })();
  const nextLabel = (() => {
    if (chapter < book.chapters) return `${book.name} ${chapter + 1}`;
    const idx = orderedIds.indexOf(book.id);
    if (idx >= 0 && idx < orderedIds.length - 1) {
      const nxt = bookById(orderedIds[idx + 1]);
      return nxt ? `${nxt.name} 1` : '';
    }
    return '';
  })();

  const goPrev = () => {
    if (chapter > 1) navigate(`/read/${book.id}/${chapter - 1}`);
    else {
      const idx = orderedIds.indexOf(book.id);
      if (idx > 0) {
        const prev = bookById(orderedIds[idx - 1]);
        if (prev) navigate(`/read/${prev.id}/${prev.chapters}`);
      }
    }
  };
  const goNext = () => {
    if (chapter < book.chapters) navigate(`/read/${book.id}/${chapter + 1}`);
    else {
      const idx = orderedIds.indexOf(book.id);
      if (idx >= 0 && idx < orderedIds.length - 1) {
        const nxt = bookById(orderedIds[idx + 1]);
        if (nxt) navigate(`/read/${nxt.id}/1`);
      }
    }
  };

  const setOrder = async (m: 'canonical' | 'chronological') => {
    const next = await updateSettings({ bibleOrder: m });
    setSettings(next);
  };

  // Stop audio whenever the chapter changes or component unmounts.
  useEffect(() => {
    return () => {
      speakerRef.stop();
      setAudioState('stopped');
      setSpeakingVerse(null);
    };
  }, [book.id, chapter, speakerRef]);

  const playAudio = () => {
    if (!ttsSupported() || verses.length === 0) return;
    const chunks = verses.map(v => ({ text: `Verse ${v.v}. ${v.t}`, meta: { verse: v.v } }));
    setAudioState('playing');
    speakerRef.speak(chunks, {
      voiceURI: settings?.voiceURI ?? null,
      rate: settings?.speechRate ?? 1,
      onChunkStart: chunk => {
        const v = chunk.meta?.verse;
        if (typeof v === 'number') setSpeakingVerse(v);
      },
      onEnd: () => { setAudioState('stopped'); setSpeakingVerse(null); },
      onError: () => { setAudioState('stopped'); setSpeakingVerse(null); }
    });
  };
  const pauseAudio = () => { speakerRef.pause(); setAudioState('paused'); };
  const resumeAudio = () => { speakerRef.resume(); setAudioState('playing'); };
  const stopAudio = () => { speakerRef.stop(); setAudioState('stopped'); setSpeakingVerse(null); };

  const flash = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(null), 1800); };

  const bookmark = async (v: Verse, openNote = false) => {
    const refStr = `${book.name} ${chapter}:${v.v}`;
    const existing = await db.bookmarks.where('ref').equals(refStr).first();
    if (existing) {
      if (openNote) {
        setSelectedVerse(null);
        setNoteVerse({ verse: v, ref: refStr, existingNote: existing.note ?? '' });
      } else flash(`Already bookmarked`);
      return;
    }
    await db.bookmarks.add({ ref: refStr, text: v.t, createdAt: Date.now() });
    setSelectedVerse(null);
    if (openNote) setNoteVerse({ verse: v, ref: refStr, existingNote: '' });
    else flash(`Bookmarked ${refStr}`);
  };

  const toMemorize = async (v: Verse) => {
    const refStr = `${book.name} ${chapter}:${v.v}`;
    const exists = await db.memoryCards.where('ref').equals(refStr).first();
    setSelectedVerse(null);
    if (exists) { flash(`Already in memory deck`); return; }
    await db.memoryCards.add(createCard(refStr, v.t));
    flash(`Added ${refStr} to memorize`);
  };

  const highlight = async (v: Verse, color: HL) => {
    const refStr = `${book.name} ${chapter}:${v.v}`;
    const existing = await db.highlights.where('ref').equals(refStr).first();
    if (existing) {
      if (existing.color === color) await db.highlights.delete(existing.id!);
      else await db.highlights.update(existing.id!, { color });
    } else {
      const entry: Omit<Highlight, 'id'> = { ref: refStr, bookId: book.id, chapter, verse: v.v, color, createdAt: Date.now() };
      await db.highlights.add(entry as Highlight);
    }
  };

  const baseSize = SIZE_SCALE[settings?.fontSize ?? 'md'];
  const effectiveScale = baseSize * (1 + zoomDelta * 0.12);

  return (
    <div className="space-y-4 animate-fade-in">
      <header className="space-y-2">
        {/* Reading order — primary mode toggle at the very top */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-ink-100/70 dark:bg-ink-800/70 border border-gold-200 dark:border-ink-700">
          <button
            onClick={() => setOrder('canonical')}
            className={`py-2 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
              order === 'canonical' ? 'bg-white dark:bg-ink-700 text-gold-700 dark:text-gold-300 shadow-soft' : 'text-ink-600 dark:text-ink-300'
            }`}
          >
            <BookOpenCheck size={15} /> Traditional
          </button>
          <button
            onClick={() => setOrder('chronological')}
            className={`py-2 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
              order === 'chronological' ? 'bg-white dark:bg-ink-700 text-gold-700 dark:text-gold-300 shadow-soft' : 'text-ink-600 dark:text-ink-300'
            }`}
          >
            <CalendarRange size={15} /> Chronological
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button onClick={() => setPicker(true)} className="btn-outline flex-1">
            <BookOpen size={18} />
            {book.name} {chapter}
          </button>
          <div className="flex items-center gap-1">
            {ttsSupported() && (
              audioState === 'stopped' ? (
                <button onClick={playAudio} className="w-9 h-9 rounded-full border border-gold-200 dark:border-ink-600 text-ink-700 dark:text-ink-200 flex items-center justify-center" title="Listen to this chapter">
                  <Volume2 size={16} />
                </button>
              ) : audioState === 'playing' ? (
                <button onClick={pauseAudio} className="w-9 h-9 rounded-full bg-gold-500 text-white flex items-center justify-center" title="Pause">
                  <Pause size={16} />
                </button>
              ) : (
                <button onClick={resumeAudio} className="w-9 h-9 rounded-full bg-gold-500 text-white flex items-center justify-center" title="Resume">
                  <PlayIcon size={16} />
                </button>
              )
            )}
            {audioState !== 'stopped' && (
              <button onClick={stopAudio} className="w-9 h-9 rounded-full border border-gold-200 dark:border-ink-600 text-ink-700 dark:text-ink-200 flex items-center justify-center" title="Stop">
                <Square size={14} />
              </button>
            )}
            <button onClick={() => setZoomDelta(z => Math.max(-2, z - 1))} className="w-9 h-9 rounded-full border border-gold-200 dark:border-ink-600 text-ink-700 dark:text-ink-200 flex items-center justify-center" title="Smaller">
              <ZoomOut size={16} />
            </button>
            <button onClick={() => setZoomDelta(z => Math.min(3, z + 1))} className="w-9 h-9 rounded-full border border-gold-200 dark:border-ink-600 text-ink-700 dark:text-ink-200 flex items-center justify-center" title="Larger">
              <ZoomIn size={16} />
            </button>
            <Link to="/settings" className="chip text-xs" title="Change translation in Settings">
              {translation?.short ?? 'KJV'}
            </Link>
          </div>
        </div>

        {order === 'chronological' && (
          <div className="text-[11px] text-ink-500 dark:text-ink-300/70 italic px-1 flex items-center gap-1.5">
            <CalendarRange size={11} className="text-gold-600 dark:text-gold-400" />
            {currentBookEra ? `${book.name} — ${currentBookEra}` : `Reading in chronological order. Tap Next to follow the timeline.`}
          </div>
        )}
      </header>

      <div className="card">
        <ChapterRenderer
          verses={verses}
          scale={effectiveScale}
          highlightMap={highlightMap}
          selectedVerse={selectedVerse?.v ?? null}
          speakingVerse={speakingVerse}
          onVerseClick={v => setSelectedVerse(prev => (prev?.v === v.v ? null : v))}
        />
      </div>

      {(cards.history.length > 0 || cards.prophecy.length > 0) && (
        <div className="card space-y-3">
          <div className="section-label flex items-center gap-1.5"><Sparkles size={14} /> Study this passage</div>
          <div className="flex flex-col gap-2">
            {cards.history.map(c => (
              <Link
                key={c.id}
                to={`/study/${c.id}?from=${book.id}/${chapter}`}
                className="text-left text-sm px-4 py-3 rounded-xl border border-gold-200 dark:border-ink-700 bg-gold-50/60 dark:bg-ink-700/40 hover:bg-gold-100 dark:hover:bg-ink-700 transition flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs uppercase tracking-wide text-gold-700 dark:text-gold-400 font-semibold mb-0.5">History</div>
                  <div className="text-ink-800 dark:text-ink-100 font-medium">{c.title}</div>
                </div>
                <ChevronRight size={16} className="text-gold-600 dark:text-gold-400 flex-shrink-0" />
              </Link>
            ))}
            {cards.prophecy.map(c => (
              <Link
                key={c.id}
                to={`/study/prophecy-${c.id}?from=${book.id}/${chapter}`}
                className="text-left text-sm px-4 py-3 rounded-xl border border-gold-200 dark:border-ink-700 bg-gold-50/60 dark:bg-ink-700/40 hover:bg-gold-100 dark:hover:bg-ink-700 transition flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs uppercase tracking-wide text-gold-700 dark:text-gold-400 font-semibold mb-0.5">Prophecy</div>
                  <div className="text-ink-800 dark:text-ink-100 font-medium">{c.title}</div>
                </div>
                <ChevronRight size={16} className="text-gold-600 dark:text-gold-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between gap-2">
        <button onClick={goPrev} className="btn-ghost text-left">
          <ChevronLeft size={18} />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] uppercase tracking-wider opacity-70">Prev</span>
            <span className="text-xs">{prevLabel}</span>
          </div>
        </button>
        <button onClick={goNext} className="btn-ghost text-right">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-[10px] uppercase tracking-wider opacity-70">Next</span>
            <span className="text-xs">{nextLabel}</span>
          </div>
          <ChevronRight size={18} />
        </button>
      </div>

      <BookPicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={(b, c) => navigate(`/read/${b.id}/${c}`)}
        currentBookId={book.id}
        currentChapter={chapter}
      />

      {/* Verse action floating popup */}
      {selectedVerse && (
        <VerseActionModal
          verse={selectedVerse}
          verseRef={`${book.name} ${chapter}:${selectedVerse.v}`}
          activeHighlight={highlightMap.get(selectedVerse.v)}
          onClose={() => setSelectedVerse(null)}
          onBookmark={() => bookmark(selectedVerse, false)}
          onBookmarkWithNote={() => bookmark(selectedVerse, true)}
          onMemorize={() => toMemorize(selectedVerse)}
          onStudy={() => { setStudyVerse({ verse: selectedVerse, ref: `${book.name} ${chapter}:${selectedVerse.v}` }); setSelectedVerse(null); }}
          onHighlight={c => highlight(selectedVerse, c)}
        />
      )}

      {studyVerse && (
        <StudyModal verse={studyVerse.verse} verseRef={studyVerse.ref} onClose={() => setStudyVerse(null)} />
      )}

      {noteVerse && (
        <NoteModal
          verseRef={noteVerse.ref}
          text={noteVerse.verse.t}
          initialNote={noteVerse.existingNote}
          onClose={() => setNoteVerse(null)}
          onSave={async note => {
            const existing = await db.bookmarks.where('ref').equals(noteVerse.ref).first();
            if (existing) await db.bookmarks.update(existing.id!, { note: note.trim() || undefined, updatedAt: Date.now() });
            setNoteVerse(null);
            flash('Note saved');
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ink-900 text-gold-100 px-4 py-2 rounded-full text-sm shadow-soft animate-fade-in z-40">
          {toast}
        </div>
      )}
    </div>
  );
}

function ChapterRenderer({ verses, scale, highlightMap, selectedVerse, speakingVerse, onVerseClick }: {
  verses: Verse[];
  scale: number;
  highlightMap: Map<number, HL>;
  selectedVerse: number | null;
  speakingVerse: number | null;
  onVerseClick: (v: Verse) => void;
}) {
  if (verses.length === 0) {
    return <div className="text-center text-ink-500 dark:text-ink-300/70 py-8">Loading scripture…</div>;
  }
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  return (
    <div
      className="font-serif leading-relaxed text-ink-800 dark:text-ink-100"
      style={{ fontSize: `${scale}rem`, lineHeight: 1.55 }}
    >
      {verses.map(v => {
        const isSelected = selectedVerse === v.v;
        const isSpeaking = speakingVerse === v.v;
        const hl = highlightMap.get(v.v);
        const bg = isSpeaking
          ? (isDark ? 'rgba(217, 119, 6, 0.35)' : 'rgba(252, 211, 77, 0.55)')
          : (hl ? (isDark ? HL_BG_DARK[hl] : HL_BG_LIGHT[hl]) : undefined);
        return (
          <span
            key={v.v}
            id={`v${v.v}`}
            onClick={() => onVerseClick(v)}
            className={`inline cursor-pointer transition rounded px-0.5 ${
              isSelected ? 'ring-2 ring-gold-500 ring-offset-1 ring-offset-transparent' : ''
            } ${isSpeaking ? 'ring-1 ring-gold-400' : ''}`}
            style={{ backgroundColor: bg }}
          >
            <sup className="text-xs font-sans font-semibold text-gold-600 dark:text-gold-400 mr-1 select-none">{v.v}</sup>
            {v.t}{' '}
          </span>
        );
      })}
    </div>
  );
}

function VerseActionModal({
  verse, verseRef, activeHighlight, onClose,
  onBookmark, onBookmarkWithNote, onMemorize, onStudy, onHighlight
}: {
  verse: Verse;
  verseRef: string;
  activeHighlight?: HL;
  onClose: () => void;
  onBookmark: () => void;
  onBookmarkWithNote: () => void;
  onMemorize: () => void;
  onStudy: () => void;
  onHighlight: (c: HL) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-ink-800 rounded-t-2xl sm:rounded-2xl border border-gold-200 dark:border-ink-700 shadow-soft p-4 space-y-4 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gold-700 dark:text-gold-400">{verseRef}</div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-800 dark:hover:text-ink-100"><X size={18} /></button>
        </div>

        <div className="text-sm text-ink-700 dark:text-ink-200 italic font-serif border-l-2 border-gold-300 dark:border-gold-700 pl-3">
          {verse.t}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={onBookmark} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gold-200 dark:border-ink-600 text-ink-800 dark:text-ink-100 font-medium text-sm hover:bg-gold-50 dark:hover:bg-ink-700 transition">
            <BookmarkIcon size={16} /> Save
          </button>
          <button onClick={onBookmarkWithNote} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gold-200 dark:border-ink-600 text-ink-800 dark:text-ink-100 font-medium text-sm hover:bg-gold-50 dark:hover:bg-ink-700 transition">
            <Pencil size={16} /> Save + note
          </button>
          <button onClick={onMemorize} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gold-200 dark:border-ink-600 text-ink-800 dark:text-ink-100 font-medium text-sm hover:bg-gold-50 dark:hover:bg-ink-700 transition">
            <Brain size={16} /> Memorize
          </button>
          <button onClick={onStudy} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gold-200 dark:border-ink-600 text-ink-800 dark:text-ink-100 font-medium text-sm hover:bg-gold-50 dark:hover:bg-ink-700 transition">
            <BookText size={16} /> Study
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-500 dark:text-ink-300/70 uppercase tracking-wider">
            <Highlighter size={12} /> Highlight
          </div>
          <div className="flex gap-2">
            {HIGHLIGHT_COLORS.map(c => {
              const active = activeHighlight === c;
              return (
                <button
                  key={c}
                  onClick={() => onHighlight(c)}
                  className={`w-10 h-10 rounded-full border-2 transition shadow-soft ${
                    active ? 'border-ink-900 dark:border-ink-100 scale-110' : 'border-white/60 dark:border-ink-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: HL_SWATCH[c] }}
                  title={`${active ? 'Remove' : 'Highlight'} ${c}`}
                />
              );
            })}
          </div>
          {activeHighlight && (
            <p className="text-xs text-ink-500 dark:text-ink-300/70 italic">
              Tap the active color again to remove the highlight.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StudyModal({ verse, verseRef, onClose }: { verse: Verse; verseRef: string; onClose: () => void }) {
  const data = (crossRefs as Record<string, { refs: string[]; commentary: string }>)[verseRef];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white dark:bg-ink-800 rounded-t-2xl sm:rounded-2xl border border-gold-200 dark:border-ink-700 shadow-soft p-4 space-y-4 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl text-gold-700 dark:text-gold-300 flex items-center gap-2">
            <BookText size={20} /> Study
          </h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-800 dark:hover:text-ink-100"><X size={20} /></button>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-gold-700 dark:text-gold-400">{verseRef}</div>
          <div className="verse-text italic text-base">{verse.t}</div>
        </div>

        {data ? (
          <>
            <div className="space-y-2">
              <div className="section-label">Commentary</div>
              <div className="text-sm text-ink-700 dark:text-ink-200 leading-relaxed">{data.commentary}</div>
            </div>
            <div className="space-y-2">
              <div className="section-label">Cross-references</div>
              <div className="flex flex-wrap gap-1.5">
                {data.refs.map(r => {
                  const slug = r.toLowerCase().replace(/^(\d)\s+/, '$1-').replace(/\s+\d+:\d+(-\d+)?$/, '').replace(/\s+/g, '-');
                  const chapter = r.match(/(\d+):/)?.[1] ?? '1';
                  return (
                    <Link
                      key={r}
                      to={`/read/${slug}/${chapter}`}
                      onClick={onClose}
                      className="chip text-xs"
                    >
                      {r}
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="card-tight text-sm text-ink-600 dark:text-ink-300 italic">
            No commentary yet for this verse. We're adding study notes one verse at a time — popular verses come first. Try John 3:16, Romans 8:28, Psalm 23:1, or any other classic.
          </div>
        )}
      </div>
    </div>
  );
}

function NoteModal({ verseRef, text, initialNote, onClose, onSave }: {
  verseRef: string;
  text: string;
  initialNote: string;
  onClose: () => void;
  onSave: (note: string) => Promise<void> | void;
}) {
  const [note, setNote] = useState(initialNote);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-ink-800 rounded-t-2xl sm:rounded-2xl border border-gold-200 dark:border-ink-700 shadow-soft p-4 space-y-3 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl text-gold-700 dark:text-gold-300">Note on {verseRef}</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-800 dark:hover:text-ink-100"><X size={20} /></button>
        </div>
        <div className="verse-text italic text-sm text-ink-700 dark:text-ink-200">{text}</div>
        <textarea
          autoFocus
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={5}
          placeholder="What does this verse mean to you? What did God show you?"
          className="input resize-none"
        />
        <button onClick={() => onSave(note)} className="btn-primary w-full">
          <Save size={16} /> Save note
        </button>
      </div>
    </div>
  );
}
