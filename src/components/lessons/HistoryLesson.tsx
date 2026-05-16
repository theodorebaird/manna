import { useState } from 'react';
import historyCards from '../../data/history-cards.json';
import type { QuizQuestion } from '../../lib/quiz';
import QuizLesson from './QuizLesson';

interface Props {
  cardId: string;
  checkQuestion: QuizQuestion;
  onDone: (result: { passed: boolean; score: number; xp: number }) => void;
}

interface HistoryCard {
  id: string;
  title: string;
  refs: string[];
  body: string;
  sources?: string[];
}

export default function HistoryLesson({ cardId, checkQuestion, onDone }: Props) {
  const card = (historyCards as HistoryCard[]).find(c => c.id === cardId);
  const [phase, setPhase] = useState<'read' | 'check'>('read');

  if (!card) return <div className="text-rose-500">Missing card: {cardId}</div>;

  if (phase === 'check') {
    return <QuizLesson questions={[checkQuestion]} onDone={onDone} />;
  }

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

      <button onClick={() => setPhase('check')} className="btn-primary w-full">
        I've read it — quick check
      </button>
    </div>
  );
}
