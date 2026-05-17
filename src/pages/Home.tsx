import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Brain, ChevronRight, Sparkles, HelpCircle,
  Cross, Heart, Library, Bookmark, RefreshCw, CheckCircle2
} from 'lucide-react';
import { regenerateHearts, type Settings } from '../db/db';
import { getStreak } from '../lib/xp';
import { computeUnlocks, getFirstLessonId } from '../lib/lessons';
import StreakBadge from '../components/StreakBadge';
import topicsData from '../data/topics.json';

const VERSE_OF_DAY = {
  ref: 'Lamentations 3:22-23',
  text: 'It is of the LORD’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.'
};

interface Topic { id: string; title: string; color: string }

const QUICK_TOPICS: Topic[] = (topicsData as Topic[]).slice(0, 6);

const COLOR_TINT: Record<string, string> = {
  sky:     'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  amber:   'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  indigo:  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  rose:    'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  red:     'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  slate:   'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200',
  violet:  'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  stone:   'bg-stone-100 text-stone-800 dark:bg-stone-900/40 dark:text-stone-200',
  gold:    'bg-gold-100 text-gold-800 dark:bg-ink-700 dark:text-gold-200'
};

export default function Home() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [streak, setStreak] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await regenerateHearts();
      setSettings(s);
      setStreak(await getStreak());
      const un = await computeUnlocks();
      // Fall back to the first lesson of the curriculum if nothing has been
      // started, so "Continue learning" always has somewhere to go.
      setNext(un.nextLessonId ?? getFirstLessonId());
    })();
    const handler = () => setUpdateAvailable(true);
    window.addEventListener('manna:update-available', handler);

    // Check for post-update flag set by main.tsx before the reload
    try {
      if (sessionStorage.getItem('manna_just_updated') === '1') {
        sessionStorage.removeItem('manna_just_updated');
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 5000);
      }
    } catch {}

    return () => window.removeEventListener('manna:update-available', handler);
  }, []);

  const installUpdate = async () => {
    const fn = (window as unknown as { __mannaUpdate?: () => Promise<'updated' | 'up-to-date' | 'error'> }).__mannaUpdate;
    if (!fn) { location.reload(); return; }
    const result = await fn();
    // If updated, page is reloading. Otherwise the banner already shouldn't have been showing — dismiss it.
    if (result !== 'updated') setUpdateAvailable(false);
  };

  if (!settings) return <div className="card text-center text-ink-500 py-8">Loading…</div>;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-5 animate-fade-in pb-4">
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

      {justUpdated && (
        <div className="w-full card flex items-center gap-2 border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-900/20 animate-slide-up">
          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Updated to the latest version</span>
        </div>
      )}

      {updateAvailable && !justUpdated && (
        <button
          onClick={installUpdate}
          className="w-full card flex items-center justify-between gap-2 border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-900/20 hover:shadow-glow transition animate-fade-in"
        >
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <RefreshCw size={16} />
            <span className="text-sm font-medium">New version available — tap to install</span>
          </div>
          <ChevronRight size={16} className="text-emerald-700 dark:text-emerald-300" />
        </button>
      )}

      {/* 1. Verse of the day */}
      <div className="card space-y-2">
        <div className="section-label">Verse of the day</div>
        <p className="verse-text italic">{VERSE_OF_DAY.text}</p>
        <div className="text-sm text-gold-700 dark:text-gold-400 font-medium">— {VERSE_OF_DAY.ref}</div>
      </div>

      {/* 2. How are you feeling? */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="section-label flex items-center gap-1.5"><Heart size={14} /> How are you feeling?</div>
          <Link
            to="/topics"
            className="btn-outline text-xs py-1.5 px-3"
          >
            See all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_TOPICS.map(t => (
            <Link
              key={t.id}
              to={`/topics?t=${t.id}`}
              className={`text-center px-2 py-3 rounded-xl text-xs font-semibold leading-tight ${COLOR_TINT[t.color] ?? COLOR_TINT.gold}`}
            >
              {t.title}
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Continue learning */}
      <Link
        to={next ? `/lesson/${next}` : '/learn'}
        className="btn-primary w-full"
      >
        <Sparkles size={18} />
        Continue learning
        <ChevronRight size={18} />
      </Link>

      {/* 4. Saved + Book picks */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/saved" className="card-tight flex flex-col items-center text-center gap-1 hover:shadow-glow transition">
          <Bookmark className="text-gold-600 dark:text-gold-400" size={22} />
          <div className="text-xs font-semibold text-ink-700 dark:text-ink-100">Saved verses</div>
        </Link>
        <Link to="/books" className="card-tight flex flex-col items-center text-center gap-1 hover:shadow-glow transition">
          <Library className="text-gold-600 dark:text-gold-400" size={22} />
          <div className="text-xs font-semibold text-ink-700 dark:text-ink-100">Book picks</div>
        </Link>
      </div>

      {/* 5. Quick links */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/read" className="card-tight flex flex-col items-center text-center gap-1 hover:shadow-glow transition">
          <BookOpen className="text-gold-600 dark:text-gold-400" size={22} />
          <div className="text-xs font-semibold text-ink-700 dark:text-ink-100">Read</div>
        </Link>
        <Link to="/pray" className="card-tight flex flex-col items-center text-center gap-1 hover:shadow-glow transition">
          <Cross className="text-gold-600 dark:text-gold-400" size={22} />
          <div className="text-xs font-semibold text-ink-700 dark:text-ink-100">Pray</div>
        </Link>
        <Link to="/memorize" className="card-tight flex flex-col items-center text-center gap-1 hover:shadow-glow transition">
          <Brain className="text-gold-600 dark:text-gold-400" size={22} />
          <div className="text-xs font-semibold text-ink-700 dark:text-ink-100">Memorize</div>
        </Link>
      </div>
    </div>
  );
}
