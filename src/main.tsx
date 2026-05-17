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

(window as unknown as { __mannaUpdate?: () => Promise<void> }).__mannaUpdate = async () => {
  // Hard cap the whole operation at 3 seconds; we always navigate to root
  // afterward, so a hang in any subsystem can't block the user forever.
  const timeout = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
  const clearCaches = async () => {
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
    } catch {}
  };
  const unregisterSW = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
    } catch {}
  };

  // Race the actual work against a 3-second timeout so we never hang.
  await Promise.race([
    Promise.all([clearCaches(), unregisterSW()]),
    timeout(3000)
  ]);

  // Cache-bust query string forces the browser to refetch index.html fresh.
  location.replace('/?u=' + Date.now());
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
