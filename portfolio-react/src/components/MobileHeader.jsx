import { memo, useCallback, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';
import { NAVIGATION } from '@/config/app.js';

function MobileHeader({ data }) {
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile } = data;

  const toggleLang = useCallback(
    () => setLang(lang === 'es' ? 'en' : 'es'),
    [lang, setLang],
  );
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-background-dark sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-emerald-600 rounded-full size-10 flex items-center justify-center text-background-dark font-bold">
            {profile.initials}
          </div>
          <span className="text-white font-bold">{profile.shortName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleLang} aria-label="Cambiar idioma" className="text-primary p-2 bg-white/5 rounded-full">
            <span className="text-sm font-bold">{lang.toUpperCase()}</span>
          </button>
          <button type="button" onClick={toggleMenu} aria-expanded={menuOpen} aria-label="Menú" className="text-white p-2">
            <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 bg-background-dark z-40 p-6 pt-20">
          <nav className="flex flex-col gap-4" aria-label="Móvil">
            {NAVIGATION.map((item, index) => (
              <MobileNavLink
                key={item.id}
                href={item.href}
                icon={item.icon}
                label={t(item.i18nKey)}
                onClick={closeMenu}
                active={index === 0}
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
    <a
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 px-4 py-3 rounded-full ${active ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}
    >
      <span className="material-symbols-outlined" aria-hidden>{icon}</span>
      <span>{label}</span>
    </a>
  );
});

export default memo(MobileHeader);
