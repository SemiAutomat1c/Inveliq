// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { TimerViewPanel } from './TimerViewPanel'

const entries = [
  {
    _id: 'entry-1',
    projectId: 'project-1',
    startTime: Date.UTC(2026, 4, 30, 9, 0),
    endTime: Date.UTC(2026, 4, 30, 10, 30),
    durationMinutes: 90,
    description: 'Map polish',
    billable: true,
    hourlyRate: 80,
  },
  {
    _id: 'entry-2',
    projectId: 'project-1',
    startTime: Date.UTC(2026, 4, 30, 11, 0),
    endTime: Date.UTC(2026, 4, 30, 12, 0),
    durationMinutes: 60,
    description: 'Invoice QA',
    billable: false,
    hourlyRate: 80,
    invoiceId: 'invoice-1',
  },
]

const projects = [
  {
    _id: 'project-1',
    name: 'The Couve',
  },
]

afterEach(() => {
  cleanup()
})

describe('TimerViewPanel', () => {
  it('renders every timer view tab and defaults to day view', () => {
    render(<TimerViewPanel entries={entries} projects={projects} totalHours={2.5} />)

    expect(screen.getByRole('tab', { name: 'Day view' })).toHaveAttribute('data-state', 'active')
    expect(screen.getByRole('tab', { name: 'Calendar' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'List view' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Timesheet' })).toBeInTheDocument()
    expect(screen.getByText('Daily entries')).toBeInTheDocument()
  })

  it('switches visible timer content when each tab is clicked', () => {
    render(<TimerViewPanel entries={entries} projects={projects} totalHours={2.5} />)

    selectTab('Calendar')
    expect(screen.getByText('Calendar summary')).toBeInTheDocument()
    expect(screen.queryByText('Daily entries')).not.toBeInTheDocument()

    selectTab('List view')
    expect(screen.getByText('Tracked entries')).toBeInTheDocument()
    expect(screen.queryByText('Calendar summary')).not.toBeInTheDocument()

    selectTab('Timesheet')
    expect(screen.getByText('Timesheet summary')).toBeInTheDocument()
    expect(screen.getAllByText('The Couve')).toHaveLength(2)
  })
})

function selectTab(name: string) {
  const tab = screen.getByRole('tab', { name })
  fireEvent.pointerDown(tab, { button: 0, ctrlKey: false })
  fireEvent.pointerUp(tab, { button: 0, ctrlKey: false })
  fireEvent.click(tab)
}
