import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function CookieConsent() {
  const { lang } = useLanguage()
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [consentStatus, setConsentStatus] = useState(null)

  useEffect(() => {
    const savedConsent = localStorage.getItem('cookie_consent')
    if (!savedConsent) {
      // Show after a brief delay for smooth entrance
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    } else {
      setConsentStatus(savedConsent)
    }

    // Listen for custom event to reopen modal from footer
    const handleReopen = () => {
      setVisible(true)
      setShowDetails(true)
    }
    window.addEventListener('open-cookie-settings', handleReopen)
    return () => window.removeEventListener('open-cookie-settings', handleReopen)
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setConsentStatus('accepted')
    setVisible(false)
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: 'accepted' }))
  }

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'rejected')
    setConsentStatus('rejected')
    setVisible(false)
    // Clear session storage indicators
    sessionStorage.removeItem('admin_token')
    sessionStorage.removeItem('admin_active')
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: 'rejected' }))
  }

  if (!visible) return null

  const isEs = lang === 'es'

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="w-full max-w-2xl bg-surface-dark/95 dark:bg-[#13271c]/95 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-2xl p-5 sm:p-6 text-white pointer-events-auto transition-all">
        {/* Header with Icon */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
              <path d="M8.5 8.5v.01" />
              <path d="M16 15.5v.01" />
              <path d="M12 12v.01" />
              <path d="M11 17v.01" />
              <path d="M7 13v.01" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-base sm:text-lg text-white">
                {isEs ? 'Configuración de Privacidad y Cookies' : 'Privacy & Cookie Preferences'}
              </h3>
              {consentStatus && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  consentStatus === 'accepted' 
                    ? 'border-primary/40 text-primary bg-primary/10' 
                    : 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10'
                }`}>
                  {consentStatus === 'accepted' 
                    ? (isEs ? 'Aceptadas' : 'Accepted') 
                    : (isEs ? 'Rechazadas' : 'Declined')}
                </span>
              )}
            </div>

            <p className="text-gray-300 text-xs sm:text-sm mt-1.5 leading-relaxed">
              {isEs
                ? 'Este sitio utiliza cookies y almacenamiento local estrictamente necesarios para la seguridad del panel de administración, control de peticiones en Redis y preferencias de visualización.'
                : 'This site uses strictly necessary cookies and local storage for admin security, Redis-backed rate limiting, and viewing preferences.'}
            </p>

            {/* Expandable Details */}
            {showDetails && (
              <div className="mt-3.5 pt-3.5 border-t border-white/10 space-y-2.5 text-xs text-gray-400 animate-in fade-in duration-200">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-200 font-medium">
                      {isEs ? 'Cookies Esenciales / Seguridad:' : 'Essential / Security Cookies:'}
                    </span>{' '}
                    {isEs
                      ? 'Token de sesión cifrado (HttpOnly, Secure) utilizado únicamente para validar el acceso administrativo y proteger contra ataques de fuerza bruta en Redis.'
                      : 'Encrypted session token (HttpOnly, Secure) used only to validate admin access and protect against brute-force in Redis.'}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-200 font-medium">
                      {isEs ? 'Preferencias Locales:' : 'Local Preferences:'}
                    </span>{' '}
                    {isEs
                      ? 'Guardado de idioma seleccionado (Español/Inglés) en el navegador para no solicitarlo en cada visita.'
                      : 'Saves your language preference (ES/EN) in the browser so you don’t need to set it every visit.'}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-200 font-medium">
                      {isEs ? 'Cookies de Terceros / Rastreo:' : 'Third-Party / Tracking Cookies:'}
                    </span>{' '}
                    {isEs
                      ? 'No utilizamos cookies de publicidad, rastreo ni venta de datos.'
                      : 'We do not use advertising, tracking, or data-selling cookies.'}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-gray-400 hover:text-primary transition-colors underline underline-offset-4 focus:outline-none"
              >
                {showDetails
                  ? (isEs ? 'Ocultar detalles' : 'Hide details')
                  : (isEs ? 'Ver detalles de cookies' : 'View cookie details')}
              </button>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 focus:outline-none"
                >
                  {isEs ? 'Rechazar' : 'Decline'}
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-black bg-primary hover:bg-emerald-400 shadow-lg shadow-primary/20 transition-all duration-200 focus:outline-none hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isEs ? 'Aceptar Todas' : 'Accept All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
