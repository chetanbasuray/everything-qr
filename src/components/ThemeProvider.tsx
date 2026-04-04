import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

type ThemeContextValue = {
  theme: ThemeMode
  setTheme: (next: ThemeMode) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>('system')

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('qrstudio-theme')
    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
      setTheme(storedTheme)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = (next: ThemeMode) => {
      if (next === 'system') {
        root.dataset.theme = prefersDark.matches ? 'dark' : 'light'
      } else {
        root.dataset.theme = next
      }
    }

    applyTheme(theme)
    window.localStorage.setItem('qrstudio-theme', theme)

    const listener = (event: MediaQueryListEvent) => {
      if (theme === 'system') {
        root.dataset.theme = event.matches ? 'dark' : 'light'
      }
    }

    prefersDark.addEventListener('change', listener)
    return () => prefersDark.removeEventListener('change', listener)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      cycleTheme: () =>
        setTheme((prev) =>
          prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'
        ),
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export { ThemeProvider, useTheme }
