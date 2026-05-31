import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery } from 'convex/react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Menu,
  Moon,
  Play,
  Plus,
  Settings,
  Square,
  Sun,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Line, LineChart, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import './brand/brand.css'
import './App.css'
import { CalendarBlock } from './components/CalendarBlock'
import { InveliqLogo } from './components/Logo'
import { InvoicePreview, type InvoicePreviewData } from './components/InvoicePreview'
import { TimerViewPanel } from './components/TimerViewPanel'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { ChartContainer } from './components/ui/chart'
import { Checkbox } from './components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from './components/ui/field'
import { Input } from './components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './components/ui/sheet'
import { Table } from './components/ui/table'
import { Textarea } from './components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip'
import { useTheme } from './components/useTheme'
import { DestructiveActionDialog } from './components/shell/DestructiveActionDialog'
import { MobileBottomNav } from './components/shell/MobileBottomNav'
import { WorkspaceLoading } from './components/shell/WorkspaceLoading'
import { iconForPage } from './components/shell/pageIcons'
import {
  validateClientForm,
  validateInvoiceForm,
  validateProjectForm,
  validateTimeEntryForm,
} from './lib/forms'
import { buildDashboardAnalytics } from './lib/dashboardAnalytics'
import { defaultCurrency, formatMoney } from './lib/money'
import { appPages, defaultAppPage, mobilePrimaryPages, type AppPageId, type AppPageSection } from './lib/navigation'
import { formatDisplayDate, formatElapsedDuration, formatTimeRange } from './lib/timeFormat'

type DashboardData = ReturnType<typeof useQuery<typeof api.inveliq.getDashboard>>
type Dashboard = NonNullable<DashboardData>
type ProjectDoc = Dashboard['projects'][number]
type ClientDoc = Dashboard['clients'][number]
type EntryDoc = Dashboard['entries'][number]
type InvoiceDoc = Dashboard['invoices'][number]
type TimerDoc = Dashboard['activeTimer'] | null
type ActiveSheet = null | 'client' | 'project' | 'time' | 'invoice' | 'settings' | 'mobile-nav'
type DestructiveAction = null | { type: 'archive-project'; id: ProjectDoc['_id']; label: string } | { type: 'delete-entry'; id: EntryDoc['_id']; label: string }
type PublicInvoiceData = ReturnType<typeof useQuery<typeof api.inveliq.getPublicInvoice>>

