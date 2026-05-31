import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { buildMonthDays, buildWeekDays, formatCalendarMonth, type CalendarEntry } from '../lib/calendarWeek'
import { formatMoney } from '../lib/money'
import { formatElapsedDuration, formatTimeRange } from '../lib/timeFormat'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

type CalendarBlockView = 'month' | 'week' | 'day' | 'year'

type CalendarBlockProps = {
  entries: CalendarEntry[]
  referenceDate?: Date
  compact?: boolean
  defaultView?: CalendarBlockView
}

export function CalendarBlock({
  entries,
  referenceDate = newestEntryDate(entries) ?? new Date(),
  compact,
  defaultView = 'month',
}: CalendarBlockProps) {
  const [view, setView] = useState<CalendarBlockView>(defaultView)
  const [cursorDate, setCursorDate] = useState(referenceDate)
  const [selectedDayKey, setSelectedDayKey] = useState(() => referenceDate.toISOString().slice(0, 10))
  const monthDays = useMemo(() => buildMonthDays(entries, cursorDate), [cursorDate, entries])
  const weekDays = useMemo(() => buildWeekDays(entries, cursorDate), [cursorDate, entries])
  const activeDay = monthDays.find((day) => day.key === selectedDayKey) ?? monthDays[0]
  const monthTotal = monthDays
    .filter((day) => day.isCurrentMonth)
    .reduce((sum, day) => sum + day.durationMinutes, 0)
  const readyValue = monthDays
    .filter((day) => day.isCurrentMonth)
    .reduce((sum, day) => sum + day.billableValue, 0)
  const movePeriod = (direction: -1 | 1) => {
    setCursorDate((current) => {
      const next = new Date(current)

      if (view === 'year') next.setUTCFullYear(next.getUTCFullYear() + direction)
      else if (view === 'month') {
        next.setUTCDate(1)
        next.setUTCMonth(next.getUTCMonth() + direction)
      }
      else if (view === 'week') next.setUTCDate(next.getUTCDate() + (direction * 7))
      else next.setUTCDate(next.getUTCDate() + direction)

      setSelectedDayKey(next.toISOString().slice(0, 10))
      return next
    })
  }

  return (
    <section className={compact ? 'calendar-block calendar-block--compact' : 'calendar-block'} aria-label="Work calendar">
      <Tabs value={view} onValueChange={(value) => setView(value as CalendarBlockView)}>
        <header className="calendar-block__header">
          <div className="calendar-block__actions">
            <Button variant="outline" size="sm" aria-label="Previous period" onClick={() => movePeriod(-1)}>
              <ChevronLeft size={15} />
            </Button>
            <Button variant="outline" size="sm" aria-label="Next period" onClick={() => movePeriod(1)}>
              <ChevronRight size={15} />
            </Button>
            {!compact && (
              <Button size="sm" disabled>
                <Plus size={15} />
                Add entry
              </Button>
            )}
          </div>
          <div className="calendar-block__title">
            <strong>{formatCalendarMonth(cursorDate)}</strong>
            <span>{formatElapsedDuration(monthTotal * 60_000)} tracked · {formatMoney(readyValue)} ready</span>
          </div>
          <TabsList className="tabs-list calendar-block__tabs" aria-label="Calendar view">
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </header>

        <TabsContent value="month">
          <MonthGrid days={monthDays} compact={compact} selectedDayKey={selectedDayKey} onSelectDay={setSelectedDayKey} />
          {!compact && view === 'month' && <DayAgenda day={activeDay} />}
        </TabsContent>
        <TabsContent value="week">
          <WeekGrid days={weekDays} />
        </TabsContent>
        <TabsContent value="day">
          <DayAgenda day={activeDay} />
        </TabsContent>
        <TabsContent value="year">
          <YearSummary entries={entries} referenceDate={cursorDate} />
        </TabsContent>
      </Tabs>
    </section>
  )
}

