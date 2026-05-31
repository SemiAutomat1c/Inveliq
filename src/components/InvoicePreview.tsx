import { InveliqLogo } from './Logo'
import { StatusBadge } from './StatusBadge'
import type { InvoiceStatus } from '../brand/tokens'
import { formatMoney } from '../lib/money'

export type InvoicePreviewData = {
  invoiceNumber: string
  dueDate: string
  status: InvoiceStatus
  currency: string
  total: number
  lineItems: Array<{
    label: string
    hours: number
    rate: number
    amount: number
  }>
}

export function InvoicePreview({ invoice }: { invoice: InvoicePreviewData | null }) {
  return (
    <section className="invoice-preview" aria-label="Invoice preview">
      <header>
        <InveliqLogo variant="invoice" />
        <StatusBadge status={invoice?.status ?? 'draft'} />
      </header>
      {invoice ? (
        <>
          <div className="invoice-preview__meta">
            <div>
              <span>Invoice</span>
              <strong>{invoice.invoiceNumber}</strong>
            </div>
            <div>
              <span>Due</span>
              <strong>{formatDate(invoice.dueDate)}</strong>
            </div>
          </div>
          <div className="invoice-preview__lines">
            <table>
              <thead>
                <tr>
                  <th>Work</th>
                  <th>Hours</th>
                  <th>Rate</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr key={`${item.label}-${index}`}>
                    <td>{item.label}</td>
                    <td>{item.hours.toFixed(2)}</td>
                    <td>{invoice.currency} {item.rate}</td>
                    <td>{formatMoney(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer>
            <span>Subtotal</span>
            <strong>{formatMoney(invoice.total, invoice.currency)}</strong>
          </footer>
        </>
      ) : (
        <div className="invoice-preview__empty">
          <strong>No invoice yet</strong>
          <p>Track billable time, then create your first invoice preview.</p>
        </div>
      )}
    </section>
  )
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
