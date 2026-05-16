import { Link } from 'react-router-dom';
import { Lock, Check, Star, Sun, Mountain, Crown, Scroll, Cross, Sparkles, Anchor, Flame, Compass } from 'lucide-react';
import type { Skill } from '../lib/lessons';

const ICONS: Record<string, typeof Sun> = {
  sun: Sun,
  mountain: Mountain,
  crown: Crown,
  scroll: Scroll,
  cross: Cross,
  sparkles: Sparkles,
  anchor: Anchor,
  flame: Flame,
  compass: Compass,
  star: Star
};

interface Props {
  skill: Skill;
  state: 'locked' | 'active' | 'done';
  progressCount: number;        // lessons completed in this skill
  nextLessonId: string | null;  // for "active" — the next lesson to attempt
}

export default function SkillNode({ skill, state, progressCount, nextLessonId }: Props) {
  const Icon = ICONS[skill.icon] ?? Star;
  const total = skill.lessons.length;
  const ratio = total > 0 ? progressCount / total : 0;
  const circumference = 2 * Math.PI * 36;
  const dash = circumference * ratio;

  const content = (
    <div className={`relative flex flex-col items-center gap-2 transition ${state === 'locked' ? 'opacity-50' : ''}`}>
      <div className="relative w-20 h-20">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" className="text-ink-200 dark:text-ink-700" fill="none" />
          {state !== 'locked' && (
            <circle
              cx="40" cy="40" r="36"
              stroke="currentColor"
              strokeWidth="4"
              className="text-gold-500"
              fill="none"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className={`absolute inset-2 rounded-full flex items-center justify-center transition shadow-soft ${
          state === 'done'
            ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-white'
            : state === 'active'
            ? 'bg-white dark:bg-ink-800 text-gold-600 dark:text-gold-400 ring-2 ring-gold-400 animate-pop'
            : 'bg-ink-100 dark:bg-ink-800 text-ink-400 dark:text-ink-500'
        }`}>
          {state === 'locked' ? <Lock size={26} /> : state === 'done' ? <Check size={28} /> : <Icon size={28} />}
        </div>
      </div>
      <div className="text-xs font-medium text-center max-w-[6.5rem] text-ink-700 dark:text-ink-200">{skill.title}</div>
    </div>
  );

  if (state === 'locked' || !nextLessonId) return <div>{content}</div>;
  return <Link to={`/lesson/${nextLessonId}`} className="block">{content}</Link>;
}