function MonthGrid({
  days,
  compact,
  selectedDayKey,
  onSelectDay,
}: {
  days: ReturnType<typeof buildMonthDays>
  compact?: boolean
  selectedDayKey: string
  onSelectDay: (key: string) => void
}) {
  return (
    <div className="calendar-month-grid">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
        <div className="calendar-month-weekday" key={weekday}>{weekday}</div>
      ))}
      {days.map((day) => (
        <button
          type="button"
          className={`${day.isCurrentMonth ? 'calendar-month-cell' : 'calendar-month-cell calendar-month-cell--muted'}${day.key === selectedDayKey ? ' calendar-month-cell--selected' : ''}`}
          key={day.key}
          aria-label={`${day.monthLabel} ${day.dayNumber}`}
          onClick={() => onSelectDay(day.key)}
        >
          <header>
            <span>{day.dayNumber}</span>
            {day.durationMinutes > 0 && (
              <Badge variant="muted">{formatElapsedDuration(day.durationMinutes * 60_000)}</Badge>
            )}
          </header>
          <div className="calendar-month-events">
            {day.entries.slice(0, compact ? 2 : 3).map((entry) => (
              <div className={entry.billable ? 'month-event month-event--billable' : 'month-event'} key={entry._id}>
                <span>{entry.description}</span>
              </div>
            ))}
            {day.entries.length > (compact ? 2 : 3) && (
              <em>{day.entries.length - (compact ? 2 : 3)} more</em>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

function WeekGrid({ days }: { days: ReturnType<typeof buildWeekDays> }) {
  return (
    <div className="calendar-block-week">
      {days.map((day) => (
        <article className="calendar-block-week-day" key={day.key}>
          <header>
            <span>{day.weekday}</span>
            <strong>{day.dayNumber}</strong>
          </header>
          <p>{formatElapsedDuration(day.durationMinutes * 60_000)} · {formatMoney(day.billableValue)}</p>
          {day.entries.length === 0 ? (
            <em>No tracked work</em>
          ) : day.entries.map((entry) => (
            <div className="month-event" key={entry._id}>{entry.description}</div>
          ))}
        </article>
      ))}
    </div>
  )
}

function DayAgenda({ day }: { day: ReturnType<typeof buildMonthDays>[number] }) {
  return (
    <div className="calendar-day-agenda">
      <header>
        <span>{day.weekday}</span>
        <strong>{day.monthLabel} {day.dayNumber}</strong>
      </header>
      {day.entries.length === 0 ? (
        <p className="empty-state">No tracked work for this day.</p>
      ) : day.entries.map((entry) => (
        <article className="calendar-agenda-entry" key={entry._id}>
          <strong>{entry.description}</strong>
          <span>{formatTimeRange(entry.startTime, entry.endTime)}</span>
          <Badge variant={entry.billable ? 'default' : 'muted'}>{entry.billable ? 'Billable' : 'Internal'}</Badge>
        </article>
      ))}
    </div>
  )
}

function YearSummary({ entries, referenceDate }: { entries: CalendarEntry[]; referenceDate: Date }) {
  const rows = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthDate = new Date(Date.UTC(referenceDate.getUTCFullYear(), monthIndex, 1))
    const monthEntries = entries.filter((entry) => new Date(entry.startTime).getUTCMonth() === monthIndex)
    const minutes = monthEntries.reduce((sum, entry) => sum + entry.durationMinutes, 0)
    return {
      label: monthDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
      entries: monthEntries.length,
      minutes,
    }
  })

  return (
    <div className="calendar-year-summary">
      {rows.map((row) => (
        <article key={row.label}>
          <strong>{row.label}</strong>
          <span>{formatElapsedDuration(row.minutes * 60_000)}</span>
          <em>{row.entries} entries</em>
        </article>
      ))}
    </div>
  )
}

function newestEntryDate(entries: CalendarEntry[]) {
  const latest = entries.reduce<number | null>((newest, entry) => (
    newest === null || entry.startTime > newest ? entry.startTime : newest
  ), null)

  return latest === null ? null : new Date(latest)
}