function App() {
  const publicInvoiceToken = publicInvoiceTokenFromPath()
  const dashboard = useQuery(api.inveliq.getDashboard, publicInvoiceToken ? 'skip' : {})
  const publicInvoice = useQuery(
    api.inveliq.getPublicInvoice,
    publicInvoiceToken ? { publicToken: publicInvoiceToken } : 'skip',
  )
  const recordPublicInvoiceView = useMutation(api.inveliq.recordPublicInvoiceView)
  const startTimer = useMutation(api.inveliq.startTimer)
  const stopTimer = useMutation(api.inveliq.stopTimer)
  const addManualEntry = useMutation(api.inveliq.addManualEntry)
  const createClient = useMutation(api.inveliq.createClient)
  const updateClient = useMutation(api.inveliq.updateClient)
  const createProject = useMutation(api.inveliq.createProject)
  const updateProject = useMutation(api.inveliq.updateProject)
  const archiveProject = useMutation(api.inveliq.archiveProject)
  const updateUserSettings = useMutation(api.inveliq.updateUserSettings)
  const updateTimeEntry = useMutation(api.inveliq.updateTimeEntry)
  const deleteTimeEntry = useMutation(api.inveliq.deleteTimeEntry)
  const createInvoiceFromEntries = useMutation(api.inveliq.createInvoiceFromEntries)
  const updateInvoiceStatus = useMutation(api.inveliq.updateInvoiceStatus)
  const ensureInvoiceLink = useMutation(api.inveliq.ensureInvoiceLink)
  const prepareEmailDraft = useMutation(api.inveliq.prepareEmailDraft)

  const [activePage, setActivePage] = useState<AppPageId>(defaultAppPage)
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null)
  const [, setMessage] = useState<string | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [workDescription, setWorkDescription] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [editingClient, setEditingClient] = useState<ClientDoc | null>(null)
  const [editingProject, setEditingProject] = useState<ProjectDoc | null>(null)
  const [editingEntry, setEditingEntry] = useState<EntryDoc | null>(null)
  const [invoiceClientId, setInvoiceClientId] = useState<string>('')
  const [selectedInvoiceEntryIds, setSelectedInvoiceEntryIds] = useState<string[]>([])
  const [isTimerRailOpen, setIsTimerRailOpen] = useState(true)
  const [destructiveAction, setDestructiveAction] = useState<DestructiveAction>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!publicInvoiceToken || publicInvoice === undefined || publicInvoice === null) return
    void recordPublicInvoiceView({ publicToken: publicInvoiceToken })
  }, [publicInvoiceToken, publicInvoice, recordPublicInvoiceView])

  const activeProjects = useMemo(
    () => (dashboard?.projects ?? []).filter((project) => project.status === 'active'),
    [dashboard?.projects],
  )

  const selectedProject = activeProjects.find((project) => project._id === selectedProjectId) ?? activeProjects[0] ?? null
  const effectiveSelectedProjectId = selectedProject?._id ?? ''
  const firstClient = dashboard?.clients[0] ?? null
  const activeTimer = dashboard?.activeTimer ?? null
  const elapsedLabel = activeTimer ? formatElapsedDuration(now - activeTimer.startedAt) : '0:00:00'
  const latestInvoice = useInvoicePreview(dashboard)
  const currentInvoiceClientId = invoiceClientId || firstClient?._id || ''
  const invoiceEntries = billableEntriesForClient(dashboard, currentInvoiceClientId)

  async function runAction(label: string, action: () => Promise<unknown>, closeSheet = true) {
    setIsWorking(true)
    try {
      await action()
      setMessage(label)
      toast.success(label)
      if (closeSheet) {
        setActiveSheet(null)
        setEditingClient(null)
        setEditingProject(null)
        setEditingEntry(null)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Try again?'
      setMessage(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsWorking(false)
    }
  }

  function openClientSheet(client?: ClientDoc) {
    setEditingClient(client ?? null)
    setActiveSheet('client')
  }

  function openProjectSheet(project?: ProjectDoc) {
    setEditingProject(project ?? null)
    setActiveSheet('project')
  }

  function openTimeSheet(entry?: EntryDoc) {
    setEditingEntry(entry ?? null)
    setActiveSheet('time')
  }

  function openInvoiceSheet() {
    const clientId = firstClient?._id ?? ''
    setInvoiceClientId(clientId)
    setSelectedInvoiceEntryIds(billableEntriesForClient(dashboard, clientId).map((entry) => entry._id))
    setActiveSheet('invoice')
  }

  function handleInvoiceClientChange(clientId: string) {
    setInvoiceClientId(clientId)
    setSelectedInvoiceEntryIds(billableEntriesForClient(dashboard, clientId).map((entry) => entry._id))
  }

  function handleStartTimer() {
    return selectedProject
      ? runAction('Timer started.', () =>
          startTimer({
            projectId: selectedProject._id,
            description: workDescription.trim() || 'Tracked work',
          }),
        )
      : setMessage('Create a project before tracking time.')
  }

  function handleStopTimer() {
    return runAction('Time entry saved.', () => stopTimer({}))
  }

  function handleClientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = {
      name: valueOf(form, 'name'),
      email: valueOf(form, 'email'),
      address: valueOf(form, 'address'),
      notes: valueOf(form, 'notes'),
      defaultCurrency: valueOf(form, 'defaultCurrency') || defaultCurrency,
    }
    const errors = validateClientForm(input)
    if (errors.length) return setMessage(errors[0])

    return runAction(editingClient ? 'Client updated.' : 'Client created.', () =>
      editingClient
        ? updateClient({ clientId: editingClient._id, ...input })
        : createClient(input),
    )
  }

  function handleProjectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = {
      name: valueOf(form, 'name'),
      clientId: valueOf(form, 'clientId'),
      hourlyRate: Number(valueOf(form, 'hourlyRate')),
      currency: valueOf(form, 'currency') || defaultCurrency,
      billableDefault: form.get('billableDefault') === 'on',
      status: (valueOf(form, 'status') || 'active') as 'active' | 'archived',
    }
    const errors = validateProjectForm(input)
    if (errors.length) return setMessage(errors[0])

    return runAction(editingProject ? 'Project updated.' : 'Project created.', () =>
      editingProject
        ? updateProject({ projectId: editingProject._id, ...input, clientId: input.clientId as Id<'clients'> })
        : createProject({
            clientId: input.clientId as Id<'clients'>,
            name: input.name,
            hourlyRate: input.hourlyRate,
            currency: input.currency,
            billableDefault: input.billableDefault,
          }),
    )
  }

  function handleTimeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const startTime = new Date(valueOf(form, 'startTime')).getTime()
    const endTime = new Date(valueOf(form, 'endTime')).getTime()
    const input = {
      projectId: valueOf(form, 'projectId'),
      description: valueOf(form, 'description'),
      startTime,
      endTime,
      billable: form.get('billable') === 'on',
    }
    const errors = validateTimeEntryForm(input)
    if (errors.length) return setMessage(errors[0])

    return runAction(editingEntry ? 'Time entry updated.' : 'Manual entry added.', () =>
      editingEntry
        ? updateTimeEntry({ entryId: editingEntry._id, ...input, projectId: input.projectId as Id<'projects'> })
        : addManualEntry({ ...input, projectId: input.projectId as Id<'projects'> }),
    )
  }

  function handleInvoiceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = {
      clientId: valueOf(form, 'clientId'),
      timeEntryIds: selectedInvoiceEntryIds,
      issueDate: valueOf(form, 'issueDate'),
      dueDate: valueOf(form, 'dueDate'),
    }
    const errors = validateInvoiceForm(input)
    if (errors.length) return setMessage(errors[0])

    return runAction('Invoice ready.', () =>
      createInvoiceFromEntries({
        ...input,
        clientId: input.clientId as Id<'clients'>,
        timeEntryIds: input.timeEntryIds as Id<'timeEntries'>[],
      }),
    )
  }

  function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    return runAction('Settings saved.', () =>
      updateUserSettings({
        displayName: valueOf(form, 'displayName'),
        defaultCurrency: valueOf(form, 'defaultCurrency') || defaultCurrency,
        invoiceSenderName: valueOf(form, 'invoiceSenderName'),
        invoiceSenderEmail: valueOf(form, 'invoiceSenderEmail'),
        invoiceSenderAddress: valueOf(form, 'invoiceSenderAddress'),
      }),
    )
  }

  if (publicInvoiceToken) {
    return <PublicInvoicePage invoice={publicInvoice} />
  }

  return (
    <TooltipProvider>
      <main className="workspace-shell">
        <IconRail
          setActivePage={setActivePage}
          openMobileNav={() => setActiveSheet('mobile-nav')}
        />
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <section className="workspace-stage">
          <TopTimerBar
            activeTimer={activeTimer}
            elapsedLabel={elapsedLabel}
            projects={activeProjects}
            selectedProjectId={effectiveSelectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            isWorking={isWorking}
            workDescription={workDescription}
            setWorkDescription={setWorkDescription}
            onStart={handleStartTimer}
            onStop={handleStopTimer}
            compact={activePage !== 'timer'}
          />
          {dashboard === undefined ? <WorkspaceLoading /> : <WorkspaceRouter
            activePage={activePage}
            dashboard={dashboard}
            firstClient={firstClient}
            latestInvoice={latestInvoice}
            isWorking={isWorking}
            onOpenClient={openClientSheet}
            onOpenProject={openProjectSheet}
            onOpenTime={openTimeSheet}
            onOpenInvoice={openInvoiceSheet}
            onPrepareEmail={(invoiceId) => runAction('Email draft prepared.', () => prepareEmailDraft({ invoiceId, appOrigin: window.location.origin }), false)}
            onUpdateInvoiceStatus={(invoiceId, status) => runAction('Invoice status updated.', () => updateInvoiceStatus({ invoiceId, status }), false)}
            onCopyInvoiceLink={(invoiceId) => runAction('Invoice link copied.', async () => {
              const token = await ensureInvoiceLink({ invoiceId })
              await navigator.clipboard.writeText(publicInvoiceUrl(token))
            }, false)}
            onOpenInvoiceLink={(invoiceId) => runAction('Invoice link opened.', async () => {
              const token = await ensureInvoiceLink({ invoiceId })
              window.open(publicInvoiceUrl(token), '_blank', 'noopener,noreferrer')
            }, false)}
            onArchiveProject={(projectId) => {
              const project = dashboard.projects.find((item) => item._id === projectId)
              setDestructiveAction({ type: 'archive-project', id: projectId, label: project?.name ?? 'this project' })
            }}
            onDeleteEntry={(entryId) => {
              const entry = dashboard.entries.find((item) => item._id === entryId)
              setDestructiveAction({ type: 'delete-entry', id: entryId, label: entry?.description ?? 'this time entry' })
            }}
            onOpenSettings={() => setActiveSheet('settings')}
            onSetPage={setActivePage}
            isTimerRailOpen={isTimerRailOpen}
            setIsTimerRailOpen={setIsTimerRailOpen}
          />}
        </section>
        <MobileBottomNav activePage={activePage} setActivePage={setActivePage} openMore={() => setActiveSheet('mobile-nav')} />
      </main>
      <AppSheets
        activeSheet={activeSheet}
        dashboard={dashboard}
        editingClient={editingClient}
        editingProject={editingProject}
        editingEntry={editingEntry}
        invoiceClientId={currentInvoiceClientId}
        invoiceEntries={invoiceEntries}
        selectedInvoiceEntryIds={selectedInvoiceEntryIds}
        setSelectedInvoiceEntryIds={setSelectedInvoiceEntryIds}
        onInvoiceClientChange={handleInvoiceClientChange}
        isWorking={isWorking}
        onClose={() => {
          setActiveSheet(null)
          setEditingClient(null)
          setEditingProject(null)
          setEditingEntry(null)
        }}
        onClientSubmit={handleClientSubmit}
        onProjectSubmit={handleProjectSubmit}
        onTimeSubmit={handleTimeSubmit}
        onInvoiceSubmit={handleInvoiceSubmit}
        onSettingsSubmit={handleSettingsSubmit}
        setActivePage={setActivePage}
      />
      <DestructiveActionDialog
        action={destructiveAction}
        onClose={() => setDestructiveAction(null)}
        onConfirm={() => {
          if (!destructiveAction) return
          const action = destructiveAction
          setDestructiveAction(null)
          if (action.type === 'archive-project') void runAction('Project archived.', () => archiveProject({ projectId: action.id }), false)
          if (action.type === 'delete-entry') void runAction('Time entry deleted.', () => deleteTimeEntry({ entryId: action.id }), false)
        }}
      />
    </TooltipProvider>
  )
}

