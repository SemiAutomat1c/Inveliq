import { Badge } from './ui/badge'
import { buildWeekDays, type CalendarEntry } from '../lib/calendarWeek'
import { formatMoney } from '../lib/money'
import { formatElapsedDuration, formatTimeRange } from '../lib/timeFormat'

type CalendarWeekProps = {
  entries: CalendarEntry[]
  referenceDate?: Date
  compact?: boolean
}

export function CalendarWeek({ entries, referenceDate = new Date(), compact }: CalendarWeekProps) {
  const days = buildWeekDays(entries, referenceDate)

  return (
    <div className={compact ? 'calendar-week calendar-week--compact' : 'calendar-week'}>
      {days.map((day) => (
        <section className="calendar-week-day" key={day.key} aria-label={`${day.weekday} ${day.dayNumber}`}>
          <header>
            <div>
              <span>{day.weekday}</span>
              <strong>{day.dayNumber}</strong>
            </div>
            <Badge variant={day.entries.length > 0 ? 'default' : 'muted'}>
              {formatElapsedDuration(day.durationMinutes * 60_000)}
            </Badge>
          </header>
          <p className="calendar-week-day__value">Billable {formatMoney(day.billableValue)}</p>
          <div className="calendar-entry-stack">
            {day.entries.length === 0 ? (
              <p className="calendar-empty">No tracked work</p>
            ) : (
              day.entries.map((entry) => (
                <article className="calendar-entry" key={entry._id}>
                  <strong>{entry.description}</strong>
                  <span>{formatTimeRange(entry.startTime, entry.endTime)}</span>
                  <em>{entry.billable ? 'Billable' : 'Internal'}</em>
                </article>
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
