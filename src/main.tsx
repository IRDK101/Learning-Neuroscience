import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import '@fontsource-variable/bodoni-moda/opsz.css';
import '@fontsource-variable/atkinson-hyperlegible-next/index.css';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Fetch the diagram and practice-text chunks as soon as the first screen has painted.
const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
idle(() => void import('./content/lazy').then((m) => m.prefetchContent()));