type WorkspaceRouterProps = {
  activePage: AppPageId
  dashboard: DashboardData
  firstClient: ClientDoc | null
  latestInvoice: InvoicePreviewData | null
  isWorking: boolean
  onOpenClient: (client?: ClientDoc) => void
  onOpenProject: (project?: ProjectDoc) => void
  onOpenTime: (entry?: EntryDoc) => void
  onOpenInvoice: () => void
  onPrepareEmail: (invoiceId: InvoiceDoc['_id']) => void
  onUpdateInvoiceStatus: (invoiceId: InvoiceDoc['_id'], status: InvoiceDoc['status']) => void
  onCopyInvoiceLink: (invoiceId: InvoiceDoc['_id']) => void
  onOpenInvoiceLink: (invoiceId: InvoiceDoc['_id']) => void
  onArchiveProject: (projectId: ProjectDoc['_id']) => void
  onDeleteEntry: (entryId: EntryDoc['_id']) => void
  onOpenSettings: () => void
  onSetPage: (page: AppPageId) => void
  isTimerRailOpen: boolean
  setIsTimerRailOpen: (open: boolean) => void
}

function WorkspaceRouter(props: WorkspaceRouterProps) {
  if (props.activePage === 'timer') return <TimerWorkspace {...props} />
  if (props.activePage === 'calendar') return <CalendarWorkspace dashboard={props.dashboard} />
  if (props.activePage === 'overview') return <OverviewWorkspace {...props} />
  if (props.activePage === 'projects') return <ProjectsWorkspace {...props} />
  if (props.activePage === 'clients') return <ClientsWorkspace {...props} />
  if (props.activePage === 'invoices') return <InvoicesWorkspace {...props} />
  if (props.activePage === 'reports') return <ReportsWorkspace dashboard={props.dashboard} />
  if (props.activePage === 'settings') return <SettingsWorkspace dashboard={props.dashboard} onOpenSettings={props.onOpenSettings} />

  return <TimerWorkspace {...props} />
}

