import { describe, expect, it } from 'vitest'
import { formatElapsedDuration } from './timeFormat'

describe('time display formatting', () => {
  it('formats elapsed milliseconds as a timer clock', () => {
    expect(formatElapsedDuration(3_723_000)).toBe('1:02:03')
  })

  it('never displays negative elapsed time', () => {
    expect(formatElapsedDuration(-10_000)).toBe('0:00:00')
  })
})
