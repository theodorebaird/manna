import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Monitor, Type, Trash2, Info, HelpCircle, ChevronRight, BookOpen, RefreshCw, Loader2, CheckCircle2, XCircle, X as XIcon, Volume2, Play } from 'lucide-react';
import { Speaker, getVoices, isSupported as ttsSupported } from '../lib/tts';
import { useTheme, type ThemeMode } from '../components/ThemeProvider';
import { db, getSettings, updateSettings, type Settings as DBSettings } from '../db/db';
import { useScripture, TRANSLATIONS, type TranslationId } from '../components/ScriptureProvider';

export default function Settings() {
  const { mode, setMode } = useTheme();
  const { translationId, setTranslation } = useScripture();
  const [s, setS] = useState<DBSettings | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateResult, setUpdateResult] = useState<'up-to-date' | 'error' | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);

  useEffect(() => {
    if (!ttsSupported()) { setVoicesLoading(false); return; }
    (async () => {
      const v = await getVoices();
      const englishVoices = v.filter(x => x.lang.toLowerCase().startsWith('en'));
      setVoices(englishVoices.length ? englishVoices : v);
      setVoicesLoading(false);
    })();
  }, []);

  useEffect(() => {
    const handler = () => setUpdateAvailable(true);
    window.addEventListener('manna:update-available', handler);
    return () => window.removeEventListener('manna:update-available', handler);
  }, []);

  const checkForUpdate = async () => {
    setUpdating(true);
    setUpdateResult(null);
    const fn = (window as unknown as { __mannaUpdate?: () => Promise<'updated' | 'up-to-date' | 'error'> }).__mannaUpdate;
    if (!fn) {
      location.reload();
      return;
    }
    const result = await fn();
    setUpdating(false);
    if (result === 'updated') {
      // Page is reloading; nothing more to do
      return;
    }
    setUpdateResult(result);
  };

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

      <VoiceCard
        voices={voices}
        loading={voicesLoading}
        currentVoiceURI={s.voiceURI ?? null}
        currentRate={s.speechRate ?? 1}
        onPickVoice={async uri => { const next = await updateSettings({ voiceURI: uri }); setS(next); }}
        onChangeRate={async r => { const next = await updateSettings({ speechRate: r }); setS(next); }}
      />

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

      <div className={`card space-y-3 ${updateAvailable ? 'border-emerald-300 dark:border-emerald-700/60' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-ink-800 dark:text-ink-100 flex items-center gap-2">
              <RefreshCw size={16} /> App version
            </div>
            <div className="text-xs text-ink-500 dark:text-ink-300/70 mt-1">
              {updateAvailable
                ? 'A new version is available. Tap below to install.'
                : 'Manna updates automatically when you visit. Tap below to force a check now.'}
            </div>
          </div>
        </div>
        <button
          onClick={checkForUpdate}
          disabled={updating}
          className={updateAvailable ? 'btn-primary w-full' : 'btn-outline w-full'}
        >
          {updating
            ? <><Loader2 size={16} className="animate-spin" /> Updating…</>
            : updateAvailable
            ? <><RefreshCw size={16} /> Install update</>
            : <><RefreshCw size={16} /> Check for updates</>
          }
        </button>
        <p className="text-[11px] text-ink-500 dark:text-ink-300/70 italic">
          This clears the offline cache and reloads with the latest version. You shouldn't need to uninstall the app.
        </p>
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

      {updateResult && (
        <UpdateResultModal result={updateResult} onClose={() => setUpdateResult(null)} />
      )}
    </div>
  );
}

function VoiceCard({
  voices, loading, currentVoiceURI, currentRate, onPickVoice, onChangeRate
}: {
  voices: SpeechSynthesisVoice[];
  loading: boolean;
  currentVoiceURI: string | null;
  currentRate: number;
  onPickVoice: (uri: string | null) => void;
  onChangeRate: (r: number) => void;
}) {
  const [testing, setTesting] = useState<string | null>(null);
  const testSpeaker = useState(() => new Speaker())[0];

  if (!ttsSupported()) {
    return (
      <div className="card space-y-2">
        <div className="section-label flex items-center gap-1.5"><Volume2 size={14} /> Read aloud</div>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          Your browser doesn't support text-to-speech. Try Chrome, Safari, or Edge.
        </p>
      </div>
    );
  }

  const test = (voiceURI: string | null) => {
    testSpeaker.stop();
    setTesting(voiceURI ?? 'default');
    testSpeaker.speak(
      [{ text: 'For God so loved the world, that he gave his only begotten Son.' }],
      {
        voiceURI,
        rate: currentRate,
        onEnd: () => setTesting(null),
        onError: () => setTesting(null)
      }
    );
  };

  const rates: { label: string; value: number }[] = [
    { label: 'Slow',   value: 0.75 },
    { label: 'Normal', value: 1.0 },
    { label: 'Fast',   value: 1.25 },
    { label: 'Faster', value: 1.5 }
  ];

  return (
    <div className="card space-y-4">
      <div className="section-label flex items-center gap-1.5"><Volume2 size={14} /> Read aloud — voice</div>

      <div className="space-y-2">
        <div className="text-xs text-ink-500 dark:text-ink-300/70">Speed</div>
        <div className="grid grid-cols-4 gap-2">
          {rates.map(r => (
            <button
              key={r.value}
              onClick={() => onChangeRate(r.value)}
              className={`py-2 rounded-xl border text-xs font-medium transition ${
                Math.abs(currentRate - r.value) < 0.01
                  ? 'border-gold-500 bg-gold-50 dark:bg-ink-700 text-gold-700 dark:text-gold-300'
                  : 'border-gold-100 dark:border-ink-700 text-ink-700 dark:text-ink-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-ink-500 dark:text-ink-300/70">Voice</div>
        {loading && <div className="text-sm text-ink-500 italic">Loading voices…</div>}
        {!loading && voices.length === 0 && (
          <div className="text-sm text-ink-500 italic">No voices found on this device.</div>
        )}
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          <button
            onClick={() => onPickVoice(null)}
            className={`w-full text-left px-3 py-2 rounded-xl border transition flex items-center justify-between gap-2 ${
              !currentVoiceURI
                ? 'border-gold-500 bg-gold-50 dark:bg-ink-700'
                : 'border-gold-100 dark:border-ink-700 hover:bg-gold-50 dark:hover:bg-ink-700'
            }`}
          >
            <div className="min-w-0">
              <div className="font-medium text-sm text-ink-800 dark:text-ink-100">System default</div>
              <div className="text-[11px] text-ink-500 dark:text-ink-300/70">Whatever voice your device chooses</div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); test(null); }}
              className="text-gold-700 dark:text-gold-400 px-2 py-1 rounded hover:bg-gold-100 dark:hover:bg-ink-600 flex-shrink-0"
              title="Test"
            >
              <Play size={14} className={testing === 'default' ? 'animate-pulse' : ''} />
            </button>
          </button>
          {voices.map(v => {
            const active = currentVoiceURI === v.voiceURI;
            return (
              <button
                key={v.voiceURI}
                onClick={() => onPickVoice(v.voiceURI)}
                className={`w-full text-left px-3 py-2 rounded-xl border transition flex items-center justify-between gap-2 ${
                  active
                    ? 'border-gold-500 bg-gold-50 dark:bg-ink-700'
                    : 'border-gold-100 dark:border-ink-700 hover:bg-gold-50 dark:hover:bg-ink-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-ink-800 dark:text-ink-100 truncate">
                    {v.name}
                  </div>
                  <div className="text-[11px] text-ink-500 dark:text-ink-300/70">
                    {v.lang}{v.localService ? ' · offline' : ' · online'}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); test(v.voiceURI); }}
                  className="text-gold-700 dark:text-gold-400 px-2 py-1 rounded hover:bg-gold-100 dark:hover:bg-ink-600 flex-shrink-0"
                  title="Test"
                >
                  <Play size={14} className={testing === v.voiceURI ? 'animate-pulse' : ''} />
                </button>
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] text-ink-500 dark:text-ink-300/70 italic">
        Voices come from your device. iPhones use Siri voices; Android uses Google voices. On the Read page, tap the speaker icon to listen to a chapter.
      </p>
    </div>
  );
}

function UpdateResultModal({ result, onClose }: { result: 'up-to-date' | 'error'; onClose: () => void }) {
  const isOk = result === 'up-to-date';
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-ink-800 rounded-t-2xl sm:rounded-2xl border border-gold-200 dark:border-ink-700 shadow-soft p-5 space-y-4 animate-slide-up text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-300/70 font-semibold">App update</span>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-800 dark:hover:text-ink-100"><XIcon size={18} /></button>
        </div>
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
          isOk
            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
        }`}>
          {isOk ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
        </div>
        <h3 className="font-serif text-xl text-ink-800 dark:text-ink-100">
          {isOk ? "You're on the latest version" : "Couldn't check for updates"}
        </h3>
        <p className="text-sm text-ink-600 dark:text-ink-300">
          {isOk
            ? 'Manna is up to date. Nothing to install.'
            : "We couldn't reach the server to check. Try again in a moment, or check your connection."}
        </p>
        <button onClick={onClose} className="btn-primary w-full">Close</button>
      </div>
    </div>
  );
}
