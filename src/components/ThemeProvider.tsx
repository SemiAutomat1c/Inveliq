import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  isThemePreference,
  themeStorageKey,
  toggleTheme,
  type ThemePreference,
} from '../lib/theme'
import { ThemeContext } from './theme-context'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = window.localStorage.getItem(themeStorageKey)
    return isThemePreference(stored) ? stored : 'dark'
  })

  const resolvedTheme = preference

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  function setPreference(nextPreference: ThemePreference) {
    window.localStorage.setItem(themeStorageKey, nextPreference)
    setPreferenceState(nextPreference)
  }

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
      togglePreference: () => setPreference(toggleTheme(preference)),
    }),
    [preference, resolvedTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
