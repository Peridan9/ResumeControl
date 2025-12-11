import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Guard against SSR - check if we're in a browser environment
    if (typeof window === 'undefined') {
      return false // Default to light theme during SSR
    }

    // Check localStorage first, then system preference
    try {
      if (window.localStorage) {
        const stored = window.localStorage.getItem('theme')
        if (stored) {
          return stored === 'dark'
        }
      }
    } catch (e) {
      // localStorage may be unavailable due to permissions or other issues
      // Fall through to system preference check
    }

    // Check system preference if matchMedia is available
    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    // Default to light theme if all checks fail
    return false
  })

  // Apply theme on mount
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const toggleTheme = () => {
    setIsDark((prev) => {
      const newValue = !prev
      // Apply theme immediately, synchronously
      if (newValue) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      return newValue
    })
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

