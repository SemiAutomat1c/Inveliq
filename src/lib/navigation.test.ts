import { describe, expect, it } from 'vitest'
import { appPages, defaultAppPage, getPageTitle, mobilePrimaryPages } from './navigation'

describe('app navigation', () => {
  it('defines every sidebar destination as a real page', () => {
    expect(appPages.map((page) => page.id)).toEqual([
      'overview',
      'timer',
      'calendar',
      'reports',
      'projects',
      'clients',
      'invoices',
      'settings',
    ])
  })

  it('groups pages into the expected workspace sections', () => {
    expect(appPages.filter((page) => page.section === 'track').map((page) => page.id)).toEqual([
      'overview',
      'timer',
      'calendar',
    ])
    expect(appPages.filter((page) => page.section === 'manage').map((page) => page.id)).toEqual([
      'projects',
      'clients',
      'invoices',
    ])
  })

  it('returns the selected page title for page headers', () => {
    expect(getPageTitle('invoices')).toBe('Invoices')
  })

  it('keeps Timer as the initial workspace while Overview leads navigation', () => {
    expect(appPages[0]?.id).toBe('overview')
    expect(defaultAppPage).toBe('timer')
  })

  it('exposes thumb-friendly mobile destinations and a More entry', () => {
    expect(mobilePrimaryPages).toEqual(['overview', 'timer', 'calendar', 'invoices', 'more'])
  })
})
