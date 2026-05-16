import { useEffect, useState } from 'react';
import { getCurriculum, computeUnlocks, getCompletedLessonIds, type Unit } from '../lib/lessons';
import SkillNode from '../components/SkillNode';

interface UnlockSnapshot {
  unitsUnlocked: Set<string>;
  skillsUnlocked: Set<string>;
  nextLessonId: string | null;
}

export default function Learn() {
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

  if (!unlocks) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="page-title">Learn</h1>
        <p className="text-sm text-ink-600 dark:text-ink-300">Walk through scripture one skill at a time.</p>
      </header>

      {curriculum.units.map(unit => {
        const unlocked = unlocks.unitsUnlocked.has(unit.id);
        return <UnitSection key={unit.id} unit={unit} unlocked={unlocked} unlocks={unlocks} completed={completed} />;
      })}
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
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 px-2">
        {unit.skills.map((skill, idx) => {
          const isUnlocked = unlocks.skillsUnlocked.has(skill.id);
          const allDone = skill.lessons.every(l => completed.has(l.id));
          const state: 'locked' | 'active' | 'done' = !isUnlocked ? 'locked' : allDone ? 'done' : 'active';
          const next = skill.lessons.find(l => !completed.has(l.id))?.id ?? null;
          const progressCount = skill.lessons.filter(l => completed.has(l.id)).length;
          const offset = idx % 4;
          return (
            <div key={skill.id} style={{ transform: `translateX(${(offset - 1.5) * 18}px)` }}>
              <SkillNode skill={skill} state={state} progressCount={progressCount} nextLessonId={next} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
