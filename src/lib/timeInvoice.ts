import { formatMoney, type CurrencyCode } from './money'

export type { CurrencyCode }
export { formatMoney }

export type BillableEntry = {
  id: string
  description: string
  durationMinutes: number
  hourlyRate: number
  billable: boolean
  invoiceId?: string | null
}

export type InvoiceLineItem = {
  description: string
  sourceTimeEntryIds: string[]
  quantityHours: number
  rate: number
  amount: number
}

export type InvoiceDraftInput = {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  clientName: string
  currency: CurrencyCode
  entries: BillableEntry[]
  tax?: number
  discount?: number
}

export type InvoiceDraft = {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  clientName: string
  currency: CurrencyCode
  lineItems: InvoiceLineItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
}

export function calculateDurationMinutes(startTime: number, endTime: number) {
  if (endTime < startTime) {
    throw new Error('End time must be after start time')
  }

  return Math.max(1, Math.round((endTime - startTime) / 60_000))
}

export function buildInvoiceDraft(input: InvoiceDraftInput): InvoiceDraft {
  const lineItems = input.entries
    .filter((entry) => entry.billable)
    .map((entry) => {
      if (entry.invoiceId) {
        throw new Error(`Entry ${entry.id} is already invoiced`)
      }

      const quantityHours = roundCurrency(entry.durationMinutes / 60)
      const amount = roundCurrency(quantityHours * entry.hourlyRate)

      return {
        description: entry.description,
        sourceTimeEntryIds: [entry.id],
        quantityHours,
        rate: entry.hourlyRate,
        amount,
      }
    })

  const subtotal = roundCurrency(lineItems.reduce((sum, item) => sum + item.amount, 0))
  const tax = roundCurrency(input.tax ?? 0)
  const discount = roundCurrency(input.discount ?? 0)

  return {
    invoiceNumber: input.invoiceNumber,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    clientName: input.clientName,
    currency: input.currency,
    lineItems,
    subtotal,
    tax,
    discount,
    total: roundCurrency(subtotal + tax - discount),
  }
}

export function createEmailDraft(input: {
  invoiceNumber: string
  clientName: string
  total: number
  currency: CurrencyCode
  dueDate: string
  senderName: string
}) {
  return {
    subject: `Invoice ${input.invoiceNumber} from Inveliq`,
    body: [
      `Hi ${input.clientName},`,
      '',
      `Invoice ${input.invoiceNumber} is ready for the tracked work.`,
      '',
      `Total: ${formatMoney(input.total, input.currency)}`,
      `Due: ${formatDisplayDate(input.dueDate)}`,
      '',
      'Thanks,',
      input.senderName,
    ].join('\n'),
  }
}

function formatDisplayDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}
