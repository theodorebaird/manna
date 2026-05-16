import type { Verse } from '../lib/bible';

interface Props {
  verses: Verse[];
  highlightVerse?: number;
  onVerseClick?: (v: Verse) => void;
  fontSize?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl'
};

export default function VerseList({ verses, highlightVerse, onVerseClick, fontSize = 'md' }: Props) {
  if (verses.length === 0) {
    return <div className="text-center text-ink-500 dark:text-ink-300/70 py-8">Loading scripture…</div>;
  }
  return (
    <div className={`font-serif leading-relaxed text-ink-800 dark:text-ink-100 ${sizeMap[fontSize]}`}>
      {verses.map(v => {
        const isHL = highlightVerse === v.v;
        return (
          <span
            key={v.v}
            id={`v${v.v}`}
            onClick={() => onVerseClick?.(v)}
            className={`inline cursor-pointer transition rounded px-0.5 ${
              isHL
                ? 'bg-gold-200/70 dark:bg-gold-700/40'
                : 'hover:bg-gold-100/60 dark:hover:bg-ink-700/60'
            }`}
          >
            <sup className="text-xs font-sans font-semibold text-gold-600 dark:text-gold-400 mr-1 select-none">{v.v}</sup>
            {v.t}{' '}
          </span>
        );
      })}
    </div>
  );
}
