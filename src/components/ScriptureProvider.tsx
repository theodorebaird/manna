import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { BookData, Verse } from '../lib/bible';
import { getSettings, type Settings } from '../db/db';

export type TranslationId = 'kjv' | 'asv' | 'bsb';

export const TRANSLATIONS: { id: TranslationId; name: string; short: string; year: number; note: string }[] = [
  { id: 'kjv', name: 'King James Version', short: 'KJV', year: 1611, note: 'Classic, traditional English' },
  { id: 'asv', name: 'American Standard Version', short: 'ASV', year: 1901, note: 'Word-for-word, the literal ancestor of NASB' },
  { id: 'bsb', name: 'Berean Standard Bible', short: 'BSB', year: 2022, note: 'Modern, readable, word-for-word' }
];

interface ScriptureCtx {
  translationId: TranslationId;
  setTranslation: (id: TranslationId) => Promise<void>;
  loadBook: (bookId: string) => Promise<BookData>;
  getChapter: (bookId: string, chapter: number) => Promise<Verse[]>;
  getVerse: (bookId: string, chapter: number, verse: number) => Promise<Verse | null>;
}

const Ctx = createContext<ScriptureCtx | null>(null);

// Eager-known loader maps — Vite analyzes these at build time and code-splits each
// book into its own chunk that lazy-loads on first request.
const loaders: Record<TranslationId, Record<string, () => Promise<{ default: BookData }>>> = {
  kjv: import.meta.glob<{ default: BookData }>('../data/bible/kjv/*.json'),
  asv: import.meta.glob<{ default: BookData }>('../data/bible/asv/*.json'),
  bsb: import.meta.glob<{ default: BookData }>('../data/bible/bsb/*.json')
};

function pathFor(translationId: TranslationId, bookId: string): string {
  return `../data/bible/${translationId}/${bookId}.json`;
}

export function ScriptureProvider({ children }: { children: ReactNode }) {
  const [translationId, setTranslationId] = useState<TranslationId>('kjv');
  // cache + inFlight keyed by `${translation}:${bookId}`
  const cache = useRef<Map<string, BookData>>(new Map());
  const inFlight = useRef<Map<string, Promise<BookData>>>(new Map());

  useEffect(() => {
    (async () => {
      const s: Settings = await getSettings();
      if (s.translationId) setTranslationId(s.translationId);
    })();
  }, []);

  const loadBook = useCallback(async (bookId: string): Promise<BookData> => {
    const key = `${translationId}:${bookId}`;
    if (cache.current.has(key)) return cache.current.get(key)!;
    if (inFlight.current.has(key)) return inFlight.current.get(key)!;
    const loaderMap = loaders[translationId] ?? loaders.kjv;
    const loader = loaderMap[pathFor(translationId, bookId)] ?? loaders.kjv[pathFor('kjv', bookId)];
    if (!loader) throw new Error(`Bible book not found: ${bookId}`);
    const p = (async () => {
      const mod = await loader();
      const data = (mod.default ?? (mod as unknown as BookData)) as BookData;
      cache.current.set(key, data);
      inFlight.current.delete(key);
      return data;
    })();
    inFlight.current.set(key, p);
    return p;
  }, [translationId]);

  const getChapter = useCallback(async (bookId: string, chapter: number): Promise<Verse[]> => {
    const book = await loadBook(bookId);
    return book.chapters[chapter - 1] ?? [];
  }, [loadBook]);

  const getVerse = useCallback(async (bookId: string, chapter: number, verse: number): Promise<Verse | null> => {
    const verses = await getChapter(bookId, chapter);
    return verses.find(v => v.v === verse) ?? null;
  }, [getChapter]);

  const setTranslation = useCallback(async (id: TranslationId) => {
    setTranslationId(id);
    const s = await getSettings();
    const { updateSettings } = await import('../db/db');
    await updateSettings({ translationId: id });
    void s;
  }, []);

  return (
    <Ctx.Provider value={{ translationId, setTranslation, loadBook, getChapter, getVerse }}>
      {children}
    </Ctx.Provider>
  );
}

export function useScripture(): ScriptureCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useScripture must be used within ScriptureProvider');
  return v;
}
