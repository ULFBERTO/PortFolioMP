import { createContext, useContext, useState, useEffect } from 'react'
import fallbackData from '../data/portfolioData.json'

const DataContext = createContext()

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const PORTFOLIO_ENDPOINT = `${API_BASE_URL}/portfolio`
const AUTH_VERIFY_ENDPOINT = `${API_BASE_URL}/auth/verify`

export function DataProvider({ children }) {
  const [data, setData] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('admin_token') || null)
  const [loading, setLoading] = useState(true)

  // Load data on mount
  useEffect(() => {
    fetchData()
  }, [])

  // Check admin access via URL parameter (?admin=...) or stored session token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const adminKey = params.get('admin')

    if (adminKey) {
      verifyAdminKey(adminKey)
    } else if (adminToken) {
      setIsAdmin(true)
    }
  }, [adminToken])

  const verifyAdminKey = async (key) => {
    try {
      const response = await fetch(`${AUTH_VERIFY_ENDPOINT}?admin=${encodeURIComponent(key)}`, {
        method: 'POST'
      })
      const result = await response.json()

      if (response.ok && result.authenticated && result.token) {
        setAdminToken(result.token)
        sessionStorage.setItem('admin_token', result.token)
        setIsAdmin(true)
      } else {
        console.warn('Acceso denegado o clave incorrecta:', result.error)
        setIsAdmin(false)
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

    // Save to Go Backend with JWT Authorization header
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`
      }

      const response = await fetch(PORTFOLIO_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(newData)
      })

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

