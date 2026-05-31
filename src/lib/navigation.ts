export type AppPageId =
  | 'timer'
  | 'calendar'
  | 'overview'
  | 'reports'
  | 'projects'
  | 'clients'
  | 'invoices'
  | 'settings'

export type AppPageSection = 'track' | 'analyze' | 'manage' | 'admin'
export type MobilePrimaryPageId = 'overview' | 'timer' | 'calendar' | 'invoices' | 'more'

export const defaultAppPage: AppPageId = 'timer'
export const mobilePrimaryPages: MobilePrimaryPageId[] = ['overview', 'timer', 'calendar', 'invoices', 'more']

export const appPages: Array<{ id: AppPageId; label: string; section: AppPageSection }> = [
  { id: 'overview', label: 'Overview', section: 'track' },
  { id: 'timer', label: 'Timer', section: 'track' },
  { id: 'calendar', label: 'Calendar', section: 'track' },
  { id: 'reports', label: 'Reports', section: 'analyze' },
  { id: 'projects', label: 'Projects', section: 'manage' },
  { id: 'clients', label: 'Clients', section: 'manage' },
  { id: 'invoices', label: 'Invoices', section: 'manage' },
  { id: 'settings', label: 'Settings', section: 'admin' },
]

export function getPageTitle(pageId: AppPageId) {
  return appPages.find((page) => page.id === pageId)?.label ?? 'Timer'
}
