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
 */

const MAX_CHUNK_CHARS = 180;

export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise(resolve => {
    if (!isSupported()) return resolve([]);
    const synth = window.speechSynthesis;
    const initial = synth.getVoices();
    if (initial && initial.length) return resolve(initial);
    let resolved = false;
    const handler = () => {
      if (resolved) return;
      const v = synth.getVoices();
      if (v && v.length) {
        resolved = true;
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
          synth.removeEventListener('voiceschanged', handler);
          resolve(v ?? []);
        }
      }
    }, 100);
  });
}

export interface SpeakChunk {
  text: string;
  meta?: { verse?: number };
}

export interface SpeakOptions {
  voiceURI?: string | null;
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
    const voices = synth.getVoices();
    const voice = opts.voiceURI ? voices.find(v => v.voiceURI === opts.voiceURI) ?? null : null;

    this.utterances = chunks.flatMap((chunk, idx) => splitIntoSafeChunks(chunk.text).map((text, sub) => {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.rate = opts.rate ?? 1;
      u.pitch = opts.pitch ?? 1;
      // Tag the first sub-utterance with the original chunk index for callbacks
      (u as unknown as { __mannaIdx?: number; __mannaSub?: number; __mannaChunk?: SpeakChunk }).__mannaIdx = idx;
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
  // Split on sentence-ending punctuation followed by space + capital letter
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
        // Sentence itself too long — chunk it by clauses or hard length
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
  // Last resort: brute split anything still over max
  return out.flatMap(s => {
    if (s.length <= max) return [s];
    const chunks: string[] = [];
    for (let i = 0; i < s.length; i += max) chunks.push(s.slice(i, i + max));
    return chunks;
  });
}
