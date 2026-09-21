import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ensureLanguageLoaded, initialLang } from './i18n/index.js';
import { applyMotionAttr } from './shared/motion/motionPref.js';
import './index.css';

// data-motion antes del primer paint: el CSS decide qué animaciones viven.
applyMotionAttr();
try {
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.addEventListener?.('change', applyMotionAttr);
} catch {
  /* noop */
}

// Bloquear el primer paint hasta tener el diccionario inicial.
// Sin esto, con reloads muy rápidos `t('experience.title')` devuelve la key
// porque el chunk `es.json`/`en.json` aún no se descargó (lazy + idle).
async function bootstrap() {
  try {
    await ensureLanguageLoaded(initialLang);
  } catch {
    /* Si falla el chunk, renderizar igual (i18n usará fallbackLng) */
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
