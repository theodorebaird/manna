import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, CalendarDays, BookOpen, CheckCircle2 } from 'lucide-react';
import { getCurriculum, computeUnlocks, getCompletedLessonIds, type Unit } from '../lib/lessons';
import SkillNode from '../components/SkillNode';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import plansData from '../data/reading-plans.json';

interface ReadingPlan {
  id: string;
  title: string;
  summary: string;
  days: { day: number; readings: string[] }[];
}

const PLANS = plansData as ReadingPlan[];

type Mode = 'path' | 'plans';

interface UnlockSnapshot {
  unitsUnlocked: Set<string>;
  skillsUnlocked: Set<string>;
  nextLessonId: string | null;
}

export default function Learn() {
  const [mode, setMode] = useState<Mode>('path');
  const [unlocks, setUnlocks] = useState<UnlockSnapshot | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const curriculum = getCurriculum();

  useEffect(() => {
    (async () => {
      const u = await computeUnlocks();
      setUnlocks({
        unitsUnlocked: u.unitsUnlocked,
        skillsUnlocked: u.skillsUnlocked,
        nextLessonId: u.nextLessonId
      });
      setCompleted(await getCompletedLessonIds());
    })();
  }, []);

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      <header>
        <h1 className="page-title">Learn</h1>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          {mode === 'path' ? 'Walk the story of scripture one skill at a time.' : 'Read through scripture on a structured schedule.'}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-ink-100/70 dark:bg-ink-800/70 border border-gold-100 dark:border-ink-700">
        <button
          onClick={() => setMode('path')}
          className={`py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
            mode === 'path' ? 'bg-white dark:bg-ink-700 text-gold-700 dark:text-gold-300 shadow-soft' : 'text-ink-600 dark:text-ink-300'
          }`}
        >
          <GitBranch size={16} /> Skill tree
        </button>
        <button
          onClick={() => setMode('plans')}
          className={`py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
            mode === 'plans' ? 'bg-white dark:bg-ink-700 text-gold-700 dark:text-gold-300 shadow-soft' : 'text-ink-600 dark:text-ink-300'
          }`}
        >
          <CalendarDays size={16} /> Reading plans
        </button>
      </div>

      {mode === 'path' && (
        unlocks ? (
          <>
            {curriculum.units.map(unit => {
              const unlocked = unlocks.unitsUnlocked.has(unit.id);
              return <UnitSection key={unit.id} unit={unit} unlocked={unlocked} unlocks={unlocks} completed={completed} />;
            })}
          </>
        ) : (
          <div className="card text-center text-ink-500 py-8">Loading…</div>
        )
      )}

      {mode === 'plans' && <PlansList />}
    </div>
  );
}

function UnitSection({ unit, unlocked, unlocks, completed }: {
  unit: Unit;
  unlocked: boolean;
  unlocks: UnlockSnapshot;
  completed: Set<string>;
}) {
  return (
    <section className="space-y-4">
      <div className={`card ${!unlocked ? 'opacity-60' : ''}`}>
        <div className="section-label">{unit.subtitle}</div>
        <h2 className="font-serif text-2xl text-gold-700 dark:text-gold-300">{unit.title}</h2>
      </div>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-5 px-2">
        {unit.skills.map(skill => {
          const isUnlocked = unlocks.skillsUnlocked.has(skill.id);
          const allDone = skill.lessons.every(l => completed.has(l.id));
          const state: 'locked' | 'active' | 'done' = !isUnlocked ? 'locked' : allDone ? 'done' : 'active';
          const next = skill.lessons.find(l => !completed.has(l.id))?.id ?? null;
          const progressCount = skill.lessons.filter(l => completed.has(l.id)).length;
          return (
            <div key={skill.id}>
              <SkillNode skill={skill} state={state} progressCount={progressCount} nextLessonId={next} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PlansList() {
  const planProgress = useLiveQuery(() => db.planProgress.toArray(), [], []);

  return (
    <div className="space-y-3">
      {PLANS.map(plan => {
        const done = (planProgress ?? []).filter(p => p.planId === plan.id).length;
        const total = plan.days.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return (
          <Link key={plan.id} to={`/plan/${plan.id}`} className="block card space-y-2 hover:shadow-glow transition">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-serif text-lg text-gold-700 dark:text-gold-300">{plan.title}</h3>
                <p className="text-sm text-ink-600 dark:text-ink-300">{plan.summary}</p>
              </div>
              <div className="text-right text-xs text-ink-500 dark:text-ink-300/70 whitespace-nowrap">
                {done > 0 ? <><CheckCircle2 size={12} className="inline mr-1 text-gold-600" />{done}/{total}</> : `${total} days`}
              </div>
            </div>
            {done > 0 && (
              <div className="h-1.5 rounded-full bg-ink-100 dark:bg-ink-700 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gold-400 to-gold-600" style={{ width: `${pct}%` }} />
              </div>
            )}
          </Link>
        );
      })}
      <div className="card-tight text-xs text-ink-500 dark:text-ink-300/70 italic flex items-center gap-2">
        <BookOpen size={14} className="text-gold-600 dark:text-gold-400" />
        More plans coming soon. Want one in particular? Let us know.
      </div>
    </div>
  );
}
