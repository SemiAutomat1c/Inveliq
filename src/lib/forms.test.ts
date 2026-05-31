import { describe, expect, it } from 'vitest'
import {
  validateClientForm,
  validateInvoiceForm,
  validateProjectForm,
  validateTimeEntryForm,
} from './forms'

describe('form validation', () => {
  it('requires client name and email', () => {
    expect(validateClientForm({ name: '', email: '', defaultCurrency: 'USD' })).toEqual([
      'Client name is required.',
      'Client email is required.',
    ])
  })

  it('requires project name, client, and positive hourly rate', () => {
    expect(validateProjectForm({ name: '', clientId: '', hourlyRate: 0, currency: 'USD' })).toEqual([
      'Project name is required.',
      'Client is required.',
      'Hourly rate must be greater than 0.',
    ])
  })

  it('requires a valid manual time range', () => {
    expect(validateTimeEntryForm({
      projectId: '',
      description: '',
      startTime: 200,
      endTime: 100,
    })).toEqual([
      'Project is required.',
      'Work description is required.',
      'End time must be after start time.',
    ])
  })

  it('requires invoice entries and due date after issue date', () => {
    expect(validateInvoiceForm({
      clientId: '',
      timeEntryIds: [],
      issueDate: '2026-05-30',
      dueDate: '2026-05-29',
    })).toEqual([
      'Client is required.',
      'Select at least one billable entry.',
      'Due date must be on or after issue date.',
    ])
  })
})
