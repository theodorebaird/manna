import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type PlanProgress } from '../db/db';
import plansData from '../data/reading-plans.json';

interface ReadingPlan {
  id: string;
  title: string;
  summary: string;
  days: { day: number; readings: string[] }[];
}

const PLANS = plansData as ReadingPlan[];

function refToReadUrl(ref: string): string {
  const slug = ref.toLowerCase().replace(/^(\d)\s+/, '$1-').replace(/\s+\d+(?::\d+)?(-\d+)?$/, '').replace(/\s+/g, '-');
  const chapter = ref.match(/\s(\d+)(?::|$)/)?.[1] ?? '1';
  return `/read/${slug}/${chapter}`;
}

export default function Plan() {
  const { id } = useParams<{ id: string }>();
  const plan = PLANS.find(p => p.id === id);
  const progress = useLiveQuery(
    () => id ? db.planProgress.where('planId').equals(id).toArray() : Promise.resolve([] as PlanProgress[]),
    [id]
  ) as PlanProgress[] | undefined;
  const completedDays = new Set((progress ?? []).map(p => p.day));
  const [openDay, setOpenDay] = useState<number | null>(null);

  if (!plan) {
    return (
      <div className="card text-center space-y-3">
        <div className="text-rose-500">Plan not found.</div>
        <Link to="/learn" className="btn-primary">Back to Learn</Link>
      </div>
    );
  }

  const toggleDay = async (day: number) => {
    if (completedDays.has(day)) {
      const entry = (progress ?? []).find(p => p.day === day);
      if (entry?.id) await db.planProgress.delete(entry.id);
    } else {
      await db.planProgress.add({ planId: plan.id, day, completedAt: Date.now() });
    }
  };

  const done = completedDays.size;
  const total = plan.days.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const todayIdx = plan.days.findIndex(d => !completedDays.has(d.day));
  const nextDay = todayIdx >= 0 ? plan.days[todayIdx] : null;

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <header className="flex items-center justify-between">
        <Link to="/learn" className="btn-ghost"><ArrowLeft size={18} /> Plans</Link>
      </header>

      <div>
        <h1 className="page-title">{plan.title}</h1>
        <p className="text-sm text-ink-600 dark:text-ink-300">{plan.summary}</p>
      </div>

      <div className="card space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-600 dark:text-ink-300">Progress</span>
          <span className="text-gold-700 dark:text-gold-400 font-medium">{done} / {total} days · {pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-ink-100 dark:bg-ink-700 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        {nextDay && (
          <div className="text-xs text-ink-500 dark:text-ink-300/70 italic">
            Next: Day {nextDay.day} — {nextDay.readings.join(', ')}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {plan.days.map(d => {
          const isDone = completedDays.has(d.day);
          const isOpen = openDay === d.day;
          return (
            <div key={d.day} className={`card-tight ${isDone ? 'bg-gold-50/60 dark:bg-ink-700/40' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => toggleDay(d.day)}
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition ${
                    isDone ? 'text-gold-600 dark:text-gold-400' : 'text-ink-400'
                  }`}
                  title={isDone ? 'Mark not done' : 'Mark done'}
                >
                  {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>
                <button
                  onClick={() => setOpenDay(isOpen ? null : d.day)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="text-xs font-semibold text-ink-500 dark:text-ink-300/70">Day {d.day}</div>
                  <div className={`text-sm font-medium truncate ${isDone ? 'text-ink-600 dark:text-ink-300' : 'text-ink-800 dark:text-ink-100'}`}>
                    {d.readings.join(' · ')}
                  </div>
                </button>
                <ChevronRight size={16} className={`text-ink-400 transition ${isOpen ? 'rotate-90' : ''}`} />
              </div>
              {isOpen && (
                <div className="mt-3 pt-3 border-t border-gold-100 dark:border-ink-700 space-y-1.5">
                  {d.readings.map(r => (
                    <Link
                      key={r}
                      to={refToReadUrl(r)}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-ink-800 border border-gold-100 dark:border-ink-700 text-sm hover:bg-gold-50 dark:hover:bg-ink-700 transition"
                    >
                      <span className="text-ink-800 dark:text-ink-100 font-medium">{r}</span>
                      <ChevronRight size={14} className="text-gold-600 dark:text-gold-400" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
