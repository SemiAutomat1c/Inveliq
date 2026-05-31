export type ClientFormInput = {
  name: string
  email: string
  defaultCurrency: string
}

export type ProjectFormInput = {
  name: string
  clientId: string
  hourlyRate: number
  currency: string
}

export type TimeEntryFormInput = {
  projectId: string
  description: string
  startTime: number
  endTime: number
}

export type InvoiceFormInput = {
  clientId: string
  timeEntryIds: string[]
  issueDate: string
  dueDate: string
}

export function validateClientForm(input: ClientFormInput) {
  const errors: string[] = []
  if (!input.name.trim()) errors.push('Client name is required.')
  if (!input.email.trim()) errors.push('Client email is required.')
  if (!input.defaultCurrency.trim()) errors.push('Currency is required.')
  return errors
}

export function validateProjectForm(input: ProjectFormInput) {
  const errors: string[] = []
  if (!input.name.trim()) errors.push('Project name is required.')
  if (!input.clientId.trim()) errors.push('Client is required.')
  if (!Number.isFinite(input.hourlyRate) || input.hourlyRate <= 0) {
    errors.push('Hourly rate must be greater than 0.')
  }
  if (!input.currency.trim()) errors.push('Currency is required.')
  return errors
}

export function validateTimeEntryForm(input: TimeEntryFormInput) {
  const errors: string[] = []
  if (!input.projectId.trim()) errors.push('Project is required.')
  if (!input.description.trim()) errors.push('Work description is required.')
  if (input.endTime <= input.startTime) errors.push('End time must be after start time.')
  return errors
}

export function validateInvoiceForm(input: InvoiceFormInput) {
  const errors: string[] = []
  if (!input.clientId.trim()) errors.push('Client is required.')
  if (input.timeEntryIds.length === 0) errors.push('Select at least one billable entry.')
  if (input.issueDate && input.dueDate && input.dueDate < input.issueDate) {
    errors.push('Due date must be on or after issue date.')
  }
  return errors
}
