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

export function DataProvider({ children }) {
  const [data, setData] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('admin_token') || null)
  const [loading, setLoading] = useState(true)

  // Load data on mount
  useEffect(() => {
    fetchData()
  }, [])

  // Check admin access via URL parameter (?admin=...) or stored session token — runs ONCE on mount
  useEffect(() => {
    const checkSession = async () => {
      const params = new URLSearchParams(window.location.search)
      const adminKey = params.get('admin')

      if (adminKey) {
        await verifyAdminKey(adminKey)
      } else if (sessionStorage.getItem('admin_active') === 'true' || sessionStorage.getItem('admin_token')) {
        // Verify or refresh existing session via cookie
        const refreshed = await refreshSession()
        if (refreshed) {
          setIsAdmin(true)
        } else if (sessionStorage.getItem('admin_token')) {
          setIsAdmin(true)
        }
      }
    }

    checkSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refreshSession = async () => {
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
      } else {
        console.warn('Acceso denegado o clave incorrecta:', result.error)
        setIsAdmin(false)
        sessionStorage.removeItem('admin_active')
      }
    } catch (error) {
      console.error('Error al validar credenciales con el backend:', error)
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
    <DataContext.Provider value={{ data, updateData, isAdmin, setIsAdmin, downloadData, loading }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)

