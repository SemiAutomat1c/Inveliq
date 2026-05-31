export type ThemePreference = 'dark' | 'light'
export type ResolvedTheme = 'dark' | 'light'

export const themeStorageKey = 'inveliq-theme'

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference
}

export function toggleTheme(preference: ThemePreference): ThemePreference {
  if (preference === 'dark') return 'light'
  return 'dark'
}

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'dark' || value === 'light'
}
