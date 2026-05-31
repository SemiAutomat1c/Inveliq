import type { ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'
import { cn } from '../../lib/utils'

export function ChartContainer({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('iq-chart', className)}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  )
}
