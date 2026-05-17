import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Sun, Moon, Cross, Scroll, Heart, Users, Utensils, Wind, Gift, Compass, BookOpen, CheckCircle2 } from 'lucide-react';
import prayersData from '../data/prayers.json';
import { db } from '../db/db';
import { todayKey } from '../lib/dates';

interface Prayer {
  id: string;
  title: string;
  category: 'daily' | 'milestone' | 'biblical' | 'topical' | 'intercession';
  icon: string;
  estimateMin: number;
  intro: string;
  body: string;
  scriptures: string[];
}

const PRAYERS = prayersData as Prayer[];

const ICONS: Record<string, typeof Sun> = {
  sun: Sun, moon: Moon, cross: Cross, scroll: Scroll, heart: Heart,
  users: Users, utensils: Utensils, wind: Wind, gift: Gift, compass: Compass
};

const CATEGORY_LABEL: Record<Prayer['category'], string> = {
  daily: 'Daily',
  milestone: 'Milestone',
  biblical: 'Biblical prayers',
  topical: 'For specific moments',
  intercession: 'For others'
};

const CATEGORY_ORDER: Prayer['category'][] = ['daily', 'milestone', 'biblical', 'topical', 'intercession'];

export default function Pray() {
  const [selected, setSelected] = useState<Prayer | null>(null);
  const [prayedToday, setPrayedToday] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const entry = await db.prayerProgress.get(todayKey());
      if (entry) setPrayedToday(new Set(entry.prayerIds));
    })();
  }, []);

  const grouped = useMemo(() => {
    const m = new Map<Prayer['category'], Prayer[]>();
    for (const p of PRAYERS) {
      if (!m.has(p.category)) m.set(p.category, []);
      m.get(p.category)!.push(p);
    }
    return m;
  }, []);

  const markPrayed = async (id: string) => {
    const date = todayKey();
    const existing = await db.prayerProgress.get(date);
    const ids = new Set(existing?.prayerIds ?? []);
    ids.add(id);
    await db.prayerProgress.put({ date, prayerIds: [...ids] });
    setPrayedToday(new Set(ids));
  };

  if (selected) {
    return (
      <PrayerDetail
        prayer={selected}
        prayed={prayedToday.has(selected.id)}
        onMarkPrayed={() => markPrayed(selected.id)}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      <header>
        <h1 className="page-title flex items-center gap-2"><Cross size={24} /> Pray</h1>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          Guided prayers for every moment of the day. Use them as your own — or as a starting point.
        </p>
      </header>

      {prayedToday.size > 0 && (
        <div className="card-tight flex items-center gap-2 bg-gold-50/70 dark:bg-ink-700/40 border-gold-200 dark:border-gold-700/40">
          <CheckCircle2 size={16} className="text-gold-600 dark:text-gold-400" />
          <span className="text-sm text-ink-700 dark:text-ink-200">
            {prayedToday.size} prayer{prayedToday.size === 1 ? '' : 's'} prayed today
          </span>
        </div>
      )}

      {CATEGORY_ORDER.map(cat => {
        const items = grouped.get(cat);
        if (!items || items.length === 0) return null;
        return (
          <section key={cat} className="space-y-2">
            <div className="section-label">{CATEGORY_LABEL[cat]}</div>
            <div className="space-y-2">
              {items.map(p => {
                const Icon = ICONS[p.icon] ?? Cross;
                const done = prayedToday.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="w-full text-left card flex items-start gap-3 hover:shadow-glow transition"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done
                        ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-white'
                        : 'bg-gold-100 dark:bg-ink-700 text-gold-700 dark:text-gold-300'
                    }`}>
                      {done ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink-800 dark:text-ink-100 flex items-center gap-2">
                        {p.title}
                        <span className="text-xs text-ink-500 dark:text-ink-300/70 font-normal">~{p.estimateMin} min</span>
                      </div>
                      <div className="text-xs text-ink-500 dark:text-ink-300/70 mt-0.5 line-clamp-2">{p.intro}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function PrayerDetail({ prayer, prayed, onMarkPrayed, onBack }: {
  prayer: Prayer;
  prayed: boolean;
  onMarkPrayed: () => void;
  onBack: () => void;
}) {
  const Icon = ICONS[prayer.icon] ?? Cross;
  const [fontScale, setFontScale] = useState(1);

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost"><ArrowLeft size={18} /> All prayers</button>
        <div className="flex items-center gap-1">
          <button onClick={() => setFontScale(s => Math.max(0.8, s - 0.1))} className="w-8 h-8 rounded-full border border-gold-200 dark:border-ink-600 text-ink-700 dark:text-ink-200 text-sm">A−</button>
          <button onClick={() => setFontScale(s => Math.min(1.6, s + 0.1))} className="w-8 h-8 rounded-full border border-gold-200 dark:border-ink-600 text-ink-700 dark:text-ink-200 text-sm">A+</button>
        </div>
      </header>

      <div>
        <div className="flex items-center gap-2 text-gold-700 dark:text-gold-400">
          <Icon size={20} />
          <span className="text-xs uppercase tracking-wider font-semibold">{CATEGORY_LABEL[prayer.category]}</span>
        </div>
        <h1 className="page-title">{prayer.title}</h1>
        <p className="text-sm text-ink-600 dark:text-ink-300 italic">{prayer.intro}</p>
      </div>

      <div className="card">
        <div
          className="font-serif text-ink-800 dark:text-ink-100 whitespace-pre-wrap leading-relaxed"
          style={{ fontSize: `${fontScale}rem` }}
        >
          {prayer.body}
        </div>
      </div>

      {prayer.scriptures.length > 0 && (
        <div className="card space-y-2">
          <div className="section-label flex items-center gap-1.5"><BookOpen size={14} /> Related scripture</div>
          <div className="flex flex-wrap gap-2">
            {prayer.scriptures.map(ref => (
              <span key={ref} className="chip text-xs">{ref}</span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onMarkPrayed}
        disabled={prayed}
        className={prayed ? 'btn-outline w-full' : 'btn-primary w-full'}
      >
        {prayed ? <><CheckCircle2 size={18} /> Prayed today</> : 'Mark as prayed'}
      </button>
    </div>
  );
}
