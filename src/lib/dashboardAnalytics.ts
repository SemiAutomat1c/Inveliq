export type AnalyticsEntry = {
  startTime: number
  durationMinutes: number
  billable: boolean
  hourlyRate: number
}

export type AnalyticsInvoice = {
  status: string
  total: number
}

export function buildDashboardAnalytics(entries: AnalyticsEntry[], invoices: AnalyticsInvoice[]) {
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.durationMinutes, 0)
  const billableMinutes = entries.reduce((sum, entry) => sum + (entry.billable ? entry.durationMinutes : 0), 0)
  const referenceTime = entries.reduce((latest, entry) => Math.max(latest, entry.startTime), 0) || Date.now()
  const end = new Date(referenceTime)
  const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))
  const startDay = new Date(endDay)
  startDay.setUTCDate(startDay.getUTCDate() - 6)

  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDay)
    date.setUTCDate(startDay.getUTCDate() + index)
    const key = date.toISOString().slice(0, 10)
    const dayEntries = entries.filter((entry) => new Date(entry.startTime).toISOString().slice(0, 10) === key)
    return {
      key,
      label: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      minutes: dayEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0),
      value: Math.round(dayEntries.reduce((sum, entry) => sum + (entry.billable ? (entry.durationMinutes / 60) * entry.hourlyRate : 0), 0) * 100) / 100,
    }
  })

  return {
    totalMinutes,
    billableRatio: totalMinutes === 0 ? 0 : Math.round((billableMinutes / totalMinutes) * 100),
    paidTotal: invoices.filter((invoice) => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.total, 0),
    trend,
  }
}
