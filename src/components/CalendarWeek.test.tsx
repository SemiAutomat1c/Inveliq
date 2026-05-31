// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, expect, it } from 'vitest'
import { CalendarWeek } from './CalendarWeek'
import { buildWeekDays } from '../lib/calendarWeek'

const entries = [
  {
    _id: 'entry-1',
    projectId: 'project-1',
    startTime: Date.UTC(2026, 4, 25, 9, 0),
    endTime: Date.UTC(2026, 4, 25, 10, 30),
    durationMinutes: 90,
    description: 'Calendar planning',
    billable: true,
    hourlyRate: 80,
  },
  {
    _id: 'entry-2',
    projectId: 'project-1',
    startTime: Date.UTC(2026, 4, 27, 11, 0),
    endTime: Date.UTC(2026, 4, 27, 12, 0),
    durationMinutes: 60,
    description: 'Invoice QA',
    billable: false,
    hourlyRate: 80,
  },
]

describe('CalendarWeek', () => {
  it('builds a Monday-start week with daily duration and billable totals', () => {
    const days = buildWeekDays(entries, new Date(Date.UTC(2026, 4, 27)))

    expect(days).toHaveLength(7)
    expect(days[0].weekday).toBe('Mon')
    expect(days[0].durationMinutes).toBe(90)
    expect(days[0].billableValue).toBe(120)
    expect(days[2].weekday).toBe('Wed')
    expect(days[2].durationMinutes).toBe(60)
    expect(days[2].billableValue).toBe(0)
  })

  it('renders empty days and entry blocks in the week grid', () => {
    render(<CalendarWeek entries={entries} referenceDate={new Date(Date.UTC(2026, 4, 27))} />)

    expect(screen.getByText('Calendar planning')).toBeInTheDocument()
    expect(screen.getByText('Invoice QA')).toBeInTheDocument()
    expect(screen.getAllByText('No tracked work')).toHaveLength(5)
  })
})
