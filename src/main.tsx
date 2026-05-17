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

// Auto-detect new app versions and expose a global helper that any page can
// call to force an update. The Settings page surfaces both as a button.
registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('manna:update-available'));
  },
  onOfflineReady() {
    // No-op: offline support is silent.
  }
});

type UpdateResult = 'updated' | 'up-to-date' | 'error';

(window as unknown as { __mannaUpdate?: () => Promise<UpdateResult> }).__mannaUpdate = async (): Promise<UpdateResult> => {
  // In dev (or if SW unavailable), just report up-to-date.
  if (!('serviceWorker' in navigator)) return 'up-to-date';
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return 'up-to-date';

  // Listen for updatefound BEFORE calling update() so we don't miss it.
  // Also detect a SW that's already waiting (previous tab triggered update).
  let foundUpdate = !!(reg.waiting || reg.installing);

  const updateFound: Promise<boolean> = new Promise(resolve => {
    let done = false;
    const finish = (val: boolean) => { if (!done) { done = true; resolve(val); } };
    if (foundUpdate) { finish(true); return; }
    const onUpdateFound = () => finish(true);
    reg.addEventListener('updatefound', onUpdateFound);
    // Give the SW up to 4s to fetch the new manifest from the server.
    setTimeout(() => {
      reg.removeEventListener('updatefound', onUpdateFound);
      finish(!!(reg.waiting || reg.installing));
    }, 4000);
  });

  try {
    await Promise.race([
      reg.update(),
      new Promise<void>((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000))
    ]);
  } catch {
    return 'error';
  }

  foundUpdate = await updateFound;
  if (!foundUpdate) return 'up-to-date';

  // New version is installing or waiting — give the install a moment, then reload.
  await new Promise(r => setTimeout(r, 800));
  try {
    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(n => caches.delete(n)));
    }
  } catch {}
  location.replace('/?u=' + Date.now());
  return 'updated';
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
