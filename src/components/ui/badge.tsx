import * as React from 'react'
import { cn } from '../../lib/utils'

type BadgeVariant = 'default' | 'muted' | 'success' | 'warning' | 'danger'

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return <span className={cn('iq-badge', `iq-badge--${variant}`, className)} {...props} />
}
