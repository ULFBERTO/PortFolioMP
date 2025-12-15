import { createContext, useContext, useState, useEffect } from 'react'

const DataContext = createContext()

const API_URL = 'https://www.OxideBrowserBack.somee.com/api/portfolio'

export function DataProvider({ children }) {
  const [data, setData] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load data from API on mount
  useEffect(() => {
    fetchData()
  }, [])

  // Check admin access using environment variable
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const adminKey = params.get('admin')
    const envKey = import.meta.env.VITE_ADMIN_KEY
    if (adminKey && envKey && adminKey === envKey) {
      setIsAdmin(true)
    }
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch(API_URL)
      if (response.ok) {
        const apiData = await response.json()
        setData(apiData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateData = async (newData) => {
    setData({ ...newData })
    
    // Save to API
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      })
      if (!response.ok) {
        console.error('Failed to save to API')
      }
    } catch (error) {
      console.error('Error saving to API:', error)
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
