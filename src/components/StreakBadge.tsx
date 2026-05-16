import { Flame } from 'lucide-react';

export default function StreakBadge({ count }: { count: number }) {
  const active = count > 0;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm border ${
      active
        ? 'bg-gradient-to-r from-orange-400 to-gold-500 text-white border-transparent shadow-soft'
        : 'bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-300 border-ink-200 dark:border-ink-700'
    }`}>
      <Flame size={16} strokeWidth={2.25} className={active ? 'fill-white/40' : ''} />
      <span>{count}</span>
    </div>
  );
}
