// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { CalendarBlock } from './CalendarBlock'
import { buildMonthDays } from '../lib/calendarWeek'

const entries = [
  {
    _id: 'entry-1',
    projectId: 'project-1',
    startTime: Date.UTC(2026, 4, 31, 9, 0),
    endTime: Date.UTC(2026, 4, 31, 10, 0),
    durationMinutes: 60,
    description: 'Event Conf.',
    billable: true,
    hourlyRate: 80,
  },
  {
    _id: 'entry-2',
    projectId: 'project-1',
    startTime: Date.UTC(2026, 5, 1, 11, 0),
    endTime: Date.UTC(2026, 5, 1, 12, 0),
    durationMinutes: 60,
    description: 'Meeting',
    billable: false,
    hourlyRate: 80,
  },
]

afterEach(cleanup)

describe('CalendarBlock', () => {
  it('builds a six-week Sunday-start month grid', () => {
    const days = buildMonthDays(entries, new Date(Date.UTC(2026, 4, 12)))

    expect(days).toHaveLength(42)
    expect(days[0].dayNumber).toBe('26')
    expect(days[0].isCurrentMonth).toBe(false)
    expect(days[5].dayNumber).toBe('1')
    expect(days[5].isCurrentMonth).toBe(true)
    expect(days[35].dayNumber).toBe('31')
    expect(days[35].entries[0].description).toBe('Event Conf.')
  })

  it('renders the month calendar block and day view', () => {
    render(<CalendarBlock entries={entries} referenceDate={new Date(Date.UTC(2026, 4, 12))} />)

    expect(screen.getByText('May 2026')).toBeInTheDocument()
    expect(screen.getByText('Event Conf.')).toBeInTheDocument()
  })

  it('renders an empty day agenda view', () => {
    render(<CalendarBlock entries={entries} referenceDate={new Date(Date.UTC(2026, 4, 12))} defaultView="day" />)

    expect(screen.getByText('No tracked work for this day.')).toBeInTheDocument()
  })

  it('moves the month view with the period controls', () => {
    render(<CalendarBlock entries={[]} referenceDate={new Date(Date.UTC(2026, 4, 31))} />)

    expect(screen.getByText('May 2026')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Previous period' }))
    expect(screen.getByText('April 2026')).toBeInTheDocument()
  })
})
