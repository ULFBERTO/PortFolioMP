import { useEffect, useState } from 'react';

/**
 * Preferencia de movimiento global: auto (respeta SO) / full (forzar bucle) / reduced.
 * Sin esto, un SO con "reducir animaciones" congela TODA la página por diseño
 * (loops estáticos + CSS off) y el cursor custom del panal nunca se dibuja.
 * @module shared/motion/motionPref
 */

export const MOTION_EVENT = 'motion-changed';
const STORAGE_KEY = 'portfolio-motion'; // 'auto' | 'full' | 'reduced'

export function systemReduced() {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

export function getMotionMode() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'full' || v === 'reduced' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

/** true = bucles y animaciones activos. */
export function motionAllowed() {
  const mode = getMotionMode();
  if (mode === 'full') return true;
  if (mode === 'reduced') return false;
  return !systemReduced();
}

export function applyMotionAttr() {
  try {
    document.documentElement.dataset.motion = motionAllowed() ? 'full' : 'reduced';
  } catch {
    /* noop */
  }
}

export function setMotionMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* noop */
  }
  applyMotionAttr();
  try {
    window.dispatchEvent(new CustomEvent(MOTION_EVENT, { detail: mode }));
  } catch {
    /* noop */
  }
}

/** Hook reactivo al toggle y a cambios del SO. Devuelve 'full' | 'reduced'. */
export function useMotionMode() {
  const [mode, setMode] = useState(() => (motionAllowed() ? 'full' : 'reduced'));

  useEffect(() => {
    const update = () => setMode(motionAllowed() ? 'full' : 'reduced');
    update();
    window.addEventListener(MOTION_EVENT, update);
    let mq = null;
    try {
      mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener?.('change', update);
    } catch {
      /* noop */
    }
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) update();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(MOTION_EVENT, update);
      window.removeEventListener('storage', onStorage);
      try {
        mq?.removeEventListener?.('change', update);
      } catch {
        /* noop */
      }
    };
  }, []);

  return mode;
}
