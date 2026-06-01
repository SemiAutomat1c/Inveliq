import { describe, expect, it } from 'vitest'
import { normalizeConvexUrl } from './convexUrl'

describe('normalizeConvexUrl', () => {
  it('removes trailing slashes from the Convex origin', () => {
    expect(normalizeConvexUrl('https://judicious-boar-808.convex.cloud/')).toBe(
      'https://judicious-boar-808.convex.cloud',
    )
    expect(normalizeConvexUrl('https://judicious-boar-808.convex.cloud///')).toBe(
      'https://judicious-boar-808.convex.cloud',
    )
  })

  it('keeps already-clean Convex origins unchanged', () => {
    expect(normalizeConvexUrl('https://judicious-boar-808.convex.cloud')).toBe(
      'https://judicious-boar-808.convex.cloud',
    )
  })
})
