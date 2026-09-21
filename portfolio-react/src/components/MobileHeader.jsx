import { memo, useCallback, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';
import { NAVIGATION } from '@/config/app.js';

function MobileHeader({ data, activeSection }) {
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile } = data;
  const toggleLang = useCallback(() => setLang(lang === 'es' ? 'en' : 'es'), [lang, setLang]);
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between border-b-[2.5px] border-ink bg-paper p-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="grid size-10 place-items-center rounded-full border-2 border-ink bg-pgreen font-hand text-xl font-bold">{profile.initials}</div>
          <span className="hand-title text-2xl">{profile.shortName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleLang} aria-label="Cambiar idioma" className="btn-ink bg-paper px-3 py-1.5 font-mono text-sm font-bold">{lang.toUpperCase()}</button>
          <button type="button" onClick={toggleMenu} aria-expanded={menuOpen} aria-label="Menú" className="btn-ink bg-ink px-2.5 py-1.5 text-paper">
            <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-paper p-6 pt-20 lg:hidden">
          <nav className="flex flex-col gap-3" aria-label="Móvil">
            {NAVIGATION.map((item) => (
              <MobileNavLink
                key={item.id}
                href={item.href}
                icon={item.icon}
                label={t(item.i18nKey)}
                onClick={closeMenu}
                active={activeSection ? activeSection === item.id : item.id === 'dashboard'}
              />
            ))}
          </nav>
        </div>
      )}
    </>
  );
}

const MobileNavLink = memo(function MobileNavLink({ href, icon, label, onClick, active }) {
  return (
    <a href={href} onClick={onClick} aria-current={active ? 'page' : undefined}
      className={`btn-ink flex items-center gap-3 px-4 py-3 font-mono text-sm font-bold ${active ? 'bg-pgreen/40' : 'bg-[#fffdf7]'}`}>
      <span className="material-symbols-outlined" aria-hidden>{icon}</span>
      <span>{label}</span>
    </a>
  );
});

export default memo(MobileHeader);
