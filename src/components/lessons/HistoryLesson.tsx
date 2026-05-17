import historyCards from '../../data/history-cards.json';
import type { QuizQuestion } from '../../lib/quiz';

interface Props {
  cardId: string;
  // Kept in the type for compatibility with existing lessons.json data, but
  // no longer used — the comprehension check was removed so Learn stays static.
  checkQuestion?: QuizQuestion;
  onDone: (result: { passed: boolean; score: number; xp: number }) => void;
}

interface HistoryCard {
  id: string;
  title: string;
  refs: string[];
  body: string;
  sources?: string[];
}

export default function HistoryLesson({ cardId, onDone }: Props) {
  const card = (historyCards as HistoryCard[]).find(c => c.id === cardId);

  if (!card) return <div className="text-rose-500">Missing card: {cardId}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="section-label">Historical context</div>
        <h2 className="font-serif text-2xl text-gold-700 dark:text-gold-300">{card.title}</h2>
        <div className="text-xs text-ink-500 dark:text-ink-300/70 mt-1">{card.refs.join(' · ')}</div>
      </div>

      <div className="card">
        <p className="text-ink-800 dark:text-ink-100 leading-relaxed whitespace-pre-wrap">{card.body}</p>
        {card.sources && card.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gold-100 dark:border-ink-700 text-xs text-ink-500 dark:text-ink-400">
            Sources: {card.sources.join(' · ')}
          </div>
        )}
      </div>

      <button
        onClick={() => onDone({ passed: true, score: 100, xp: 10 })}
        className="btn-primary w-full"
      >
        Mark complete (+10 XP)
      </button>
    </div>
  );
}
