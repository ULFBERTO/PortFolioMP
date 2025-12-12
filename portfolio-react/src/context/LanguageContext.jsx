import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

const staticTranslations = {
  es: {
    "nav.dashboard": "Dashboard",
    "nav.projects": "Proyectos",
    "nav.experience": "Experiencia",
    "nav.contact": "Contacto",
    "experience.title": "Línea de Experiencia",
    "projects.title": "Proyectos Destacados",
    "tech.title": "Tecnologías Principales",
    "contact.sendEmail": "Enviar Email"
  },
  en: {
    "nav.dashboard": "Dashboard",
    "nav.projects": "Projects",
    "nav.experience": "Experience",
    "nav.contact": "Contact",
    "experience.title": "Experience Timeline",
    "projects.title": "Featured Projects",
    "tech.title": "Core Technologies",
    "contact.sendEmail": "Send Email"
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('portfolio-lang') || 'es')

  useEffect(() => {
    localStorage.setItem('portfolio-lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  const t = (key) => staticTranslations[lang]?.[key] || key

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
