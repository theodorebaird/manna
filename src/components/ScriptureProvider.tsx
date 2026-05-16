import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { BookData, Verse } from '../lib/bible';

interface ScriptureCtx {
  loadBook: (bookId: string) => Promise<BookData>;
  getChapter: (bookId: string, chapter: number) => Promise<Verse[]>;
  getVerse: (bookId: string, chapter: number, verse: number) => Promise<Verse | null>;
  loaded: Set<string>;
}

const Ctx = createContext<ScriptureCtx | null>(null);

// Eager-known loader map — Vite analyzes this at build time and code-splits each
// book into its own chunk that lazy-loads on first request.
const bookLoaders = import.meta.glob<{ default: BookData }>('../data/bible/kjv/*.json');

export function ScriptureProvider({ children }: { children: ReactNode }) {
  const cache = useRef<Map<string, BookData>>(new Map());
  const inFlight = useRef<Map<string, Promise<BookData>>>(new Map());
  const [loaded, setLoaded] = useState<Set<string>>(new Set());

  const loadBook = useCallback(async (bookId: string): Promise<BookData> => {
    if (cache.current.has(bookId)) return cache.current.get(bookId)!;
    if (inFlight.current.has(bookId)) return inFlight.current.get(bookId)!;
    const path = `../data/bible/kjv/${bookId}.json`;
    const loader = bookLoaders[path];
    if (!loader) throw new Error(`Bible book not found: ${bookId}`);
    const p = (async () => {
      const mod = await loader();
      const data = (mod.default ?? (mod as unknown as BookData)) as BookData;
      cache.current.set(bookId, data);
      setLoaded(prev => {
        const next = new Set(prev);
        next.add(bookId);
        return next;
      });
      inFlight.current.delete(bookId);
      return data;
    })();
    inFlight.current.set(bookId, p);
    return p;
  }, []);

  const getChapter = useCallback(async (bookId: string, chapter: number): Promise<Verse[]> => {
    const book = await loadBook(bookId);
    return book.chapters[chapter - 1] ?? [];
  }, [loadBook]);

  const getVerse = useCallback(async (bookId: string, chapter: number, verse: number): Promise<Verse | null> => {
    const verses = await getChapter(bookId, chapter);
    return verses.find(v => v.v === verse) ?? null;
  }, [getChapter]);

  return (
    <Ctx.Provider value={{ loadBook, getChapter, getVerse, loaded }}>
      {children}
    </Ctx.Provider>
  );
}

export function useScripture(): ScriptureCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useScripture must be used within ScriptureProvider');
  return v;
}
