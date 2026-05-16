import { Heart } from 'lucide-react';
import { HEART_MAX } from '../db/db';

export default function HeartsIndicator({ hearts }: { hearts: number }) {
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: HEART_MAX }, (_, i) => {
        const filled = i < hearts;
        return (
          <Heart
            key={i}
            size={16}
            className={filled ? 'text-rose-500 fill-rose-500' : 'text-ink-300 dark:text-ink-600'}
          />
        );
      })}
    </div>
  );
}
