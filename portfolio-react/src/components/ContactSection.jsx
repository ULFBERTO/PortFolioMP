import { memo, useCallback, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';
import Reveal from '@/shared/motion/Reveal.jsx';
import Magnetic from '@/shared/motion/Magnetic.jsx';
import Scramble from '@/shared/motion/Scramble.jsx';

/**
 * Final nocturno: la transmisión sale de noche (escena inferencia).
 * El CTA principal dispara un burst en el canvas del hero (evento 'packet-burst').
 */
function ContactSection({ data }) {
  const { lang, t } = useLanguage();
  const { contact, profile } = data;
  const [tx, setTx] = useState('idle'); // idle | sending | ok

  const transmit = useCallback(() => {
    setTx('sending');
    window.dispatchEvent(new CustomEvent('packet-burst', { detail: { n: 3 } }));
    setTimeout(() => setTx('ok'), 900);
    setTimeout(() => setTx('idle'), 4200);
  }, []);

  return (
    <section id="contact" aria-label={contact.title[lang]}>
      <Reveal>
        <div className="blueprint tape relative overflow-hidden rounded-[4px] border-[3px] border-ink p-6 shadow-[4px_5px_0_#1e1630] md:p-10">
          <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex max-w-xl flex-col gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-chalk/60">
                {'// transmisión nocturna · canal abierto'}
              </p>
              <h2 className="hand-title text-5xl leading-none text-chalk md:text-6xl">
                <span className="hand-underline">{contact.title[lang]}</span>
              </h2>
              <p className="leading-relaxed text-chalk/75">{contact.description[lang]}</p>
              <p className="font-mono text-xs text-pgreen" aria-live="polite">
                <Scramble
                  key={tx}
                  text={tx === 'sending' ? '>>> transmitiendo paquete…' : tx === 'ok' ? '>>> paquete recibido ✓' : '>>> esperando input_'}
                />
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Magnetic strength={12}>
                <a
                  href={`mailto:${profile.email}`}
                  onClick={transmit}
                  className="flex items-center gap-2 rounded-full border-[2.5px] border-pgreen bg-pgreen px-7 py-3.5 font-mono text-sm font-bold text-night shadow-[0_0_28px_rgba(92,255,92,.35)] transition-shadow hover:shadow-[0_0_44px_rgba(92,255,92,.55)]"
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden>send</span>
                  <span>{t('contact.sendEmail')}</span>
                </a>
              </Magnetic>
              <Magnetic>
                <a href={profile.github} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full border-2 border-chalk/50 px-6 py-3.5 font-mono text-sm font-bold text-chalk transition-colors hover:border-chalk hover:bg-white/10">
                  <span>GitHub</span><span className="material-symbols-outlined text-[18px]" aria-hidden>arrow_outward</span>
                </a>
              </Magnetic>
              <Magnetic>
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full border-2 border-chalk/50 px-6 py-3.5 font-mono text-sm font-bold text-chalk transition-colors hover:border-chalk hover:bg-white/10">
                  <span>LinkedIn</span><span className="material-symbols-outlined text-[18px]" aria-hidden>arrow_outward</span>
                </a>
              </Magnetic>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default memo(ContactSection);