function PublicInvoicePage({ invoice }: { invoice: PublicInvoiceData }) {
  if (invoice === undefined) {
    return (
      <main className="public-invoice-page">
        <section className="public-invoice-card">
          <InveliqLogo />
          <p className="empty-state">Loading invoice...</p>
        </section>
      </main>
    )
  }

  if (invoice === null) {
    return (
      <main className="public-invoice-page">
        <section className="public-invoice-card public-invoice-card--empty">
          <InveliqLogo />
          <h1>Invoice not found</h1>
          <p>This invoice link is invalid or no longer available.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="public-invoice-page">
      <section className="public-invoice-card">
        <header className="public-invoice-header">
          <InveliqLogo variant="invoice" />
          <Badge variant={invoice.invoice.status === 'paid' ? 'success' : 'default'}>{invoice.invoice.status}</Badge>
        </header>
        <div className="public-invoice-title">
          <div>
            <span>Invoice</span>
            <h1>{invoice.invoice.invoiceNumber}</h1>
          </div>
          <strong>{formatMoney(invoice.invoice.total, invoice.invoice.currency)}</strong>
        </div>
        <div className="public-invoice-meta">
          <div>
            <span>From</span>
            <strong>{invoice.sender.name}</strong>
            {invoice.sender.email && <p>{invoice.sender.email}</p>}
            {invoice.sender.address && <p>{invoice.sender.address}</p>}
          </div>
          <div>
            <span>Bill to</span>
            <strong>{invoice.client.name}</strong>
            <p>{invoice.client.email}</p>
            {invoice.client.address && <p>{invoice.client.address}</p>}
          </div>
          <div>
            <span>Issued</span>
            <strong>{formatDisplayDate(invoice.invoice.issueDate)}</strong>
          </div>
          <div>
            <span>Due</span>
            <strong>{formatDisplayDate(invoice.invoice.dueDate)}</strong>
          </div>
        </div>
        <Table>
          <thead>
            <tr>
              <th>Work</th>
              <th>Hours</th>
              <th>Rate</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr key={`${item.description}-${item.amount}`}>
                <td>{item.description}</td>
                <td>{item.quantityHours.toFixed(2)}</td>
                <td>{formatMoney(item.rate, invoice.invoice.currency)}</td>
                <td>{formatMoney(item.amount, invoice.invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <footer className="public-invoice-total">
          <span>Total</span>
          <strong>{formatMoney(invoice.invoice.total, invoice.invoice.currency)}</strong>
        </footer>
      </section>
    </main>
  )
}

function IconRail({
  setActivePage,
  openMobileNav,
}: {
  setActivePage: (page: AppPageId) => void
  openMobileNav: () => void
}) {
  const { preference, resolvedTheme, togglePreference } = useTheme()

  return (
    <aside className="icon-rail" aria-label="Workspace utilities">
      <div className="icon-rail__top">
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="rail-button mobile-nav-trigger" onClick={openMobileNav}>
              <Menu size={17} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Menu</TooltipContent>
        </Tooltip>
      </div>
      <div className="icon-rail__bottom">
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="rail-button" onClick={togglePreference}>
              {resolvedTheme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Theme: {preference}</TooltipContent>
        </Tooltip>
        <button type="button" className="rail-avatar">RD</button>
        <button type="button" className="rail-button" onClick={() => setActivePage('settings')}>
          <CircleHelp size={17} />
        </button>
      </div>
    </aside>
  )
}

function Sidebar({
  activePage,
  setActivePage,
}: {
  activePage: AppPageId
  setActivePage: (page: AppPageId) => void
}) {
  const { preference, resolvedTheme, togglePreference } = useTheme()
  const grouped = groupPages()
  return (
    <aside className="app-sidebar" aria-label="Workspace navigation">
      <div>
        <div className="workspace-switcher">
          <InveliqLogo tone={resolvedTheme === 'dark' ? 'light' : 'default'} />
          <ChevronsUpDown size={16} />
        </div>
        {sectionOrder.map((section) => (
          <nav className="nav-section" key={section} aria-label={section}>
            <p>{sectionLabels[section]}</p>
            {grouped[section].map((page) => {
              const Icon = iconForPage[page.id]
              return (
                <button
                  type="button"
                  key={page.id}
                  aria-current={activePage === page.id ? 'page' : undefined}
                  onClick={() => setActivePage(page.id)}
                >
                  <Icon size={15} />
                  <span>{page.label}</span>
                </button>
              )
            })}
          </nav>
        ))}
      </div>
      <div className="sidebar-footer">
        <button type="button" onClick={togglePreference}>
          {resolvedTheme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
          <span>{preference}</span>
        </button>
        <button type="button" onClick={() => setActivePage('settings')}>
          <Settings size={15} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  )
}

function TopTimerBar({
  activeTimer,
  elapsedLabel,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  isWorking,
  workDescription,
  setWorkDescription,
  onStart,
  onStop,
  compact,
}: {
  activeTimer: TimerDoc
  elapsedLabel: string
  projects: ProjectDoc[]
  selectedProjectId: string
  setSelectedProjectId: (projectId: string) => void
  isWorking: boolean
  workDescription: string
  setWorkDescription: (value: string) => void
  onStart: () => void
  onStop: () => void
  compact?: boolean
}) {
  return (
    <header className={compact ? 'top-timer-bar top-timer-bar--compact' : 'top-timer-bar'}>
      <div className="work-command">
        <Input
          value={workDescription}
          onChange={(event) => setWorkDescription(event.target.value)}
          placeholder="What are you working on?"
          aria-label="What are you working on?"
        />
        <div className="project-picker">
          <span>Project</span>
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
            disabled={projects.length === 0}
          >
            <SelectTrigger className="project-select" aria-label="Project">
              <SelectValue placeholder="No project" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {projects.map((project) => (
                  <SelectItem value={project._id} key={project._id}>{project.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="timer-actions">
        <span className="top-clock">{elapsedLabel}</span>
        <Button
          variant="default"
          size="lg"
          className="play-button"
          onClick={activeTimer ? onStop : onStart}
          disabled={isWorking || projects.length === 0}
          aria-label={activeTimer ? 'Stop timer' : 'Start timer'}
        >
          {activeTimer ? <Square size={18} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
        </Button>
      </div>
    </header>
  )
}

function TimerWorkspace({
  dashboard,
  latestInvoice,
  isWorking,
  onOpenTime,
  onOpenInvoice,
  onDeleteEntry,
  isTimerRailOpen,
  setIsTimerRailOpen,
}: WorkspaceRouterProps) {
  const entries = dashboard?.entries ?? []
  const readyToInvoice = dashboard?.stats.readyToInvoice ?? 0
  const billableEntryCount = dashboard?.stats.billableEntryCount ?? 0

  return (
    <div className={isTimerRailOpen ? 'timer-workspace' : 'timer-workspace timer-workspace--rail-collapsed'}>
      <section className="timer-main">
        {(dashboard?.projects.length ?? 0) === 0 && (
          <div className="empty-banner">Create a client and project before tracking time.</div>
        )}
        <TimerViewPanel
          entries={entries}
          projects={dashboard?.projects ?? []}
          totalHours={dashboard?.stats.totalHours ?? 0}
          emptyLabel="Create or start a time entry to fill this view."
          onAddEntry={() => onOpenTime()}
          onEditEntry={(entry) => onOpenTime(entry as EntryDoc)}
          onDeleteEntry={(entryId) => onDeleteEntry(entryId as EntryDoc['_id'])}
          isWorking={isWorking}
        />
      </section>
      <aside className="right-rail" aria-label="Timer summary" hidden={!isTimerRailOpen}>
        <Button
          variant="ghost"
          size="sm"
          className="rail-collapse-button"
          onClick={() => setIsTimerRailOpen(false)}
          aria-label="Hide timer summary"
        >
          <ChevronRight size={15} />
          Hide
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Work summary</CardTitle>
            <Badge variant="muted">{entries.length} entries</Badge>
          </CardHeader>
          <CardContent className="rail-metric">
            <strong>{formatElapsedDuration((dashboard?.stats.totalHours ?? 0) * 3_600_000)}</strong>
            <p className="muted-copy">Tracked across the current workspace.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ready to invoice</CardTitle>
            <Badge variant="success">{billableEntryCount} entries</Badge>
          </CardHeader>
          <CardContent className="rail-metric">
            <strong>{formatMoney(readyToInvoice)}</strong>
            <Button variant="default" onClick={onOpenInvoice} disabled={isWorking || billableEntryCount === 0}>
              Create invoice
            </Button>
          </CardContent>
        </Card>
        <InvoicePreview invoice={latestInvoice} />
        <Button variant="secondary" onClick={() => onOpenTime()} disabled={isWorking}>
          <Plus size={15} />
          Add manual entry
        </Button>
      </aside>
      {!isTimerRailOpen && (
        <Button
          variant="secondary"
          size="sm"
          className="rail-expand-button"
          onClick={() => setIsTimerRailOpen(true)}
          aria-label="Show timer summary"
        >
          <ChevronLeft size={15} />
          Summary
        </Button>
      )}
    </div>
  )
}

function CalendarWorkspace({ dashboard }: { dashboard: DashboardData }) {
  const entries = dashboard?.entries ?? []
  const referenceDate = newestEntryDate(entries) ?? new Date()
  const weekLabel = formatWeekLabel(referenceDate)

  return (
    <section className="calendar-workspace">
      <header className="calendar-workspace__header">
        <div>
          <p className="eyebrow">Week view</p>
          <h1>{weekLabel}</h1>
        </div>
        <div className="calendar-workspace__metrics">
          <Metric label="Entries" value={String(entries.length)} detail="Visible tracked work" />
          <Metric label="Ready to invoice" value={formatMoney(dashboard?.stats.readyToInvoice ?? 0)} detail={`${dashboard?.stats.billableEntryCount ?? 0} open entries`} />
        </div>
      </header>
      <CalendarBlock entries={entries} referenceDate={referenceDate} />
    </section>
  )
}

function OverviewWorkspace({
  dashboard,
  latestInvoice,
  onSetPage,
  onOpenInvoice,
  onOpenClient,
  onOpenProject,
  isWorking,
}: WorkspaceRouterProps) {
  const entries = dashboard?.entries ?? []
  const projects = dashboard?.projects ?? []
  const clients = dashboard?.clients ?? []
  const invoices = dashboard?.invoices ?? []
  const activeProjects = projects.filter((project) => project.status === 'active')
  const analytics = buildDashboardAnalytics(entries, invoices)
  const invoicedTotal = invoices.reduce((sum, invoice) => sum + invoice.total, 0)

  return (
    <div className="dashboard-workspace">
      <section className="workspace-page-header">
        <div>
          <p className="eyebrow">This week</p>
          <h1>Work overview</h1>
          <span>{entries.length === 0 ? 'Create a client and project to begin tracking billable work.' : `${entries.length} entries across ${clients.length} clients.`}</span>
        </div>
        <div className="dashboard-actions">
          <Button onClick={() => onSetPage('timer')}>Open timer</Button>
          <Button variant="secondary" onClick={onOpenInvoice} disabled={isWorking || (dashboard?.stats.billableEntryCount ?? 0) === 0}>
            Create invoice
          </Button>
        </div>
      </section>

      <div className="reports-kpis">
        <Metric label="Tracked" value={formatElapsedDuration(analytics.totalMinutes * 60_000)} detail="All visible entries" />
        <Metric label="Billable" value={`${analytics.billableRatio}%`} detail="Tracked time utilization" />
        <Metric label="Ready" value={formatMoney(dashboard?.stats.readyToInvoice ?? 0)} detail={`${dashboard?.stats.billableEntryCount ?? 0} billable entries`} />
        <Metric label="Paid" value={formatMoney(analytics.paidTotal)} detail={`${invoices.length} invoices total`} />
      </div>

      <div className="dashboard-grid">
        <section className="workspace-module workspace-module--chart">
          <header><div><p className="eyebrow">Last 7 days</p><h2>Time and value trend</h2></div><strong>{formatMoney(invoicedTotal)}</strong></header>
          <ChartContainer>
            <AreaChart data={analytics.trend}>
              <defs><linearGradient id="overviewTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.32} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis hide />
              <RechartsTooltip formatter={(value) => `${value} min`} />
              <Area type="monotone" dataKey="minutes" stroke="var(--primary)" fill="url(#overviewTrend)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </section>

        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Next actions</CardTitle>
            <Badge variant="muted">Workflow</Badge>
          </CardHeader>
          <CardContent className="dashboard-action-list">
            <button type="button" onClick={() => onSetPage('timer')}>
              <strong>Track work</strong>
              <span>Start or add a time entry</span>
            </button>
            <button type="button" onClick={() => clients.length === 0 ? onOpenClient() : onOpenProject()} disabled={isWorking}>
              <strong>{clients.length === 0 ? 'Create client' : 'Create project'}</strong>
              <span>{clients.length === 0 ? 'Set up billing profile' : 'Add a billable workstream'}</span>
            </button>
            <button type="button" onClick={() => onSetPage('reports')}>
              <strong>Review analytics</strong>
              <span>Check utilization and value</span>
            </button>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Recent work</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onSetPage('timer')}>View all</Button>
          </CardHeader>
          <CardContent>
            <TimeList entries={entries.slice(0, 5)} emptyLabel="No tracked work yet." compact />
          </CardContent>
        </Card>

        <InvoicePreview invoice={latestInvoice} />
      </div>
      <p className="workspace-footnote">{activeProjects.length} active projects · {formatMoney(invoicedTotal)} invoiced</p>
    </div>
  )
}

function ProjectsWorkspace({
  dashboard,
  onOpenProject,
  onArchiveProject,
}: WorkspaceRouterProps) {
  const clientsById = new Map((dashboard?.clients ?? []).map((client) => [client._id, client.name]))
  return (
    <section className="workspace-panel">
      <header className="workspace-panel__header">
        <CardTitle>Projects</CardTitle>
        <Button onClick={() => onOpenProject()} disabled={(dashboard?.clients.length ?? 0) === 0}>New project</Button>
      </header>
      <div className="workspace-panel__content">
        <Table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>Rate</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(dashboard?.projects ?? []).map((project) => (
              <tr key={project._id}>
                <td>{project.name}</td>
                <td>{clientsById.get(project.clientId) ?? 'Unknown client'}</td>
                <td>{project.currency} {project.hourlyRate}</td>
                <td><Badge variant={project.status === 'active' ? 'success' : 'muted'}>{project.status}</Badge></td>
                <td>
                  <div className="row-actions">
                    <Button variant="secondary" size="sm" onClick={() => onOpenProject(project)}>Edit</Button>
                    {project.status === 'active' && (
                      <Button variant="ghost" size="sm" onClick={() => onArchiveProject(project._id)}>Archive</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {(dashboard?.clients.length ?? 0) === 0 && <p className="empty-state">Create a client before adding projects.</p>}
      </div>
    </section>
  )
}

function ClientsWorkspace({ dashboard, onOpenClient }: WorkspaceRouterProps) {
  return (
    <section className="workspace-panel">
      <header className="workspace-panel__header">
        <CardTitle>Clients</CardTitle>
        <Button onClick={() => onOpenClient()}>New client</Button>
      </header>
      <div className="workspace-panel__content">
        <Table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Email</th>
              <th>Currency</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(dashboard?.clients ?? []).map((client) => (
              <tr key={client._id}>
                <td>{client.name}</td>
                <td>{client.email}</td>
                <td>{client.defaultCurrency}</td>
                <td>{client.notes ?? '—'}</td>
                <td><Button variant="secondary" size="sm" onClick={() => onOpenClient(client)}>Edit</Button></td>
              </tr>
            ))}
          </tbody>
        </Table>
        {(dashboard?.clients.length ?? 0) === 0 && <p className="empty-state">Create your first client to start tracking billable work.</p>}
      </div>
    </section>
  )
}

function InvoicesWorkspace({
  dashboard,
  latestInvoice,
  firstClient,
  isWorking,
  onOpenInvoice,
  onPrepareEmail,
  onUpdateInvoiceStatus,
  onCopyInvoiceLink,
  onOpenInvoiceLink,
}: WorkspaceRouterProps) {
  return (
    <div className="invoices-grid">
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <div className="card-actions">
            <Button variant="secondary" onClick={() => dashboard?.latestInvoice && onPrepareEmail(dashboard.latestInvoice._id)} disabled={isWorking || !dashboard?.latestInvoice}>
              Prepare email
            </Button>
            <Button onClick={onOpenInvoice} disabled={isWorking || !firstClient || (dashboard?.stats.billableEntryCount ?? 0) === 0}>
              New invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Status</th>
                <th>Due</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.invoices ?? []).map((invoice) => (
                <tr key={invoice._id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>
                    <select
                      className="iq-select table-select"
                      value={invoice.status}
                      onChange={(event) => onUpdateInvoiceStatus(invoice._id, event.target.value as InvoiceDoc['status'])}
                    >
                      {['draft', 'ready', 'sent', 'paid', 'void'].map((status) => (
                        <option value={status} key={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td>{formatDisplayDate(invoice.dueDate)}</td>
                  <td>{formatMoney(invoice.total, invoice.currency)}</td>
                  <td>
                    <div className="row-actions">
                      <Button variant="ghost" size="sm" onClick={() => onPrepareEmail(invoice._id)}>Email</Button>
                      <Button variant="ghost" size="sm" onClick={() => onCopyInvoiceLink(invoice._id)}>Copy link</Button>
                      <Button variant="ghost" size="sm" onClick={() => onOpenInvoiceLink(invoice._id)}>Open</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
      <InvoicePreview invoice={latestInvoice} />
      {dashboard?.latestEmailDraft && (
        <Card className="email-draft-card">
          <CardHeader><CardTitle>{dashboard.latestEmailDraft.subject}</CardTitle></CardHeader>
          <CardContent><pre>{dashboard.latestEmailDraft.body}</pre></CardContent>
        </Card>
      )}
    </div>
  )
}

function ReportsWorkspace({ dashboard }: { dashboard: DashboardData }) {
  const entries = dashboard?.entries ?? []
  const invoices = dashboard?.invoices ?? []
  const projects = dashboard?.projects ?? []
  const clients = dashboard?.clients ?? []
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.durationMinutes, 0)
  const billableMinutes = entries.reduce((sum, entry) => sum + (entry.billable ? entry.durationMinutes : 0), 0)
  const billableRatio = totalMinutes === 0 ? 0 : Math.round((billableMinutes / totalMinutes) * 100)
  const invoicedTotal = invoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const paidTotal = invoices.filter((invoice) => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.total, 0)
  const openInvoiceTotal = invoices
    .filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'void')
    .reduce((sum, invoice) => sum + invoice.total, 0)
  const projectRows = buildProjectReportRows(entries, projects, clients)
  const invoiceRows = buildInvoiceStatusRows(invoices)
  const analytics = buildDashboardAnalytics(entries, invoices)

  return (
    <div className="reports-workspace">
      <section className="reports-hero">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Work performance</h1>
          <span>Track time into cleaner billing decisions.</span>
        </div>
        <div className="reports-hero__score">
          <strong>{billableRatio}%</strong>
          <span>billable utilization</span>
        </div>
      </section>

      <div className="reports-kpis">
        <Metric label="Tracked hours" value={`${(totalMinutes / 60).toFixed(2)}h`} detail={`${entries.length} time entries`} />
        <Metric label="Ready to invoice" value={formatMoney(dashboard?.stats.readyToInvoice ?? 0)} detail={`${dashboard?.stats.billableEntryCount ?? 0} open billable entries`} />
        <Metric label="Invoiced" value={formatMoney(invoicedTotal)} detail={`${invoices.length} invoice records`} />
        <Metric label="Paid" value={formatMoney(paidTotal)} detail={`${formatMoney(openInvoiceTotal)} still open`} />
      </div>

      <div className="reports-grid">
        <section className="workspace-module workspace-module--chart">
          <header><div><p className="eyebrow">Last 7 days</p><h2>Time and value trend</h2></div><Badge variant="muted">{entries.length} entries</Badge></header>
          <ChartContainer>
            <LineChart data={analytics.trend}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis hide />
              <RechartsTooltip />
              <Line type="monotone" dataKey="minutes" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: 'var(--primary)' }} />
              <Line type="monotone" dataKey="value" stroke="var(--warning-foreground)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </section>

        <Card className="report-card">
          <CardHeader>
            <CardTitle>Invoice status</CardTitle>
            <Badge variant="muted">{invoices.length} total</Badge>
          </CardHeader>
          <CardContent>
            <div className="status-mix">
              {invoiceRows.map((row) => (
                <article key={row.status}>
                  <div>
                    <Badge variant={row.status === 'paid' ? 'success' : row.status === 'void' ? 'danger' : 'default'}>{row.status}</Badge>
                    <span>{row.count} invoices</span>
                  </div>
                  <strong>{formatMoney(row.total)}</strong>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="report-card report-card--wide">
          <CardHeader>
            <CardTitle>Project value</CardTitle>
            <Badge variant="muted">{projectRows.length} active sources</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Hours</th>
                  <th>Billable</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {projectRows.length === 0 ? (
                  <tr><td colSpan={5}>No project analytics yet.</td></tr>
                ) : projectRows.map((row) => (
                  <tr key={row.projectId}>
                    <td>{row.projectName}</td>
                    <td>{row.clientName}</td>
                    <td>{(row.minutes / 60).toFixed(2)}h</td>
                    <td>{row.billableMinutes === 0 ? '0.00h' : `${(row.billableMinutes / 60).toFixed(2)}h`}</td>
                    <td>{formatMoney(row.value, row.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Card className="report-card">
          <CardHeader>
            <CardTitle>Latest billable work</CardTitle>
            <Badge variant="success">{dashboard?.stats.billableEntryCount ?? 0} open</Badge>
          </CardHeader>
          <CardContent>
            <TimeList
              entries={entries.filter((entry) => entry.billable).slice(0, 5)}
              emptyLabel="No billable work to report yet."
              compact
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SettingsWorkspace({ dashboard, onOpenSettings }: { dashboard: DashboardData; onOpenSettings: () => void }) {
  const { preference, resolvedTheme, togglePreference } = useTheme()
  return (
    <section className="workspace-panel">
      <header className="workspace-panel__header">
        <CardTitle>{dashboard?.user?.displayName ?? 'Freelancer profile'}</CardTitle>
        <div className="card-actions">
          <Button variant="secondary" onClick={togglePreference}>{resolvedTheme === 'dark' ? <Moon size={15} /> : <Sun size={15} />} {preference}</Button>
          <Button onClick={onOpenSettings}>Edit settings</Button>
        </div>
      </header>
      <div className="settings-grid workspace-panel__content">
        <Setting label="Default currency" value={dashboard?.user?.defaultCurrency ?? defaultCurrency} />
        <Setting label="Invoice sender" value={dashboard?.user?.invoiceSenderName ?? 'Not set'} />
        <Setting label="Sender email" value={dashboard?.user?.invoiceSenderEmail ?? 'Not set'} />
        <Setting label="Sender address" value={dashboard?.user?.invoiceSenderAddress ?? 'Not set'} />
      </div>
    </section>
  )
}

function TimeList({
  entries,
  emptyLabel,
  compact,
}: {
  entries: EntryDoc[]
  emptyLabel: string
  compact?: boolean
}) {
  if (entries.length === 0) return <p className="empty-state">{emptyLabel}</p>

  return (
    <div className={compact ? 'time-list time-list--compact' : 'time-list'}>
      {entries.map((entry) => (
        <article className="time-row" key={entry._id}>
          <div className="time-row__status"><span /></div>
          <div>
            <strong>{entry.description}</strong>
            <p>{formatTimeRange(entry.startTime, entry.endTime)} · {entry.billable ? 'Billable' : 'Internal'}</p>
          </div>
          <Badge variant={entry.invoiceId ? 'success' : 'muted'}>{entry.invoiceId ? 'Invoiced' : 'Open'}</Badge>
          <span className="row-duration">{formatElapsedDuration(entry.durationMinutes * 60_000)}</span>
        </article>
      ))}
    </div>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card className="metric-card">
      <CardContent>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </CardContent>
    </Card>
  )
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="setting-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function AppSheets({
  activeSheet,
  dashboard,
  editingClient,
  editingProject,
  editingEntry,
  invoiceClientId,
  invoiceEntries,
  selectedInvoiceEntryIds,
  setSelectedInvoiceEntryIds,
  onInvoiceClientChange,
  isWorking,
  onClose,
  onClientSubmit,
  onProjectSubmit,
  onTimeSubmit,
  onInvoiceSubmit,
  onSettingsSubmit,
  setActivePage,
}: {
  activeSheet: ActiveSheet
  dashboard: DashboardData
  editingClient: ClientDoc | null
  editingProject: ProjectDoc | null
  editingEntry: EntryDoc | null
  invoiceClientId: string
  invoiceEntries: EntryDoc[]
  selectedInvoiceEntryIds: string[]
  setSelectedInvoiceEntryIds: (ids: string[]) => void
  onInvoiceClientChange: (clientId: string) => void
  isWorking: boolean
  onClose: () => void
  onClientSubmit: (event: FormEvent<HTMLFormElement>) => void
  onProjectSubmit: (event: FormEvent<HTMLFormElement>) => void
  onTimeSubmit: (event: FormEvent<HTMLFormElement>) => void
  onInvoiceSubmit: (event: FormEvent<HTMLFormElement>) => void
  onSettingsSubmit: (event: FormEvent<HTMLFormElement>) => void
  setActivePage: (page: AppPageId) => void
}) {
  const open = activeSheet !== null

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onClose()
    }}>
      <SheetContent className="app-sheet" side={activeSheet === 'mobile-nav' ? 'bottom' : 'right'}>
        <SheetHeader>
          <SheetTitle>{sheetTitle(activeSheet)}</SheetTitle>
          <SheetDescription>{sheetDescription(activeSheet)}</SheetDescription>
        </SheetHeader>
        {activeSheet === 'client' && (
          <ClientForm client={editingClient} isWorking={isWorking} onSubmit={onClientSubmit} />
        )}
        {activeSheet === 'project' && (
          <ProjectForm project={editingProject} clients={dashboard?.clients ?? []} isWorking={isWorking} onSubmit={onProjectSubmit} />
        )}
        {activeSheet === 'time' && (
          <TimeEntryForm entry={editingEntry} projects={(dashboard?.projects ?? []).filter((project) => project.status === 'active')} isWorking={isWorking} onSubmit={onTimeSubmit} />
        )}
        {activeSheet === 'invoice' && (
          <InvoiceForm
            clients={dashboard?.clients ?? []}
            selectedClientId={invoiceClientId}
            onClientChange={onInvoiceClientChange}
            entries={invoiceEntries}
            selectedIds={selectedInvoiceEntryIds}
            setSelectedIds={setSelectedInvoiceEntryIds}
            isWorking={isWorking}
            onSubmit={onInvoiceSubmit}
          />
        )}
        {activeSheet === 'settings' && (
          <SettingsForm user={dashboard?.user ?? null} isWorking={isWorking} onSubmit={onSettingsSubmit} />
        )}
        {activeSheet === 'mobile-nav' && (
          <nav className="mobile-nav-list">
            {appPages.filter((page) => !mobilePrimaryPages.includes(page.id as typeof mobilePrimaryPages[number])).map((page) => {
              const Icon = iconForPage[page.id]
              return (
              <button
                type="button"
                key={page.id}
                onClick={() => {
                  setActivePage(page.id)
                  onClose()
                }}
              >
                <Icon size={17} />
                {page.label}
              </button>
              )
            })}
          </nav>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ClientForm({
  client,
  isWorking,
  onSubmit,
}: {
  client: ClientDoc | null
  isWorking: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form className="sheet-form" onSubmit={onSubmit}>
      <FieldGroup>
        <Field><FieldLabel>Name</FieldLabel><Input name="name" defaultValue={client?.name ?? ''} /></Field>
        <Field><FieldLabel>Email</FieldLabel><Input name="email" type="email" defaultValue={client?.email ?? ''} /></Field>
        <Field><FieldLabel>Address</FieldLabel><Textarea name="address" defaultValue={client?.address ?? ''} /></Field>
        <Field><FieldLabel>Notes</FieldLabel><Textarea name="notes" defaultValue={client?.notes ?? ''} /></Field>
        <Field><FieldLabel>Currency</FieldLabel><Input name="defaultCurrency" defaultValue={client?.defaultCurrency ?? defaultCurrency} /></Field>
      </FieldGroup>
      <Button type="submit" disabled={isWorking}>{client ? 'Save client' : 'Create client'}</Button>
    </form>
  )
}

function ProjectForm({
  project,
  clients,
  isWorking,
  onSubmit,
}: {
  project: ProjectDoc | null
  clients: ClientDoc[]
  isWorking: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form className="sheet-form" onSubmit={onSubmit}>
      <FieldGroup>
        <Field><FieldLabel>Name</FieldLabel><Input name="name" defaultValue={project?.name ?? ''} /></Field>
        <Field>
          <FieldLabel>Client</FieldLabel>
          <Select name="clientId" defaultValue={project?.clientId ?? clients[0]?._id ?? ''}>
            <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {clients.map((client) => <SelectItem value={client._id} key={client._id}>{client.name}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field><FieldLabel>Hourly rate</FieldLabel><Input name="hourlyRate" type="number" min="1" step="0.01" defaultValue={project?.hourlyRate ?? 75} /></Field>
        <Field><FieldLabel>Currency</FieldLabel><Input name="currency" defaultValue={project?.currency ?? clients[0]?.defaultCurrency ?? defaultCurrency} /></Field>
        <Field>
          <FieldLabel>Status</FieldLabel>
          <Select name="status" defaultValue={project?.status ?? 'active'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="archived">archived</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field orientation="horizontal"><Checkbox name="billableDefault" defaultChecked={project?.billableDefault ?? true} /><FieldLabel>Billable by default</FieldLabel></Field>
      </FieldGroup>
      <Button type="submit" disabled={isWorking || clients.length === 0}>{project ? 'Save project' : 'Create project'}</Button>
    </form>
  )
}

function TimeEntryForm({
  entry,
  projects,
  isWorking,
  onSubmit,
}: {
  entry: EntryDoc | null
  projects: ProjectDoc[]
  isWorking: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const [defaultNow] = useState(() => Date.now())
  const start = entry ? toDateTimeInputValue(new Date(entry.startTime)) : toDateTimeInputValue(new Date(defaultNow - 60 * 60 * 1000))
  const end = entry ? toDateTimeInputValue(new Date(entry.endTime)) : toDateTimeInputValue(new Date(defaultNow))

  return (
    <form className="sheet-form" onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel>Project</FieldLabel>
          <Select name="projectId" defaultValue={entry?.projectId ?? projects[0]?._id ?? ''}>
            <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {projects.map((project) => <SelectItem value={project._id} key={project._id}>{project.name}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field><FieldLabel>Description</FieldLabel><Input name="description" defaultValue={entry?.description ?? ''} /></Field>
        <Field><FieldLabel>Start</FieldLabel><Input name="startTime" type="datetime-local" defaultValue={start} /></Field>
        <Field><FieldLabel>End</FieldLabel><Input name="endTime" type="datetime-local" defaultValue={end} /></Field>
        <Field orientation="horizontal"><Checkbox name="billable" defaultChecked={entry?.billable ?? true} /><FieldLabel>Billable</FieldLabel></Field>
      </FieldGroup>
      <Button type="submit" disabled={isWorking || projects.length === 0}>{entry ? 'Save entry' : 'Add entry'}</Button>
    </form>
  )
}

function InvoiceForm({
  clients,
  selectedClientId,
  onClientChange,
  entries,
  selectedIds,
  setSelectedIds,
  isWorking,
  onSubmit,
}: {
  clients: ClientDoc[]
  selectedClientId: string
  onClientChange: (clientId: string) => void
  entries: EntryDoc[]
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  isWorking: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const issueDate = toDateInputValue(new Date())
  const dueDate = toDateInputValue(addDays(new Date(), 14))

  function toggleEntry(entryId: string) {
    setSelectedIds(selectedIds.includes(entryId)
      ? selectedIds.filter((id) => id !== entryId)
      : [...selectedIds, entryId])
  }

  return (
    <form className="sheet-form" onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel>Client</FieldLabel>
          <Select
          name="clientId"
          value={selectedClientId}
          onValueChange={onClientChange}
        >
            <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {clients.map((client) => <SelectItem value={client._id} key={client._id}>{client.name}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field><FieldLabel>Issue date</FieldLabel><Input name="issueDate" type="date" defaultValue={issueDate} /></Field>
        <Field><FieldLabel>Due date</FieldLabel><Input name="dueDate" type="date" defaultValue={dueDate} /></Field>
      </FieldGroup>
      <FieldGroup className="entry-picker">
        <span>Billable entries</span>
        {entries.length === 0 ? (
          <p className="empty-state">No uninvoiced billable entries for this client.</p>
        ) : entries.map((entry) => (
          <Field orientation="horizontal" key={entry._id}>
            <Checkbox
              checked={selectedIds.includes(entry._id)}
              onCheckedChange={() => toggleEntry(entry._id)}
            />
            <FieldLabel>{entry.description} · {formatElapsedDuration(entry.durationMinutes * 60_000)}</FieldLabel>
          </Field>
        ))}
      </FieldGroup>
      <Button type="submit" disabled={isWorking || clients.length === 0 || selectedIds.length === 0}>Create invoice</Button>
    </form>
  )
}

function SettingsForm({
  user,
  isWorking,
  onSubmit,
}: {
  user: Dashboard['user'] | null
  isWorking: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form className="sheet-form" onSubmit={onSubmit}>
      <FieldGroup>
        <Field><FieldLabel>Display name</FieldLabel><Input name="displayName" defaultValue={user?.displayName ?? ''} /></Field>
        <Field><FieldLabel>Default currency</FieldLabel><Input name="defaultCurrency" defaultValue={user?.defaultCurrency ?? defaultCurrency} /></Field>
        <Field><FieldLabel>Invoice sender</FieldLabel><Input name="invoiceSenderName" defaultValue={user?.invoiceSenderName ?? user?.displayName ?? ''} /></Field>
        <Field><FieldLabel>Sender email</FieldLabel><Input name="invoiceSenderEmail" type="email" defaultValue={user?.invoiceSenderEmail ?? ''} /></Field>
        <Field><FieldLabel>Sender address</FieldLabel><Textarea name="invoiceSenderAddress" defaultValue={user?.invoiceSenderAddress ?? ''} /></Field>
      </FieldGroup>
      <Button type="submit" disabled={isWorking}>Save settings</Button>
    </form>
  )
}

function useInvoicePreview(dashboard: DashboardData): InvoicePreviewData | null {
  return useMemo(() => {
    if (!dashboard?.latestInvoice) return null
    const lines = (dashboard.invoiceLineItems ?? []).filter((item) => item.invoiceId === dashboard.latestInvoice?._id)
    return {
      invoiceNumber: dashboard.latestInvoice.invoiceNumber,
      dueDate: dashboard.latestInvoice.dueDate,
      status: dashboard.latestInvoice.status === 'void' ? 'void' : dashboard.latestInvoice.status,
      currency: dashboard.latestInvoice.currency,
      total: dashboard.latestInvoice.total,
      lineItems: lines.map((item) => ({
        label: item.description,
        hours: item.quantityHours,
        rate: item.rate,
        amount: item.amount,
      })),
    }
  }, [dashboard])
}

function groupPages() {
  return sectionOrder.reduce(
    (grouped, section) => ({
      ...grouped,
      [section]: appPages.filter((page) => page.section === section),
    }),
    {} as Record<AppPageSection, typeof appPages>,
  )
}

function newestEntryDate(entries: EntryDoc[]) {
  const latest = entries.reduce<number | null>((newest, entry) => (
    newest === null || entry.startTime > newest ? entry.startTime : newest
  ), null)

  return latest === null ? null : new Date(latest)
}

function buildProjectReportRows(entries: EntryDoc[], projects: ProjectDoc[], clients: ClientDoc[]) {
  const projectsById = new Map(projects.map((project) => [project._id, project]))
  const clientsById = new Map(clients.map((client) => [client._id, client]))
  const rows = new Map<string, {
    projectId: string
    projectName: string
    clientName: string
    currency: string
    minutes: number
    billableMinutes: number
    value: number
  }>()

  for (const entry of entries) {
    const project = projectsById.get(entry.projectId)
    const client = project ? clientsById.get(project.clientId) : null
    const row = rows.get(entry.projectId) ?? {
      projectId: entry.projectId,
      projectName: project?.name ?? 'Unknown project',
      clientName: client?.name ?? 'Unknown client',
      currency: project?.currency ?? defaultCurrency,
      minutes: 0,
      billableMinutes: 0,
      value: 0,
    }

    row.minutes += entry.durationMinutes
    if (entry.billable) {
      row.billableMinutes += entry.durationMinutes
      row.value += (entry.durationMinutes / 60) * entry.hourlyRate
    }
    rows.set(entry.projectId, row)
  }

  return [...rows.values()]
    .map((row) => ({ ...row, value: Math.round(row.value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
}

function buildInvoiceStatusRows(invoices: InvoiceDoc[]) {
  const statuses: InvoiceDoc['status'][] = ['draft', 'ready', 'sent', 'paid', 'void']
  return statuses.map((status) => {
    const statusInvoices = invoices.filter((invoice) => invoice.status === status)
    return {
      status,
      count: statusInvoices.length,
      total: statusInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
    }
  }).filter((row) => row.count > 0 || row.status === 'ready')
}

function formatWeekLabel(referenceDate: Date) {
  const start = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()))
  const day = start.getUTCDay()
  start.setUTCDate(start.getUTCDate() + (day === 0 ? -6 : 1 - day))
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)

  return `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })} - ${end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })}`
}

function billableEntriesForClient(dashboard: DashboardData, clientId: string) {
  if (!dashboard || !clientId) return []
  const projectIds = new Set(dashboard.projects.filter((project) => project.clientId === clientId).map((project) => project._id))
  return dashboard.entries.filter((entry) => entry.billable && !entry.invoiceId && projectIds.has(entry.projectId))
}

function publicInvoiceTokenFromPath() {
  const match = window.location.pathname.match(/^\/invoice\/([^/]+)$/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

function publicInvoiceUrl(publicToken: string) {
  return `${window.location.origin}/invoice/${encodeURIComponent(publicToken)}`
}

function sheetTitle(sheet: ActiveSheet) {
  if (sheet === 'client') return 'Client'
  if (sheet === 'project') return 'Project'
  if (sheet === 'time') return 'Time entry'
  if (sheet === 'invoice') return 'Create invoice'
  if (sheet === 'settings') return 'Invoice settings'
  if (sheet === 'mobile-nav') return 'Navigation'
  return ''
}

function sheetDescription(sheet: ActiveSheet) {
  if (sheet === 'client') return 'Add or update the contact and billing details for this client.'
  if (sheet === 'project') return 'Connect work to a client, rate, currency, and billing preference.'
  if (sheet === 'time') return 'Record a billable or internal block of tracked work.'
  if (sheet === 'invoice') return 'Choose a client and the uninvoiced entries to include.'
  if (sheet === 'settings') return 'Update the details shown on client-facing invoices.'
  if (sheet === 'mobile-nav') return 'Open a workspace that is not pinned to the bottom navigation.'
  return ''
}

function valueOf(form: FormData, key: string) {
  return String(form.get(key) ?? '').trim()
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function toDateTimeInputValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

const sectionOrder: AppPageSection[] = ['track', 'analyze', 'manage', 'admin']

const sectionLabels: Record<AppPageSection, string> = {
  track: 'Track',
  analyze: 'Analyze',
  manage: 'Manage',
  admin: 'Admin',
}

export default App
