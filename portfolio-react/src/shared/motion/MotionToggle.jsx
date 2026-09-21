import { memo, useCallback } from 'react';
import { getMotionMode, setMotionMode, useMotionMode } from './motionPref.js';

const ORDER = ['auto', 'full', 'reduced'];
const META = {
  auto: { icon: 'auto_mode', label: 'Animación: automática (según sistema)' },
  full: { icon: 'motion_photos_on', label: 'Animación: siempre en bucle' },
  reduced: { icon: 'motion_photos_off', label: 'Animación: reducida' },
};

/** Botón flotante para forzar el bucle aunque el SO pida reducir movimiento. */
const MotionToggle = memo(function MotionToggle() {
  const mode = useMotionMode();
  const current = getMotionMode() === 'auto' ? 'auto' : mode;

  const cycle = useCallback(() => {
    const cur = getMotionMode();
    const next = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length];
    setMotionMode(next);
  }, []);

  const meta = META[current] ?? META.auto;

  return (
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
  );
});

export default MotionToggle;
