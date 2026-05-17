import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Monitor, Type, Trash2, Info, HelpCircle, ChevronRight, BookOpen } from 'lucide-react';
import { useTheme, type ThemeMode } from '../components/ThemeProvider';
import { db, getSettings, updateSettings, type Settings as DBSettings } from '../db/db';
import { useScripture, TRANSLATIONS, type TranslationId } from '../components/ScriptureProvider';

export default function Settings() {
  const { mode, setMode } = useTheme();
  const { translationId, setTranslation } = useScripture();
  const [s, setS] = useState<DBSettings | null>(null);

  useEffect(() => { (async () => setS(await getSettings()))(); }, []);

  if (!s) return null;

  const patch = async (p: Partial<DBSettings>) => {
    const next = await updateSettings(p);
    setS(next);
  };

  const clearAll = async () => {
    if (!confirm('This erases all progress, bookmarks, and memory cards. Continue?')) return;
    await db.delete();
    location.reload();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <header>
        <h1 className="page-title">Settings</h1>
      </header>

      <div className="card space-y-3">
        <div className="section-label">Your name</div>
        <input
          className="input"
          value={s.userName}
          onChange={e => patch({ userName: e.target.value })}
          placeholder="What should we call you?"
        />
      </div>

      <div className="card space-y-3">
        <div className="section-label flex items-center gap-1.5"><BookOpen size={14} /> Bible translation</div>
        <div className="space-y-2">
          {TRANSLATIONS.map(t => {
            const active = translationId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTranslation(t.id as TranslationId)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                  active
                    ? 'border-gold-500 bg-gold-50 dark:bg-ink-700'
                    : 'border-gold-100 dark:border-ink-700 hover:bg-gold-50 dark:hover:bg-ink-700'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-semibold text-ink-800 dark:text-ink-100 flex items-center gap-2">
                    {t.name}
                    <span className="text-xs font-mono text-gold-700 dark:text-gold-400">{t.short}</span>
                  </div>
                  <div className="text-xs text-ink-500 dark:text-ink-300/70">{t.note} · {t.year}</div>
                </div>
                {active && <span className="text-gold-700 dark:text-gold-300 text-xs font-semibold">Active</span>}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-ink-500 dark:text-ink-300/70 italic">
          All three translations are public domain and work offline. NASB, NIV, NKJV, and ESV aren't available — they require paid publisher licenses.
        </p>
      </div>

      <div className="card space-y-3">
        <div className="section-label">Appearance</div>
        <div className="grid grid-cols-3 gap-2">
          {([
            ['light', Sun, 'Light'],
            ['dark', Moon, 'Dark'],
            ['system', Monitor, 'Auto']
          ] as const).map(([m, Icon, label]) => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => { setMode(m as ThemeMode); patch({ themePref: m as ThemeMode }); }}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition ${
                  active ? 'border-gold-500 bg-gold-50 dark:bg-ink-700 text-gold-700 dark:text-gold-300' : 'border-gold-100 dark:border-ink-700 text-ink-700 dark:text-ink-200'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card space-y-3">
        <div className="section-label flex items-center gap-1.5"><Type size={14} /> Scripture text size</div>
        <div className="grid grid-cols-4 gap-2">
          {(['sm', 'md', 'lg', 'xl'] as const).map(sz => (
            <button
              key={sz}
              onClick={() => patch({ fontSize: sz })}
              className={`py-2 rounded-xl border font-serif transition ${
                s.fontSize === sz ? 'border-gold-500 bg-gold-50 dark:bg-ink-700 text-gold-700 dark:text-gold-300' : 'border-gold-100 dark:border-ink-700 text-ink-700 dark:text-ink-200'
              } ${sz === 'sm' ? 'text-sm' : sz === 'md' ? 'text-base' : sz === 'lg' ? 'text-lg' : 'text-xl'}`}
            >
              Aa
            </button>
          ))}
        </div>
      </div>

      <div className="card space-y-3">
        <div className="section-label">Daily XP goal</div>
        <div className="grid grid-cols-4 gap-2">
          {[10, 20, 30, 50].map(g => (
            <button
              key={g}
              onClick={() => patch({ dailyXpGoal: g })}
              className={`py-2 rounded-xl border font-medium transition ${
                s.dailyXpGoal === g ? 'border-gold-500 bg-gold-50 dark:bg-ink-700 text-gold-700 dark:text-gold-300' : 'border-gold-100 dark:border-ink-700 text-ink-700 dark:text-ink-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <Link to="/how-to" className="card flex items-center justify-between gap-3 hover:shadow-glow transition no-underline">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-100 dark:bg-ink-700 flex items-center justify-center text-gold-700 dark:text-gold-300">
            <HelpCircle size={20} />
          </div>
          <div>
            <div className="font-semibold text-ink-800 dark:text-ink-100">How to use Manna</div>
            <div className="text-xs text-ink-500 dark:text-ink-300/70">Walkthrough of every feature</div>
          </div>
        </div>
        <ChevronRight className="text-ink-400" size={20} />
      </Link>

      <div className="card space-y-2 text-sm text-ink-700 dark:text-ink-200">
        <div className="section-label flex items-center gap-1.5"><Info size={14} /> About Manna</div>
        <p>Scripture is the <strong>King James Version</strong> (public domain). All data stays on your device.</p>
        <p>Manna is for daily reading, memorization, and study — built with love.</p>
      </div>

      <button onClick={clearAll} className="w-full py-3 rounded-xl border border-rose-300 text-rose-700 dark:text-rose-300 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 font-medium flex items-center justify-center gap-2">
        <Trash2 size={16} /> Erase all data
      </button>
    </div>
  );
}
