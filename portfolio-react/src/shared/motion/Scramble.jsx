import { memo, useEffect, useRef, useState } from 'react';
import { useInView, prefersReducedMotion } from './useInView.js';

const GLYPHS = '@#$%&*<>+/=¿?01';

/**
 * Glitch/scramble reveal estilo terminal: decodifica el texto al entrar en vista.
 * Ideal para kickers mono y roles del hero.
 */
const Scramble = memo(function Scramble({ text, className = '', speed = 28, as: Tag = 'span' }) {
  const { ref, inView } = useInView();
  const [out, setOut] = useState(text);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return undefined;
    started.current = true;
    if (prefersReducedMotion()) {
      setOut(text);
      return undefined;
    }
    let frame = 0;
    const total = text.length * 2 + 8;
    const id = setInterval(() => {
      frame += 1;
      const resolved = Math.floor((frame / total) * text.length);
      let s = text.slice(0, resolved);
      for (let i = resolved; i < text.length; i++) {
        s += text[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setOut(s);
      if (frame >= total) {
        clearInterval(id);
        setOut(text);
      }
    }, speed);
    return () => clearInterval(id);
  }, [inView, text, speed]);

  // NOTA: para re-disparar con otro texto, montar con key={text} desde el padre.
  return (
    <Tag ref={ref} className={className}>
      {out}
    </Tag>
  );
});

export default Scramble;
