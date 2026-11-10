import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeStorage } from './utils/storage.ts';
import { isCapacitor } from './utils/platform.ts';
import './index.css';
import '@fontsource/vt323/latin-400.css';
import '@fontsource/vt323/latin-ext-400.css';
import '@fontsource/silkscreen/latin-400.css';
import '@fontsource/silkscreen/latin-ext-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-ext-400.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import '@fontsource/jetbrains-mono/latin-ext-600.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import '@fontsource/jetbrains-mono/latin-ext-700.css';
import '@fontsource/jetbrains-mono/latin-800.css';
import '@fontsource/jetbrains-mono/latin-ext-800.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing application root element.');
const root = ReactDOM.createRoot(rootElement);

async function bootstrap(): Promise<void> {
  await initializeStorage();
  const { default: App } = await import('./App.tsx');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

void bootstrap().catch((error: unknown) => {
  console.error('Unable to start Pixelfang: Snake Maze:', error);
  root.render(
    <main role="alert" className="app-shell flex items-center justify-center bg-[#C7F0D8] p-6 text-center font-mono-retro text-[#3A3F44]">
      <p>Pixelfang could not load its saved settings. Restart the app and try again.</p>
    </main>
  );
});

if (!isCapacitor() && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error: unknown) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
