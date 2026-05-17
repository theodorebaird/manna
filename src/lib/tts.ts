/**
 * Thin wrapper around the browser's SpeechSynthesis API.
 *
 * Key concerns handled here:
 *  - Voices load asynchronously; getVoices() returns [] on first call in some
 *    browsers until the voiceschanged event fires.
 *  - iOS Safari/PWA cuts off long utterances at ~200 chars. We chunk on
 *    sentence boundaries to keep utterances under that limit.
 *  - We expose a small controller (play/pause/resume/stop) plus a per-chunk
 *    callback so the UI can highlight the verse currently being spoken.
 *  - When setting a specific voice, we also set utterance.lang to that voice's
 *    lang — required on iOS, where omitting it causes the engine to fall back
 *    to the system default voice and ignore the voice property.
 */

const MAX_CHUNK_CHARS = 180;

let cachedVoices: SpeechSynthesisVoice[] | null = null;

export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    if (!isSupported()) return resolve([]);
    const synth = window.speechSynthesis;
    const initial = synth.getVoices();
    if (initial && initial.length) {
      cachedVoices = initial;
      return resolve(initial);
    }
    let resolved = false;
    const handler = () => {
      if (resolved) return;
      const v = synth.getVoices();
      if (v && v.length) {
        resolved = true;
        cachedVoices = v;
        synth.removeEventListener('voiceschanged', handler);
        resolve(v);
      }
    };
    synth.addEventListener('voiceschanged', handler);
    // Fallback: some browsers never fire the event; poll briefly
    let tries = 0;
    const poll = setInterval(() => {
      const v = synth.getVoices();
      if ((v && v.length) || tries++ > 20) {
        clearInterval(poll);
        if (!resolved) {
          resolved = true;
          if (v && v.length) cachedVoices = v;
          synth.removeEventListener('voiceschanged', handler);
          resolve(v ?? []);
        }
      }
    }, 100);
  });
}

function findVoiceByURI(uri: string | null | undefined): SpeechSynthesisVoice | null {
  if (!uri || !isSupported()) return null;
  // Try cached first, then a fresh fetch
  const all = cachedVoices && cachedVoices.length
    ? cachedVoices
    : window.speechSynthesis.getVoices();
  if (all && all.length) cachedVoices = all;
  return (all ?? []).find(v => v.voiceURI === uri) ?? null;
}

export interface SpeakChunk {
  text: string;
  meta?: { verse?: number };
}

export interface SpeakOptions {
  voice?: SpeechSynthesisVoice | null;   // direct voice ref takes priority
  voiceURI?: string | null;              // fallback: looked up by URI
  rate?: number;            // 0.5 – 2.0, default 1
  pitch?: number;           // 0 – 2, default 1
  onChunkStart?: (chunk: SpeakChunk, index: number) => void;
  onEnd?: () => void;
  onError?: (e: Event) => void;
}

export class Speaker {
  private utterances: SpeechSynthesisUtterance[] = [];
  private playing = false;
  private currentIndex = 0;

  speak(chunks: SpeakChunk[], opts: SpeakOptions = {}) {
    if (!isSupported() || chunks.length === 0) return;
    this.stop();
    const synth = window.speechSynthesis;
    const voice = opts.voice ?? findVoiceByURI(opts.voiceURI);

    this.utterances = chunks.flatMap((chunk, idx) => splitIntoSafeChunks(chunk.text).map((text, sub) => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) {
        u.voice = voice;
        // iOS requires lang to be set or the voice property may be ignored.
        u.lang = voice.lang;
      }
      u.rate = opts.rate ?? 1;
      u.pitch = opts.pitch ?? 1;
      (u as unknown as { __mannaIdx?: number }).__mannaIdx = idx;
      (u as unknown as { __mannaSub?: number }).__mannaSub = sub;
      (u as unknown as { __mannaChunk?: SpeakChunk }).__mannaChunk = chunk;
      return u;
    }));

    this.currentIndex = 0;
    this.playing = true;

    const playNext = () => {
      if (!this.playing) return;
      if (this.currentIndex >= this.utterances.length) {
        this.playing = false;
        opts.onEnd?.();
        return;
      }
      const u = this.utterances[this.currentIndex];
      const meta = u as unknown as { __mannaSub?: number; __mannaChunk?: SpeakChunk; __mannaIdx?: number };
      if (meta.__mannaSub === 0 && meta.__mannaChunk && opts.onChunkStart) {
        opts.onChunkStart(meta.__mannaChunk, meta.__mannaIdx ?? 0);
      }
      u.onend = () => {
        this.currentIndex++;
        playNext();
      };
      u.onerror = e => {
        opts.onError?.(e);
        this.currentIndex++;
        playNext();
      };
      synth.speak(u);
    };
    playNext();
  }

  pause() {
    if (!isSupported()) return;
    window.speechSynthesis.pause();
  }

  resume() {
    if (!isSupported()) return;
    window.speechSynthesis.resume();
  }

  stop() {
    if (!isSupported()) return;
    this.playing = false;
    this.currentIndex = this.utterances.length;
    window.speechSynthesis.cancel();
  }

  get isPlaying(): boolean {
    return isSupported() && (window.speechSynthesis.speaking || window.speechSynthesis.pending);
  }

  get isPaused(): boolean {
    return isSupported() && window.speechSynthesis.paused;
  }
}

/** Split a string into utterance-safe chunks (<= MAX_CHUNK_CHARS) on sentence boundaries when possible. */
function splitIntoSafeChunks(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= MAX_CHUNK_CHARS) return [cleaned];
  const out: string[] = [];
  const sentences = cleaned.split(/(?<=[.!?])\s+(?=[A-Z"'])/);
  let buffer = '';
  for (const s of sentences) {
    if ((buffer + ' ' + s).trim().length <= MAX_CHUNK_CHARS) {
      buffer = buffer ? buffer + ' ' + s : s;
    } else {
      if (buffer) out.push(buffer);
      if (s.length <= MAX_CHUNK_CHARS) {
        buffer = s;
      } else {
        const sub = hardChunk(s, MAX_CHUNK_CHARS);
        out.push(...sub.slice(0, -1));
        buffer = sub[sub.length - 1];
      }
    }
  }
  if (buffer) out.push(buffer);
  return out;
}

function hardChunk(text: string, max: number): string[] {
  const parts = text.split(/(?<=[,;:])\s+/);
  const out: string[] = [];
  let buf = '';
  for (const p of parts) {
    if ((buf + ' ' + p).trim().length <= max) {
      buf = buf ? buf + ' ' + p : p;
    } else {
      if (buf) out.push(buf);
      buf = p;
    }
  }
  if (buf) out.push(buf);
  return out.flatMap(s => {
    if (s.length <= max) return [s];
    const chunks: string[] = [];
    for (let i = 0; i < s.length; i += max) chunks.push(s.slice(i, i + max));
    return chunks;
  });
}
