import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ThemeProvider } from './components/ThemeProvider';
import './index.css';

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

/**
 * Get the content-hash of the currently-loaded JS bundle.
 * Vite names assets like /assets/index-{HASH}.js — comparing this hash
 * to the one in the live server's index.html tells us if a new build exists.
 * Returns null in dev mode (no bundled assets).
 */
function getCurrentBundleHash(): string | null {
  const scripts = [...document.querySelectorAll('script[src*="/assets/index-"]')];
  if (scripts.length === 0) return null;
  const src = scripts[0].getAttribute('src') ?? '';
  return src.match(/index-([A-Za-z0-9_-]+)\.js/)?.[1] ?? null;
}

async function getServerBundleHash(): Promise<string | null> {
  const resp = await fetch('/?_check=' + Date.now(), { cache: 'no-store' });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  const text = await resp.text();
  return text.match(/\/assets\/index-([A-Za-z0-9_-]+)\.js/)?.[1] ?? null;
}

type UpdateResult = 'updated' | 'up-to-date' | 'error';

(window as unknown as { __mannaUpdate?: () => Promise<UpdateResult> }).__mannaUpdate = async (): Promise<UpdateResult> => {
  const currentHash = getCurrentBundleHash();
  if (!currentHash) {
    // Dev mode — no bundled assets to compare. Treat as up-to-date.
    return 'up-to-date';
  }
  let serverHash: string | null;
  try {
    serverHash = await Promise.race([
      getServerBundleHash(),
      new Promise<string | null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ]);
  } catch {
    return 'error';
  }
  if (!serverHash) {
    // Couldn't determine — be safe and don't reload
    return 'up-to-date';
  }
  if (serverHash === currentHash) {
    return 'up-to-date';
  }
  // New version exists — clear caches and reload
  try {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(n => caches.delete(n)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
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
