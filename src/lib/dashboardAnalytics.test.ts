import { describe, expect, it } from 'vitest'
import { buildDashboardAnalytics } from './dashboardAnalytics'

describe('buildDashboardAnalytics', () => {
  it('returns a stable empty weekly dashboard', () => {
    const result = buildDashboardAnalytics([], [])

    expect(result.totalMinutes).toBe(0)
    expect(result.billableRatio).toBe(0)
    expect(result.paidTotal).toBe(0)
    expect(result.trend).toHaveLength(7)
    expect(result.trend.every((day) => day.minutes === 0 && day.value === 0)).toBe(true)
  })

  it('summarizes tracked time, billable ratio, paid invoices, and daily value', () => {
    const reference = Date.UTC(2026, 4, 31, 12)
    const result = buildDashboardAnalytics([
      {
        startTime: reference,
        durationMinutes: 90,
        billable: true,
        hourlyRate: 100,
      },
      {
        startTime: reference,
        durationMinutes: 30,
        billable: false,
        hourlyRate: 100,
      },
    ], [
      { status: 'paid', total: 320 },
      { status: 'sent', total: 80 },
    ])

    expect(result.totalMinutes).toBe(120)
    expect(result.billableRatio).toBe(75)
    expect(result.paidTotal).toBe(320)
    expect(result.trend.at(-1)?.minutes).toBe(120)
    expect(result.trend.at(-1)?.value).toBe(150)
  })
})
