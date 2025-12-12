import { createContext, useContext, useState, useEffect } from 'react'
import initialData from '../data/portfolioData.json'

const DataContext = createContext()

const API_URL = 'https://www.OxideBrowserBack.somee.com/api/portfolio'

export function DataProvider({ children }) {
  const [data, setData] = useState(initialData)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load data from API on mount
  useEffect(() => {
    fetchData()
  }, [])

  // Check admin access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const adminKey = params.get('admin')
    if (adminKey && adminKey === data.adminKey) {
      setIsAdmin(true)
    }
  }, [data.adminKey])

  const fetchData = async () => {
    try {
      const response = await fetch(API_URL)
      if (response.ok) {
        const apiData = await response.json()
        setData(apiData)
      }
    } catch (error) {
      console.warn('Could not fetch from API, using local data:', error)
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
