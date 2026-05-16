interface Props {
  current: number;
  goal: number;
}

export default function XPBar({ current, goal }: Props) {
  const pct = Math.min(100, Math.round((current / Math.max(1, goal)) * 100));
  const met = current >= goal;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-medium text-ink-600 dark:text-ink-300 mb-1">
        <span>Daily goal</span>
        <span>{current} / {goal} XP{met && ' ✓'}</span>
      </div>
      <div className="h-2.5 rounded-full bg-ink-100 dark:bg-ink-700 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
