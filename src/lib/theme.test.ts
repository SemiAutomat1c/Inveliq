import { describe, expect, it } from 'vitest'
import { resolveTheme, toggleTheme, type ThemePreference } from './theme'

describe('theme preference', () => {
  it('respects explicit light and dark preferences', () => {
    expect(resolveTheme('dark')).toBe('dark')
    expect(resolveTheme('light')).toBe('light')
  })

  it('toggles only between light and dark modes', () => {
    const sequence: ThemePreference[] = ['dark', 'light', 'dark']
    expect(sequence.map(toggleTheme)).toEqual(['light', 'dark', 'light'])
  })
})
