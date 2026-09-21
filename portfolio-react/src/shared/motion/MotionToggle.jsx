import { memo, useCallback, useEffect, useState } from 'react';
import { MOTION_EVENT, getMotionMode, setMotionMode, systemReduced, useMotionMode } from './motionPref.js';

const ORDER = ['auto', 'full', 'reduced'];
const META = {
  auto: { icon: 'auto_mode', label: 'Animación: automática (según sistema)' },
  full: { icon: 'motion_photos_on', label: 'Animación: siempre en bucle' },
  reduced: { icon: 'motion_photos_off', label: 'Animación: reducida' },
};

/**
 * Botón flotante para forzar el bucle aunque el SO pida reducir movimiento.
 * Si el sistema impone reduced y el usuario aún no eligió nada, muestra
 * una pista que explica por qué todo está quieto (descartable).
 */
const MotionToggle = memo(function MotionToggle() {
  const mode = useMotionMode();
  const current = getMotionMode() === 'auto' ? 'auto' : mode;
  const [hintOpen, setHintOpen] = useState(
    () => getMotionMode() === 'auto' && systemReduced(),
  );

  useEffect(() => {
    const hide = () => {
      if (getMotionMode() !== 'auto') setHintOpen(false);
    };
    window.addEventListener(MOTION_EVENT, hide);
    return () => window.removeEventListener(MOTION_EVENT, hide);
  }, []);

  const cycle = useCallback(() => {
    const cur = getMotionMode();
    const next = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length];
    setMotionMode(next);
    setHintOpen(false);
  }, []);

  const meta = META[current] ?? META.auto;

  return (
    <>
      {hintOpen && (
        <div
          role="status"
          className="ink-card-flat fixed bottom-[76px] right-5 z-[95] w-60 p-3 text-left animate-scaleIn"
        >
          <button
            type="button"
            onClick={() => setHintOpen(false)}
            aria-label="Ocultar aviso"
            className="absolute right-2 top-2 leading-none text-ink/50 hover:text-ink"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden>close</span>
          </button>
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest">¿Todo quieto?</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/75">
            Tu sistema pide reducir animaciones. El banner arranca en bucle aquí 👇
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={cycle}
        aria-pressed={current === 'full'}
        title={`${meta.label} — clic para cambiar`}
        aria-label={meta.label}
        className="btn-ink fixed bottom-5 right-5 z-[95] grid size-12 place-items-center bg-paper text-ink"
      >
        <span className="material-symbols-outlined" aria-hidden>{meta.icon}</span>
      </button>
    </>
  );
});

export default MotionToggle;
