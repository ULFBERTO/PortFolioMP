import { createContext, useContext, useState, useEffect } from 'react'
import fallbackData from '../data/portfolioData.json'

const DataContext = createContext()

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // When running on production (Vercel, etc.) and not localhost
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://port-folio-mp.vercel.app/api'
  }
  return 'http://localhost:8080/api'
}

const API_BASE_URL = getApiBaseUrl()
const PORTFOLIO_ENDPOINT = `${API_BASE_URL}/portfolio`
const AUTH_VERIFY_ENDPOINT = `${API_BASE_URL}/auth/verify`
const AUTH_REFRESH_ENDPOINT = `${API_BASE_URL}/auth/refresh`
const AUTH_LOGOUT_ENDPOINT = `${API_BASE_URL}/auth/logout`

// Helper to sanitize URL by removing the ?admin=... key
const cleanAdminUrl = () => {
  try {
    const url = new URL(window.location.href)
    if (url.searchParams.has('admin')) {
      url.searchParams.delete('admin')
      const newSearch = url.searchParams.toString()
      const newUrl = url.pathname + (newSearch ? `?${newSearch}` : '') + url.hash
      window.history.replaceState({}, '', newUrl)
    }
  } catch (e) {
    console.warn('No se pudo limpiar la URL:', e)
  }
}

export function DataProvider({ children }) {
  const [data, setData] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('admin_token') || null)
  const [loading, setLoading] = useState(true)

  // Load data on mount
  useEffect(() => {
    fetchData()
  }, [])

  // Route Guard: verify admin access via URL param (?admin=...) or stored session token
  useEffect(() => {
    const checkSession = async () => {
      const params = new URLSearchParams(window.location.search)
      const adminKey = params.get('admin')

      if (adminKey) {
        // Route Guard: Attempt verification and immediately strip the key from the URL
        const success = await verifyAdminKey(adminKey)
        cleanAdminUrl()
        if (!success) {
          console.warn('[Route Guard] Acceso admin denegado: clave no autorizada.')
        }
      } else if (sessionStorage.getItem('admin_active') === 'true' || sessionStorage.getItem('admin_token')) {
        // Verify or refresh existing session via Redis cookie
        const refreshed = await refreshSession()
        if (refreshed) {
          setIsAdmin(true)
        } else {
          // Session expired or revoked in Redis
          setIsAdmin(false)
          sessionStorage.removeItem('admin_active')
          sessionStorage.removeItem('admin_token')
        }
      }
    }

    checkSession()

    const handleConsentChange = (e) => {
      if (e.detail === 'rejected') {
        logout()
      }
    }
    window.addEventListener('cookie-consent-changed', handleConsentChange)
    return () => window.removeEventListener('cookie-consent-changed', handleConsentChange)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const logout = async () => {
    setIsAdmin(false)
    setAdminToken(null)
    sessionStorage.removeItem('admin_active')
    sessionStorage.removeItem('admin_token')
    cleanAdminUrl()

    try {
      await fetch(AUTH_LOGOUT_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
      })
      console.log('[Auth] Sesión cerrada y token revocado en Redis.')
    } catch (e) {
      console.warn('Error al llamar logout en backend:', e)
    }
  }

  const refreshSession = async () => {
    if (localStorage.getItem('cookie_consent') === 'rejected') {
      return false
    }
    try {
      const res = await fetch(AUTH_REFRESH_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
      })
      const result = await res.json()
      if (res.ok && result.authenticated) {
        setIsAdmin(true)
        sessionStorage.setItem('admin_active', 'true')
        return true
      }
    } catch (e) {
      console.warn('Error renovando sesión:', e)
    }
    return false
  }

  const verifyAdminKey = async (key) => {
    try {
      const response = await fetch(`${AUTH_VERIFY_ENDPOINT}?admin=${encodeURIComponent(key)}`, {
        method: 'POST',
        credentials: 'include'
      })
      const result = await response.json()

      if (response.ok && result.authenticated) {
        setIsAdmin(true)
        sessionStorage.setItem('admin_active', 'true')
        if (result.token) {
          setAdminToken(result.token)
          sessionStorage.setItem('admin_token', result.token)
        }
        return true
      } else {
        console.warn('Acceso denegado o clave incorrecta:', result.error)
        setIsAdmin(false)
        sessionStorage.removeItem('admin_active')
        sessionStorage.removeItem('admin_token')
        return false
      }
    } catch (error) {
      console.error('Error al validar credenciales con el backend:', error)
      return false
    }
  }

  const fetchData = async () => {
    try {
      const response = await fetch(PORTFOLIO_ENDPOINT)
      if (response.ok) {
        const apiData = await response.json()
        if (apiData && apiData.profile) {
          setData(apiData)
          return
        }
      }
    } catch (error) {
      console.warn('Backend no disponible, usando datos de respaldo locales:', error.message)
    } finally {
      setLoading(false)
    }

    // Fallback if fetch fails or network is offline
    setData(fallbackData)
  }

  const updateData = async (newData) => {
    setData({ ...newData })

    // Save to Go Backend with Cookie session & Bearer token fallback
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`
      }

      let response = await fetch(PORTFOLIO_ENDPOINT, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(newData)
      })

      // If unauthorized (token/cookie expired), attempt auto-refresh and retry once
      if (response.status === 401) {
        const refreshed = await refreshSession()
        if (refreshed) {
          response = await fetch(PORTFOLIO_ENDPOINT, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(newData)
          })
        }
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        console.error('Error al guardar en el backend:', errData.error || response.statusText)
      } else {
        console.log('Cambios guardados exitosamente en Neon PostgreSQL')
      }
    } catch (error) {
      console.error('Error de red al guardar en la API:', error)
    }
  }

  const downloadData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'portfolioData.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DataContext.Provider value={{ data, updateData, isAdmin, setIsAdmin, logout, downloadData, loading }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)

