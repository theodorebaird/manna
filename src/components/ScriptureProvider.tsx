import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { BookData, Verse } from '../lib/bible';

interface ScriptureCtx {
  loadBook: (bookId: string) => Promise<BookData>;
  getChapter: (bookId: string, chapter: number) => Promise<Verse[]>;
  getVerse: (bookId: string, chapter: number, verse: number) => Promise<Verse | null>;
  loaded: Set<string>;
}

const Ctx = createContext<ScriptureCtx | null>(null);

export function ScriptureProvider({ children }: { children: ReactNode }) {
  const cache = useRef<Map<string, BookData>>(new Map());
  const inFlight = useRef<Map<string, Promise<BookData>>>(new Map());
  const [loaded, setLoaded] = useState<Set<string>>(new Set());

  const loadBook = useCallback(async (bookId: string): Promise<BookData> => {
    if (cache.current.has(bookId)) return cache.current.get(bookId)!;
    if (inFlight.current.has(bookId)) return inFlight.current.get(bookId)!;
    const p = (async () => {
      const mod = await import(/* @vite-ignore */ `../data/bible/kjv/${bookId}.json`);
      const data = (mod.default ?? mod) as BookData;
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
