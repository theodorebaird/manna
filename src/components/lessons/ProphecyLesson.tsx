import { useState } from 'react';
import { ArrowDown, CheckCircle2 } from 'lucide-react';
import prophecyCards from '../../data/prophecy-cards.json';

interface Props {
  cardId: string;
  onDone: (xp: number) => void;
}

interface ProphecyCard {
  id: string;
  title: string;
  prediction: { ref: string; text: string };
  fulfillment: { ref: string; text: string };
  notes: string;
}

export default function ProphecyLesson({ cardId, onDone }: Props) {
  const card = (prophecyCards as ProphecyCard[]).find(c => c.id === cardId);
  const [revealed, setRevealed] = useState(false);

  if (!card) return <div className="text-rose-500">Missing prophecy: {cardId}</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="section-label">Prophecy → Fulfillment</div>
        <h2 className="font-serif text-2xl text-gold-700 dark:text-gold-300">{card.title}</h2>
      </div>

      <div className="card space-y-3 border-l-4 border-gold-400">
        <div className="text-xs uppercase tracking-wide font-semibold text-gold-700 dark:text-gold-400">Prediction</div>
        <p className="verse-text italic">{card.prediction.text}</p>
        <div className="text-sm text-ink-600 dark:text-ink-300 font-medium">— {card.prediction.ref}</div>
      </div>

      <div className="flex justify-center">
        <ArrowDown className="text-gold-500" size={28} />
      </div>

      {!revealed ? (
        <button onClick={() => setRevealed(true)} className="btn-primary w-full">
          Reveal fulfillment
        </button>
      ) : (
        <>
          <div className="card space-y-3 border-l-4 border-emerald-400 animate-slide-up">
            <div className="text-xs uppercase tracking-wide font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={14} /> Fulfilled
            </div>
            <p className="verse-text italic">{card.fulfillment.text}</p>
            <div className="text-sm text-ink-600 dark:text-ink-300 font-medium">— {card.fulfillment.ref}</div>
          </div>
          {card.notes && (
            <div className="card text-sm text-ink-700 dark:text-ink-200 leading-relaxed">{card.notes}</div>
          )}
          <button onClick={() => onDone(15)} className="btn-primary w-full">
            Mark complete (+15 XP)
          </button>
        </>
      )}
    </div>
  );
}
