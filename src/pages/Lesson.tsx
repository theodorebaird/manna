import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, ArrowRight, RotateCcw } from 'lucide-react';
import { getLesson, computeUnlocks } from '../lib/lessons';
import LessonRunner from '../components/LessonRunner';
import { db, getSettings, type Settings } from '../db/db';
import { recordLesson } from '../lib/xp';
import HeartsIndicator from '../components/HeartsIndicator';

type Outcome = { passed: boolean; score: number; xp: number };

export default function Lesson() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);

  useEffect(() => {
    (async () => setSettings(await getSettings()))();
  }, []);

  // Reset per-lesson state whenever the URL id changes — otherwise React Router
  // reuses this component instance and the previous lesson's Results screen
  // remains visible when the user clicks "Next lesson".
  useEffect(() => {
    setOutcome(null);
    setNextLessonId(null);
  }, [id]);

  // If no id in URL, navigate back to Learn (in an effect — never during render)
  useEffect(() => {
    if (!id) navigate('/learn', { replace: true });
  }, [id, navigate]);

  if (!id) return null;
  const found = getLesson(id);
  if (!found) {
    return (
      <div className="card text-center space-y-3">
        <div className="text-rose-500">Lesson not found.</div>
        <Link to="/learn" className="btn-primary">Back to Learn</Link>
      </div>
    );
  }
  const { lesson, skill, unit } = found;

  const complete = async (r: Outcome) => {
    if (r.passed) {
      await db.progress.add({
        lessonId: lesson.id,
        unitId: unit.id,
        skillId: skill.id,
        completedAt: Date.now(),
        score: r.score,
        xpEarned: r.xp
      });
      await recordLesson(r.xp, 3);
      const un = await computeUnlocks();
      setNextLessonId(un.nextLessonId);
    }
    setOutcome(r);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-2">
        <button onClick={() => navigate('/learn')} className="btn-ghost text-sm">
          <ArrowLeft size={16} /> Learn
        </button>
        <div className="text-xs font-medium text-ink-600 dark:text-ink-300 text-right truncate flex-1">
          {unit.title} · {skill.title}
        </div>
        <HeartsIndicator hearts={settings?.hearts ?? 0} />
      </header>

      {!outcome ? (
        <LessonRunner key={lesson.id} lesson={lesson} onComplete={complete} />
      ) : (
        <Results outcome={outcome} nextLessonId={nextLessonId} onRetry={() => setOutcome(null)} />
      )}
    </div>
  );
}

function Results({ outcome, nextLessonId, onRetry }: {
  outcome: Outcome;
  nextLessonId: string | null;
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="card space-y-4 text-center animate-fade-in">
      <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
        outcome.passed
          ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-glow'
          : 'bg-rose-100 dark:bg-rose-900/40 text-rose-500'
      }`}>
        <Trophy size={36} />
      </div>
      <h2 className="font-serif text-2xl text-gold-700 dark:text-gold-300">
        {outcome.passed ? 'Well done!' : 'Keep going'}
      </h2>
      <div className="text-sm text-ink-600 dark:text-ink-300">
        Score: <strong>{outcome.score}%</strong> · XP: <strong>+{outcome.xp}</strong>
      </div>
      <div className="flex flex-col gap-2 pt-2">
        {outcome.passed && nextLessonId ? (
          <button onClick={() => navigate(`/lesson/${nextLessonId}`)} className="btn-primary">
            Next lesson <ArrowRight size={18} />
          </button>
        ) : (
          <button onClick={() => navigate('/learn')} className="btn-primary">
            Back to Learn
          </button>
        )}
        {!outcome.passed && (
          <button onClick={onRetry} className="btn-outline">
            <RotateCcw size={16} /> Try again
          </button>
        )}
      </div>
    </div>
  );
}
