import { BarChart3, BriefcaseBusiness, CalendarDays, Clock3, LayoutDashboard, ReceiptText, Settings, Users } from 'lucide-react'
import type { AppPageId } from '../../lib/navigation'

export const iconForPage: Record<AppPageId, typeof Clock3> = {
  timer: Clock3,
  calendar: CalendarDays,
  overview: LayoutDashboard,
  reports: BarChart3,
  projects: BriefcaseBusiness,
  clients: Users,
  invoices: ReceiptText,
  settings: Settings,
}
