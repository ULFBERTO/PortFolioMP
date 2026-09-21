import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es.json'
import en from './locales/en.json'

const getInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('portfolio-lang')
    if (saved && (saved === 'es' || saved === 'en')) {
      return saved
    }
    const navLang = navigator.language?.split('-')[0]
    if (navLang === 'en') return 'en'
  }
  return 'es'
}

const initialLang = getInitialLanguage()

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en }
    },
    lng: initialLang,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  })

// Sync document lang and localStorage
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang
}

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('portfolio-lang', lng)
    document.documentElement.lang = lng
  }
})

export default i18n
