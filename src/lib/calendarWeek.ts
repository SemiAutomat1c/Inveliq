export type CalendarEntry = {
  _id: string
  projectId: string
  startTime: number
  endTime: number
  durationMinutes: number
  description: string
  billable: boolean
  hourlyRate: number
  invoiceId?: string
}

export type CalendarWeekDay = {
  key: string
  date: Date
  weekday: string
  dayNumber: string
  monthLabel: string
  isCurrentMonth: boolean
  entries: CalendarEntry[]
  durationMinutes: number
  billableValue: number
}

export function buildWeekDays(entries: CalendarEntry[], referenceDate = new Date()): CalendarWeekDay[] {
  const start = startOfWeekMonday(referenceDate)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    const dayEntries = entries
      .filter((entry) => isSameUtcDay(new Date(entry.startTime), date))
      .sort((a, b) => a.startTime - b.startTime)
    const durationMinutes = dayEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0)
    const billableValue = dayEntries.reduce(
      (sum, entry) => sum + (entry.billable && !entry.invoiceId ? (entry.durationMinutes / 60) * entry.hourlyRate : 0),
      0,
    )

    return {
      key: date.toISOString().slice(0, 10),
      date,
      weekday: date.toLocaleDateString([], { weekday: 'short', timeZone: 'UTC' }),
      dayNumber: date.toLocaleDateString([], { day: '2-digit', timeZone: 'UTC' }),
      monthLabel: date.toLocaleDateString([], { month: 'short', timeZone: 'UTC' }),
      isCurrentMonth: date.getUTCMonth() === referenceDate.getUTCMonth(),
      entries: dayEntries,
      durationMinutes,
      billableValue: Math.round(billableValue * 100) / 100,
    }
  })
}

export function buildMonthDays(entries: CalendarEntry[], referenceDate = new Date()): CalendarWeekDay[] {
  const monthStart = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1))
  const gridStart = startOfWeekSunday(monthStart)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setUTCDate(gridStart.getUTCDate() + index)
    const dayEntries = entries
      .filter((entry) => isSameUtcDay(new Date(entry.startTime), date))
      .sort((a, b) => a.startTime - b.startTime)
    const durationMinutes = dayEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0)
    const billableValue = dayEntries.reduce(
      (sum, entry) => sum + (entry.billable && !entry.invoiceId ? (entry.durationMinutes / 60) * entry.hourlyRate : 0),
      0,
    )

    return {
      key: date.toISOString().slice(0, 10),
      date,
      weekday: date.toLocaleDateString([], { weekday: 'short', timeZone: 'UTC' }),
      dayNumber: date.toLocaleDateString([], { day: 'numeric', timeZone: 'UTC' }),
      monthLabel: date.toLocaleDateString([], { month: 'short', timeZone: 'UTC' }),
      isCurrentMonth: date.getUTCMonth() === referenceDate.getUTCMonth(),
      entries: dayEntries,
      durationMinutes,
      billableValue: Math.round(billableValue * 100) / 100,
    }
  })
}

export function formatCalendarMonth(referenceDate = new Date()) {
  return referenceDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function startOfWeekMonday(date: Date) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = copy.getUTCDay()
  const offset = day === 0 ? -6 : 1 - day
  copy.setUTCDate(copy.getUTCDate() + offset)
  return copy
}

function startOfWeekSunday(date: Date) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  copy.setUTCDate(copy.getUTCDate() - copy.getUTCDay())
  return copy
}

function isSameUtcDay(left: Date, right: Date) {
  return (
    left.getUTCFullYear() === right.getUTCFullYear()
    && left.getUTCMonth() === right.getUTCMonth()
    && left.getUTCDate() === right.getUTCDate()
  )
}
