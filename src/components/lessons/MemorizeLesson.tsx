import { useMemo, useState } from 'react';
import { maskByStage } from '../../lib/srs';

interface Props {
  ref: string;
  text: string;
  onDone: (xp: number) => void;
}

const STAGE_LABEL = {
  1: 'Read along',
  2: 'Fill the blanks (every 3rd word)',
  3: 'Fill the blanks (every other word)',
  4: 'Recall the whole verse'
} as const;

export default function MemorizeLesson({ ref, text, onDone }: Props) {
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);
  const [attempt, setAttempt] = useState('');
  const [revealed, setRevealed] = useState(false);
  const masked = useMemo(() => maskByStage(text, stage), [text, stage]);

  const next = () => {
    if (stage < 4) {
      setStage(((stage + 1) as 1 | 2 | 3 | 4));
      setAttempt('');
      setRevealed(false);
    } else {
      onDone(15);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <div className="section-label">Memorize · {STAGE_LABEL[stage]}</div>
        <h2 className="font-serif text-2xl text-gold-700 dark:text-gold-300">{ref}</h2>
      </div>

      <div className="card space-y-3">
        <div className="verse-text italic whitespace-pre-wrap">{revealed ? text : masked}</div>
        {stage > 1 && (
          <button onClick={() => setRevealed(r => !r)} className="text-sm text-gold-700 dark:text-gold-400 font-medium">
            {revealed ? 'Hide answer' : 'Show answer'}
          </button>
        )}
      </div>

      {stage === 4 && (
        <div className="card space-y-2">
          <div className="section-label">Type the verse from memory</div>
          <textarea
            value={attempt}
            onChange={e => setAttempt(e.target.value)}
            rows={4}
            placeholder="Recall the verse…"
            className="input resize-none"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-ink-100 dark:bg-ink-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all"
            style={{ width: `${(stage / 4) * 100}%` }}
          />
        </div>
        <button onClick={next} className="btn-primary">
          {stage < 4 ? 'Next stage' : 'Finish (+15 XP)'}
        </button>
      </div>
    </div>
  );
}
