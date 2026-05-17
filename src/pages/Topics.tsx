import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import topicsData from '../data/topics.json';

interface Topic {
  id: string;
  title: string;
  icon: string;
  color: string;
  summary: string;
  verses: { ref: string; text: string }[];
}

const TOPICS = topicsData as Topic[];

const COLOR_MAP: Record<string, string> = {
  sky:     'from-sky-300/40 to-sky-500/20 text-sky-800 dark:text-sky-200 border-sky-200 dark:border-sky-800/40',
  amber:   'from-amber-300/40 to-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/40',
  indigo:  'from-indigo-300/40 to-indigo-500/20 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800/40',
  rose:    'from-rose-300/40 to-rose-500/20 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800/40',
  emerald: 'from-emerald-300/40 to-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/40',
  red:     'from-red-300/40 to-red-500/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800/40',
  slate:   'from-slate-300/40 to-slate-500/20 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800/40',
  violet:  'from-violet-300/40 to-violet-500/20 text-violet-800 dark:text-violet-200 border-violet-200 dark:border-violet-800/40',
  stone:   'from-stone-300/40 to-stone-500/20 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-800/40',
  gold:    'from-gold-300/40 to-gold-500/20 text-gold-800 dark:text-gold-200 border-gold-200 dark:border-gold-700/60'
};

export default function Topics() {
  const [selected, setSelected] = useState<Topic | null>(null);

  if (selected) {
    return <TopicDetail topic={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <header className="flex items-center justify-between">
        <Link to="/" className="btn-ghost"><ArrowLeft size={18} /> Home</Link>
      </header>
      <div>
        <h1 className="page-title">How are you feeling?</h1>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          Tap what you're struggling with right now. Scripture meets us where we are.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {TOPICS.map(t => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className={`text-left p-3 rounded-2xl border bg-gradient-to-br ${COLOR_MAP[t.color] ?? COLOR_MAP.gold} transition active:scale-95`}
          >
            <div className="font-semibold text-sm leading-tight">{t.title}</div>
            <div className="text-[10px] opacity-75 mt-1">{t.verses.length} verses</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TopicDetail({ topic, onBack }: { topic: Topic; onBack: () => void }) {
  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost"><ArrowLeft size={18} /> All topics</button>
      </header>

      <div>
        <h1 className="page-title">{topic.title}</h1>
      </div>

      <div className="card">
        <div className="text-ink-800 dark:text-ink-100 leading-relaxed whitespace-pre-wrap">{topic.summary}</div>
      </div>

      <div className="section-label">What scripture says</div>
      <div className="space-y-3">
        {topic.verses.map(v => {
          const slug = v.ref.toLowerCase()
            .replace(/^(\d)\s+/, '$1-')
            .replace(/\s+\d+:\d+(-\d+)?$/, '')
            .replace(/\s+/g, '-');
          const chapterMatch = v.ref.match(/(\d+):(\d+)/);
          const chapter = chapterMatch ? chapterMatch[1] : '1';
          return (
            <div key={v.ref} className="card space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gold-700 dark:text-gold-400">{v.ref}</div>
                <Link to={`/read/${slug}/${chapter}`} className="text-xs text-gold-700 dark:text-gold-400 flex items-center gap-1">
                  Open <ChevronRight size={12} />
                </Link>
              </div>
              <div className="verse-text italic text-base">{v.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
