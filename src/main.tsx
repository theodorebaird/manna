import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ThemeProvider } from './components/ThemeProvider';
import { getVoices as preloadVoices } from './lib/tts';
import './index.css';

// Trigger voice loading early so the cache is warm by the time anyone calls
// speak() — otherwise on a cold tab the voice lookup races against the
// browser's async voice loading and quietly falls back to the default voice.
preloadVoices().catch(() => {});

// Track whether the service worker has reported a new version waiting.
// onNeedRefresh fires when the SW finds a new build and reaches 'waiting'.
let needRefresh = false;

// vite-plugin-pwa's helper: calling updateSW(true) tells the waiting SW to
// skip waiting and then reloads the page. Safe to call even when there's
// nothing to update — it just resolves.
const updateSW = registerSW({
  onNeedRefresh() {
    needRefresh = true;
    window.dispatchEvent(new CustomEvent('manna:update-available'));
  },
  onOfflineReady() {
    // No-op: offline support is silent.
  }
});

type UpdateResult = 'updated' | 'up-to-date' | 'error';

async function mannaUpdate(): Promise<UpdateResult> {
  // No service worker = no caching layer to update against. Just do a clean reload.
  if (!('serviceWorker' in navigator)) {
    location.replace('/?u=' + Date.now());
    return 'updated';
  }

  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) {
    // No SW registered (first visit, in flight). Nothing to update — but reload
    // safely so they get the latest from the network.
    return 'up-to-date';
  }

  // Fast path: we already know there's a waiting/installing SW (the onNeedRefresh
  // callback already fired, or another tab triggered an update).
  const hasPendingNow = () => needRefresh || !!reg.waiting || !!reg.installing;

  if (!hasPendingNow()) {
    // Force the SW to check the server for a new sw.js. This call bypasses HTTP
    // cache by design — the SW has to go to the network to update itself.
    try {
      await Promise.race([
        reg.update(),
        new Promise<void>((_, rej) => setTimeout(() => rej(new Error('update-timeout')), 5000))
      ]);
    } catch {
      return 'error';
    }
    // Give the SW a moment to transition into installing/waiting if there is one.
    await new Promise(r => setTimeout(r, 1500));
  }

  if (!hasPendingNow()) {
    return 'up-to-date';
  }

  // There's a new version. Have it skip waiting and reload.
  try {
    // updateSW(true) sends SKIP_WAITING and reloads when the new SW activates.
    await Promise.race([
      updateSW(true),
      new Promise<void>(resolve => setTimeout(resolve, 3000))
    ]);
  } catch {}

  // Safety net: if updateSW didn't reload us within 3s (iOS quirks, etc.),
  // clear caches and reload ourselves.
  try {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(n => caches.delete(n)));
    }
  } catch {}
  location.replace('/?u=' + Date.now());
  return 'updated';
}

(window as unknown as { __mannaUpdate?: () => Promise<UpdateResult> }).__mannaUpdate = mannaUpdate;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
