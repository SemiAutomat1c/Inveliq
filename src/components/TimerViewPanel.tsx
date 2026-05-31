import { useMemo, useState } from 'react'
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react'
import { CalendarBlock } from './CalendarBlock'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Table } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { formatMoney } from '../lib/money'
import { formatElapsedDuration, formatTimeRange } from '../lib/timeFormat'

export type TimerViewMode = 'day' | 'calendar' | 'list' | 'timesheet'

export type TimerEntry = {
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

type TimerProject = {
  _id: string
  name: string
}

type TimerViewPanelProps = {
  entries: TimerEntry[]
  projects: TimerProject[]
  totalHours: number
  emptyLabel?: string
  onAddEntry?: () => void
  onEditEntry?: (entry: TimerEntry) => void
  onDeleteEntry?: (entryId: string) => void
  isWorking?: boolean
}

export function TimerViewPanel({
  entries,
  projects,
  totalHours,
  emptyLabel = 'No tracked work yet.',
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  isWorking = false,
}: TimerViewPanelProps) {
  const [timerView, setTimerView] = useState<TimerViewMode>('day')
  const weekTotal = formatElapsedDuration(totalHours * 3_600_000)

  return (
    <Tabs value={timerView} onValueChange={(value) => setTimerView(value as TimerViewMode)} className="timer-view-panel">
      <div className="timer-toolbar">
        <Button variant="outline" size="sm" disabled title="Date selector coming next">
          <CalendarDays size={15} />
          Today · Sat
        </Button>
        <span className="week-total">Week total {weekTotal}</span>
        <TabsList className="tabs-list view-tabs" aria-label="Timer view">
          <TabsTrigger value="day" onClick={() => setTimerView('day')}>Day view</TabsTrigger>
          <TabsTrigger value="calendar" onClick={() => setTimerView('calendar')}>Calendar</TabsTrigger>
          <TabsTrigger value="list" onClick={() => setTimerView('list')}>List view</TabsTrigger>
          <TabsTrigger value="timesheet" onClick={() => setTimerView('timesheet')}>Timesheet</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="day">
        <DayTimerView
          entries={entries}
          emptyLabel={emptyLabel}
          totalDuration={weekTotal}
          onAddEntry={onAddEntry}
          onEditEntry={onEditEntry}
          onDeleteEntry={onDeleteEntry}
          isWorking={isWorking}
        />
      </TabsContent>
      <TabsContent value="calendar">
        <CalendarTimerView entries={entries} emptyLabel={emptyLabel} />
      </TabsContent>
      <TabsContent value="list">
        <ListTimerView
          entries={entries}
          emptyLabel={emptyLabel}
          onEditEntry={onEditEntry}
          onDeleteEntry={onDeleteEntry}
          isWorking={isWorking}
        />
      </TabsContent>
      <TabsContent value="timesheet">
        <TimesheetTimerView entries={entries} projects={projects} emptyLabel={emptyLabel} />
      </TabsContent>
    </Tabs>
  )
}

function DayTimerView({
  entries,
  emptyLabel,
  totalDuration,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  isWorking,
}: {
  entries: TimerEntry[]
  emptyLabel: string
  totalDuration: string
  onAddEntry?: () => void
  onEditEntry?: (entry: TimerEntry) => void
  onDeleteEntry?: (entryId: string) => void
  isWorking: boolean
}) {
  return (
    <>
      <div className="day-heading">
        <div>
          <Button variant="ghost" size="sm" onClick={onAddEntry} disabled={!onAddEntry || isWorking} title="Add manual entry">
            <Plus size={16} />
          </Button>
          <strong>30</strong>
          <span>Saturday</span>
        </div>
        <small>{totalDuration}</small>
      </div>
      <section aria-label="Daily entries">
        <h2 className="view-heading">Daily entries</h2>
        <TimerEntryList
          entries={entries}
          emptyLabel={emptyLabel}
          onEditEntry={onEditEntry}
          onDeleteEntry={onDeleteEntry}
          isWorking={isWorking}
        />
      </section>
    </>
  )
}

function CalendarTimerView({ entries, emptyLabel }: { entries: TimerEntry[]; emptyLabel: string }) {
  return (
    <section className="timer-view-content" aria-label="Calendar summary">
      <h2 className="view-heading">Calendar summary</h2>
      {entries.length === 0 ? (
        <p className="empty-state">{emptyLabel}</p>
      ) : (
        <CalendarBlock entries={entries} compact defaultView="month" />
      )}
    </section>
  )
}

function ListTimerView({
  entries,
  emptyLabel,
  onEditEntry,
  onDeleteEntry,
  isWorking,
}: {
  entries: TimerEntry[]
  emptyLabel: string
  onEditEntry?: (entry: TimerEntry) => void
  onDeleteEntry?: (entryId: string) => void
  isWorking: boolean
}) {
  return (
    <section className="timer-view-content" aria-label="Tracked entries">
      <h2 className="view-heading">Tracked entries</h2>
      {entries.length === 0 ? (
        <p className="empty-state">{emptyLabel}</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Time</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry._id}>
                <td>{entry.description}</td>
                <td>{formatTimeRange(entry.startTime, entry.endTime)}</td>
                <td>
                  <Badge variant={entry.invoiceId ? 'success' : entry.billable ? 'default' : 'muted'}>
                    {entry.invoiceId ? 'Invoiced' : entry.billable ? 'Billable' : 'Internal'}
                  </Badge>
                </td>
                <td>{formatElapsedDuration(entry.durationMinutes * 60_000)}</td>
                <td>
                  <EntryActions
                    entry={entry}
                    onEditEntry={onEditEntry}
                    onDeleteEntry={onDeleteEntry}
                    isWorking={isWorking}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </section>
  )
}

function TimesheetTimerView({
  entries,
  projects,
  emptyLabel,
}: {
  entries: TimerEntry[]
  projects: TimerProject[]
  emptyLabel: string
}) {
  const rows = useMemo(() => groupEntriesForTimesheet(entries, projects), [entries, projects])

  return (
    <section className="timer-view-content" aria-label="Timesheet summary">
      <h2 className="view-heading">Timesheet summary</h2>
      {rows.length === 0 ? (
        <p className="empty-state">{emptyLabel}</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Work</th>
              <th>Hours</th>
              <th>Billable</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.projectName}-${row.description}`}>
                <td>{row.projectName}</td>
                <td>{row.description}</td>
                <td>{(row.durationMinutes / 60).toFixed(2)}h</td>
                <td>{formatMoney(row.billableValue)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </section>
  )
}

function TimerEntryList({
  entries,
  emptyLabel,
  onEditEntry,
  onDeleteEntry,
  isWorking,
}: {
  entries: TimerEntry[]
  emptyLabel: string
  onEditEntry?: (entry: TimerEntry) => void
  onDeleteEntry?: (entryId: string) => void
  isWorking: boolean
}) {
  if (entries.length === 0) {
    return <p className="empty-state">{emptyLabel}</p>
  }

  return (
    <div className="time-list">
      {entries.map((entry) => (
        <article className="time-row" key={entry._id}>
          <div className="time-row__status">
            <span />
          </div>
          <div>
            <strong>{entry.description}</strong>
            <p>{formatTimeRange(entry.startTime, entry.endTime)} · {entry.billable ? 'Billable' : 'Internal'}</p>
          </div>
          <Badge variant={entry.invoiceId ? 'success' : 'muted'}>{entry.invoiceId ? 'Invoiced' : 'Open'}</Badge>
          <span className="row-duration">{formatElapsedDuration(entry.durationMinutes * 60_000)}</span>
          <EntryActions
            entry={entry}
            onEditEntry={onEditEntry}
            onDeleteEntry={onDeleteEntry}
            isWorking={isWorking}
          />
        </article>
      ))}
    </div>
  )
}

function EntryActions({
  entry,
  onEditEntry,
  onDeleteEntry,
  isWorking,
}: {
  entry: TimerEntry
  onEditEntry?: (entry: TimerEntry) => void
  onDeleteEntry?: (entryId: string) => void
  isWorking: boolean
}) {
  if (entry.invoiceId || (!onEditEntry && !onDeleteEntry)) return <span className="entry-actions entry-actions--empty">—</span>

  return (
    <div className="entry-actions">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEditEntry?.(entry)}
        disabled={isWorking || !onEditEntry}
        aria-label={`Edit ${entry.description}`}
      >
        <Pencil size={14} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDeleteEntry?.(entry._id)}
        disabled={isWorking || !onDeleteEntry}
        aria-label={`Delete ${entry.description}`}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  )
}

function groupEntriesForTimesheet(entries: TimerEntry[], projects: TimerProject[]) {
  const projectNames = new Map(projects.map((project) => [project._id, project.name]))
  const rows = new Map<string, { projectName: string; description: string; durationMinutes: number; billableValue: number }>()

  for (const entry of entries) {
    const projectName = projectNames.get(entry.projectId) ?? 'Unknown project'
    const key = `${entry.projectId}:${entry.description}`
    const row = rows.get(key) ?? { projectName, description: entry.description, durationMinutes: 0, billableValue: 0 }
    row.durationMinutes += entry.durationMinutes
    if (entry.billable && !entry.invoiceId) {
      row.billableValue += (entry.durationMinutes / 60) * entry.hourlyRate
    }
    rows.set(key, row)
  }

  return [...rows.values()].sort((a, b) => b.durationMinutes - a.durationMinutes)
}
