import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Brain, ChevronRight, Sparkles, HelpCircle } from 'lucide-react';
import { regenerateHearts, type Settings } from '../db/db';
import { getStreak, getTodayStats, getLast7Days } from '../lib/xp';
import { computeUnlocks } from '../lib/lessons';
import StreakBadge from '../components/StreakBadge';
import XPBar from '../components/XPBar';
import HeartsIndicator from '../components/HeartsIndicator';

const VERSE_OF_DAY = {
  ref: 'Lamentations 3:22-23',
  text: 'It is of the LORD’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.'
};

export default function Home() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [streak, setStreak] = useState(0);
  const [todayXP, setTodayXP] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [week, setWeek] = useState<{ date: string; xp: number }[]>([]);

  useEffect(() => {
    (async () => {
      const s = await regenerateHearts();
      setSettings(s);
      setStreak(await getStreak());
      const t = await getTodayStats();
      setTodayXP(t.xp);
      const un = await computeUnlocks();
      setNext(un.nextLessonId);
      const w = await getLast7Days();
      setWeek(w);
    })();
  }, []);

  if (!settings) return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const maxWeekXp = Math.max(10, ...week.map(w => w.xp));

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-sm text-ink-500 dark:text-ink-300/70">{greeting}{settings.userName && `, ${settings.userName}`}</div>
          <h1 className="font-serif text-3xl font-semibold text-gold-700 dark:text-gold-300">Manna</h1>
        </div>
        <div className="flex items-center gap-2">
          <StreakBadge count={streak} />
          <Link
            to="/how-to"
            aria-label="How to use Manna"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gold-700 dark:text-gold-300 bg-white/70 dark:bg-ink-800/70 border border-gold-200 dark:border-ink-700 hover:bg-gold-100 dark:hover:bg-ink-700 transition"
          >
            <HelpCircle size={18} />
          </Link>
        </div>
      </header>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <span className="section-label">Today</span>
          <HeartsIndicator hearts={settings.hearts} />
        </div>
        <XPBar current={todayXP} goal={settings.dailyXpGoal} />
        {next ? (
          <Link to={`/lesson/${next}`} className="btn-primary w-full">
            <Sparkles size={18} />
            Continue learning
            <ChevronRight size={18} />
          </Link>
        ) : (
          <Link to="/learn" className="btn-primary w-full">
            <GraduationCap size={18} />
            Open the skill tree
          </Link>
        )}
      </div>

      <div className="card space-y-2">
        <div className="section-label">Verse of the day</div>
        <p className="verse-text italic">{VERSE_OF_DAY.text}</p>
        <div className="text-sm text-gold-700 dark:text-gold-400 font-medium">— {VERSE_OF_DAY.ref}</div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link to="/read" className="card-tight flex flex-col items-center text-center gap-1 hover:shadow-glow transition">
          <BookOpen className="text-gold-600 dark:text-gold-400" size={22} />
          <div className="text-xs font-semibold text-ink-700 dark:text-ink-100">Read</div>
        </Link>
        <Link to="/learn" className="card-tight flex flex-col items-center text-center gap-1 hover:shadow-glow transition">
          <GraduationCap className="text-gold-600 dark:text-gold-400" size={22} />
          <div className="text-xs font-semibold text-ink-700 dark:text-ink-100">Learn</div>
        </Link>
        <Link to="/memorize" className="card-tight flex flex-col items-center text-center gap-1 hover:shadow-glow transition">
          <Brain className="text-gold-600 dark:text-gold-400" size={22} />
          <div className="text-xs font-semibold text-ink-700 dark:text-ink-100">Memorize</div>
        </Link>
      </div>

      <div className="card">
        <div className="section-label mb-3">This week</div>
        <div className="flex items-end justify-between gap-1.5 h-24">
          {week.map(d => {
            const h = Math.round((d.xp / maxWeekXp) * 100);
            const day = new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })[0];
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-gold-500 to-gold-300 dark:from-gold-700 dark:to-gold-500"
                    style={{ height: `${Math.max(6, h)}%` }}
                  />
                </div>
                <div className="text-[10px] text-ink-500 dark:text-ink-400">{day}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
