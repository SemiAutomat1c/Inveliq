import type { InvoiceStatus } from '../brand/tokens'

const labels: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  ready: 'Invoice ready',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  void: 'Void',
}

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return <span className={`status-badge status-badge--${status}`}>{labels[status]}</span>
}
