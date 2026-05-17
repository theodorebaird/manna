import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ThemeProvider } from './components/ThemeProvider';
import './index.css';

// Auto-detect new app versions and expose a global helper that any page can
// call to force an update. The Settings page surfaces both as a button.
const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('manna:update-available'));
  },
  onOfflineReady() {
    // No-op: offline support is silent.
  }
});

(window as unknown as { __mannaUpdate?: () => Promise<void> }).__mannaUpdate = async () => {
  // Clear all caches and unregister all service workers, then reload.
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
  // Trigger the vite-plugin-pwa update flow, then hard reload.
  try { await updateSW(true); } catch {}
  location.reload();
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
