import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';

// PageTransition resets scroll itself; the browser's own restore on back/forward jolts the outgoing page.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// A rebuild replaces the hashed page chunks, so a tab opened before it can't load them and would
// hang on the spinner. Reload once to pick up the new build (guarded so a real outage can't loop).
window.addEventListener('vite:preloadError', (event) => {
  const KEY = 'noore.chunkReload';
  let last = 0;
  try { last = Number(sessionStorage.getItem(KEY)) || 0; } catch { /* private mode */ }
  if (Date.now() - last < 10_000) return;
  try { sessionStorage.setItem(KEY, String(Date.now())); } catch { /* private mode */ }
  event.preventDefault();
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
