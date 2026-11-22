import { Capacitor } from '@capacitor/core';
import { StrictMode } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { IndexedDbStore } from './store/indexedDbStore';
import './ui/theme/tokens.css';
import './ui/theme/aurora.css';
import './ui/theme/glass.css';
import './ui/theme/screens.css';
import './ui/theme/motion.css';

// In the Android app a service worker would only serve stale copies after an update; there the files are already local.
if (Capacitor.isNativePlatform()) {
  void navigator.serviceWorker?.getRegistrations().then((registrations) => Promise.all(registrations.map((r) => r.unregister())));
} else {
  registerSW({ immediate: true });
}

const root = document.getElementById('root');
if (root === null) throw new Error('Missing #root element in index.html');
createRoot(root).render(
  <StrictMode>
    <App store={new IndexedDbStore()} />
  </StrictMode>,
);
