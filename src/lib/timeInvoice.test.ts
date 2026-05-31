import { describe, expect, it } from 'vitest'
import {
  buildInvoiceDraft,
  calculateDurationMinutes,
  createEmailDraft,
  formatMoney,
} from './timeInvoice'

describe('time and invoice rules', () => {
  it('calculates rounded timer duration in minutes', () => {
    expect(
      calculateDurationMinutes(
        new Date('2026-05-30T09:15:00.000Z').getTime(),
        new Date('2026-05-30T11:44:30.000Z').getTime(),
      ),
    ).toBe(150)
  })

  it('keeps very short timers billable as one minute', () => {
    expect(
      calculateDurationMinutes(
        new Date('2026-05-30T09:15:00.000Z').getTime(),
        new Date('2026-05-30T09:15:12.000Z').getTime(),
      ),
    ).toBe(1)
  })

  it('builds an invoice from uninvoiced billable entries', () => {
    const invoice = buildInvoiceDraft({
      invoiceNumber: 'INV-2026-014',
      issueDate: '2026-05-30',
      dueDate: '2026-06-14',
      clientName: 'The Couve',
      currency: 'USD',
      entries: [
        { id: 'entry_1', description: 'Map polish', durationMinutes: 390, hourlyRate: 32, billable: true },
        { id: 'entry_2', description: 'Internal admin', durationMinutes: 45, hourlyRate: 32, billable: false },
        { id: 'entry_3', description: 'Invoice QA', durationMinutes: 135, hourlyRate: 32, billable: true },
      ],
    })

    expect(invoice.lineItems).toEqual([
      {
        description: 'Map polish',
        sourceTimeEntryIds: ['entry_1'],
        quantityHours: 6.5,
        rate: 32,
        amount: 208,
      },
      {
        description: 'Invoice QA',
        sourceTimeEntryIds: ['entry_3'],
        quantityHours: 2.25,
        rate: 32,
        amount: 72,
      },
    ])
    expect(invoice.total).toBe(280)
  })

  it('rejects entries that already belong to another invoice', () => {
    expect(() =>
      buildInvoiceDraft({
        invoiceNumber: 'INV-2026-015',
        issueDate: '2026-05-30',
        dueDate: '2026-06-14',
        clientName: 'The Couve',
        currency: 'USD',
        entries: [
          {
            id: 'entry_1',
            description: 'Map polish',
            durationMinutes: 390,
            hourlyRate: 32,
            billable: true,
            invoiceId: 'invoice_existing',
          },
        ],
      }),
    ).toThrow('Entry entry_1 is already invoiced')
  })

  it('creates a concise invoice email draft', () => {
    const draft = createEmailDraft({
      invoiceNumber: 'INV-2026-014',
      clientName: 'The Couve',
      total: 312,
      currency: 'USD',
      dueDate: '2026-06-14',
      senderName: 'Ryan',
    })

    expect(draft.subject).toBe('Invoice INV-2026-014 from Inveliq')
    expect(draft.body).toContain('Invoice INV-2026-014 is ready')
    expect(draft.body).toContain('Total: $312.00')
    expect(draft.body).toContain('Due: June 14, 2026')
  })

  it('formats supported currency amounts without hiding decimals', () => {
    expect(formatMoney(1184, 'USD')).toBe('$1,184.00')
  })
})
