import { useEffect, useMemo, useState } from 'react';
import { useScripture } from '../ScriptureProvider';
import { parseRef, type Verse } from '../../lib/bible';
import VerseList from '../VerseList';

interface Props {
  verseRef: string;
  reflectPrompt: string;
  historicalContext?: HistoricalContext;
  onDone: (xp: number) => void;
}

export interface HistoricalContext {
  timeframe?: string;        // e.g. "~1450 BC"
  location?: string;         // e.g. "Wilderness of Sinai"
  summary: string;           // verified historical context (paragraph)
  believed?: string;         // optional: "what most historians believe" (less-than-certain)
  sources?: string[];
}

export default function ReadLesson({ verseRef, reflectPrompt, historicalContext, onDone }: Props) {
  const { getChapter } = useScripture();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [reflection, setReflection] = useState('');

  // Memoize parseRef so the useEffect doesn't re-fire on every render
  // (parseRef returns a new object each call, which would loop forever).
  const parsed = useMemo(() => parseRef(verseRef), [verseRef]);

  useEffect(() => {
    if (!parsed) return;
    let cancelled = false;
    (async () => {
      const all = await getChapter(parsed.book.id, parsed.chapter);
      if (cancelled) return;
      const slice = all.filter(v => v.v >= parsed.verseStart && v.v <= parsed.verseEnd);
      setVerses(slice);
    })();
    return () => { cancelled = true; };
  }, [parsed, getChapter]);

  if (!parsed) return <div className="text-rose-500">Bad reference: {verseRef}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="section-label">Read</div>
        <h2 className="font-serif text-2xl text-gold-700 dark:text-gold-300">{verseRef}</h2>
      </div>

      {historicalContext && (
        <div className="card space-y-3 border-l-4 border-gold-400">
          <div className="section-label flex items-center gap-1.5">📜 Historical Context</div>
          {(historicalContext.timeframe || historicalContext.location) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {historicalContext.timeframe && (
                <span className="px-2 py-1 rounded-full bg-gold-100 dark:bg-ink-700 text-gold-800 dark:text-gold-300 font-medium">
                  🕰 {historicalContext.timeframe}
                </span>
              )}
              {historicalContext.location && (
                <span className="px-2 py-1 rounded-full bg-gold-100 dark:bg-ink-700 text-gold-800 dark:text-gold-300 font-medium">
                  📍 {historicalContext.location}
                </span>
              )}
            </div>
          )}
          <p className="text-sm text-ink-800 dark:text-ink-100 leading-relaxed whitespace-pre-wrap">
            {historicalContext.summary}
          </p>
          {historicalContext.believed && (
            <div className="text-xs text-ink-600 dark:text-ink-300 italic border-l-2 border-ink-300 dark:border-ink-600 pl-3">
              <strong className="not-italic">What historians believe:</strong> {historicalContext.believed}
            </div>
          )}
          {historicalContext.sources && historicalContext.sources.length > 0 && (
            <div className="text-[11px] text-ink-500 dark:text-ink-300/70 pt-2 border-t border-gold-100 dark:border-ink-700">
              Sources: {historicalContext.sources.join(' · ')}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <VerseList verses={verses} fontSize="md" />
      </div>
      <div className="card space-y-2">
        <div className="section-label">Reflect</div>
        <p className="text-ink-700 dark:text-ink-200">{reflectPrompt}</p>
        <textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          rows={4}
          placeholder="Type a few thoughts (just for you)…"
          className="input resize-none"
        />
      </div>
      <button onClick={() => onDone(10)} className="btn-primary w-full">
        Mark complete (+10 XP)
      </button>
    </div>
  );
}
