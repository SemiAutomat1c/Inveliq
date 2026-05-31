import { v } from 'convex/values'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

const fallbackOwnerId = 'personal-dev-user'
const defaultCurrency = 'USD'

async function ownerId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  return identity?.subject ?? fallbackOwnerId
}

function durationMinutes(startTime: number, endTime: number) {
  if (endTime < startTime) {
    throw new Error('End time must be after start time')
  }

  return Math.max(1, Math.round((endTime - startTime) / 60_000))
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function formatMoney(amount: number, currency: string) {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function invoicePublicToken() {
  return crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
}

async function ensureInvoicePublicToken(ctx: MutationCtx, invoiceId: Id<'invoices'>, owner: string) {
  const invoice = await ownedInvoice(ctx, invoiceId, owner)
  if (invoice.publicToken) {
    return invoice.publicToken
  }

  const publicToken = invoicePublicToken()
  await ctx.db.patch(invoiceId, { publicToken })
  return publicToken
}

function displayDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

async function ownedClient(ctx: QueryCtx | MutationCtx, id: Id<'clients'>, owner: string) {
  const client = await ctx.db.get(id)
  if (!client || client.ownerId !== owner) {
    throw new Error('Client not found')
  }
  return client
}

async function ownedProject(ctx: QueryCtx | MutationCtx, id: Id<'projects'>, owner: string) {
  const project = await ctx.db.get(id)
  if (!project || project.ownerId !== owner) {
    throw new Error('Project not found')
  }
  return project
}

async function ownedInvoice(ctx: QueryCtx | MutationCtx, id: Id<'invoices'>, owner: string) {
  const invoice = await ctx.db.get(id)
  if (!invoice || invoice.ownerId !== owner) {
    throw new Error('Invoice not found')
  }
  return invoice
}

export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    const owner = await ownerId(ctx)
    const [user, clients, projects, entries, timers, invoices, invoiceLineItems, emailDrafts] = await Promise.all([
      ctx.db.query('users').withIndex('by_owner', (q) => q.eq('ownerId', owner)).first(),
      ctx.db.query('clients').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
      ctx.db.query('projects').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
      ctx.db.query('timeEntries').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
      ctx.db.query('timers').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
      ctx.db.query('invoices').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
      ctx.db.query('invoiceLineItems').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
      ctx.db.query('emailDrafts').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
    ])

    const billableEntries = entries.filter((entry) => entry.billable && !entry.invoiceId)
    const readyToInvoice = roundMoney(
      billableEntries.reduce((sum, entry) => sum + (entry.durationMinutes / 60) * entry.hourlyRate, 0),
    )
    const totalMinutes = entries.reduce((sum, entry) => sum + entry.durationMinutes, 0)
    const latestInvoice = [...invoices].sort((a, b) => b._creationTime - a._creationTime)[0] ?? null

    return {
      user,
      clients,
      projects,
      entries: [...entries].sort((a, b) => b.startTime - a.startTime),
      activeTimer: timers[0] ?? null,
      invoices: [...invoices].sort((a, b) => b._creationTime - a._creationTime),
      invoiceLineItems,
      latestInvoice,
      latestEmailDraft: [...emailDrafts].sort((a, b) => b.createdAt - a.createdAt)[0] ?? null,
      stats: {
        totalHours: roundMoney(totalMinutes / 60),
        readyToInvoice,
        billableEntryCount: billableEntries.length,
      },
    }
  },
})

export const createClient = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    defaultCurrency: v.string(),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    return await ctx.db.insert('clients', {
      ownerId: owner,
      name: args.name.trim(),
      email: args.email.trim(),
      address: args.address?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
      defaultCurrency: args.defaultCurrency.trim() || defaultCurrency,
    })
  },
})

export const updateClient = mutation({
  args: {
    clientId: v.id('clients'),
    name: v.string(),
    email: v.string(),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    defaultCurrency: v.string(),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    await ownedClient(ctx, args.clientId, owner)
    await ctx.db.patch(args.clientId, {
      name: args.name.trim(),
      email: args.email.trim(),
      address: args.address?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
      defaultCurrency: args.defaultCurrency.trim() || defaultCurrency,
    })
  },
})

export const deleteClient = mutation({
  args: {
    clientId: v.id('clients'),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    await ownedClient(ctx, args.clientId, owner)
    const [projects, invoices] = await Promise.all([
      ctx.db.query('projects').withIndex('by_client', (q) => q.eq('clientId', args.clientId)).collect(),
      ctx.db.query('invoices').withIndex('by_client', (q) => q.eq('clientId', args.clientId)).collect(),
    ])
    if (projects.some((project) => project.ownerId === owner) || invoices.some((invoice) => invoice.ownerId === owner)) {
      throw new Error('Clients with projects or invoices cannot be deleted')
    }
    await ctx.db.delete(args.clientId)
  },
})

export const createProject = mutation({
  args: {
    clientId: v.id('clients'),
    name: v.string(),
    hourlyRate: v.number(),
    currency: v.string(),
    billableDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    await ownedClient(ctx, args.clientId, owner)
    return await ctx.db.insert('projects', {
      ownerId: owner,
      clientId: args.clientId,
      name: args.name.trim(),
      hourlyRate: args.hourlyRate,
      currency: args.currency.trim() || defaultCurrency,
      status: 'active',
      billableDefault: args.billableDefault,
    })
  },
})

export const updateProject = mutation({
  args: {
    projectId: v.id('projects'),
    clientId: v.id('clients'),
    name: v.string(),
    hourlyRate: v.number(),
    currency: v.string(),
    status: v.union(v.literal('active'), v.literal('archived')),
    billableDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    await ownedProject(ctx, args.projectId, owner)
    await ownedClient(ctx, args.clientId, owner)
    await ctx.db.patch(args.projectId, {
      clientId: args.clientId,
      name: args.name.trim(),
      hourlyRate: args.hourlyRate,
      currency: args.currency.trim() || defaultCurrency,
      status: args.status,
      billableDefault: args.billableDefault,
    })
  },
})

export const archiveProject = mutation({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    await ownedProject(ctx, args.projectId, owner)
    await ctx.db.patch(args.projectId, { status: 'archived' })
  },
})

export const deleteProject = mutation({
  args: {
    projectId: v.id('projects'),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    await ownedProject(ctx, args.projectId, owner)
    const [entries, timers] = await Promise.all([
      ctx.db.query('timeEntries').withIndex('by_project', (q) => q.eq('projectId', args.projectId)).collect(),
      ctx.db.query('timers').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
    ])
    if (entries.some((entry) => entry.ownerId === owner) || timers.some((timer) => timer.projectId === args.projectId)) {
      throw new Error('Projects with tracked time cannot be deleted. Archive the project instead.')
    }
    await ctx.db.delete(args.projectId)
  },
})

export const updateUserSettings = mutation({
  args: {
    displayName: v.string(),
    defaultCurrency: v.string(),
    invoiceSenderName: v.string(),
    invoiceSenderEmail: v.optional(v.string()),
    invoiceSenderAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    const existing = await ctx.db.query('users').withIndex('by_owner', (q) => q.eq('ownerId', owner)).first()
    const settings = {
      ownerId: owner,
      displayName: args.displayName.trim() || 'Freelancer',
      defaultCurrency: args.defaultCurrency.trim() || defaultCurrency,
      invoiceSenderName: args.invoiceSenderName.trim() || args.displayName.trim() || 'Freelancer',
      invoiceSenderEmail: args.invoiceSenderEmail?.trim() || undefined,
      invoiceSenderAddress: args.invoiceSenderAddress?.trim() || undefined,
    }

    if (existing) {
      await ctx.db.patch(existing._id, settings)
      return existing._id
    }

    return await ctx.db.insert('users', settings)
  },
})

export const clearWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    const owner = await ownerId(ctx)
    const [emailDrafts, invoiceLineItems, invoices, timers, timeEntries, projects, clients, users] = await Promise.all([
      ctx.db.query('emailDrafts').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
      ctx.db.query('invoiceLineItems').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
      ctx.db.query('invoices').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
      ctx.db.query('timers').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
      ctx.db.query('timeEntries').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
      ctx.db.query('projects').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
      ctx.db.query('clients').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
      ctx.db.query('users').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect(),
    ])
    const docs = [...emailDrafts, ...invoiceLineItems, ...invoices, ...timers, ...timeEntries, ...projects, ...clients, ...users]

    for (const doc of docs) {
      await ctx.db.delete(doc._id)
    }

    return { deleted: docs.length }
  },
})

export const startTimer = mutation({
  args: {
    projectId: v.id('projects'),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    const project = await ownedProject(ctx, args.projectId, owner)
    const active = await ctx.db.query('timers').withIndex('by_owner', (q) => q.eq('ownerId', owner)).first()
    if (active) {
      throw new Error('A timer is already running')
    }

    return await ctx.db.insert('timers', {
      ownerId: owner,
      projectId: args.projectId,
      startedAt: Date.now(),
      description: args.description,
      billable: project.billableDefault,
      hourlyRate: project.hourlyRate,
    })
  },
})

export const stopTimer = mutation({
  args: {},
  handler: async (ctx) => {
    const owner = await ownerId(ctx)
    const active = await ctx.db.query('timers').withIndex('by_owner', (q) => q.eq('ownerId', owner)).first()
    if (!active) {
      throw new Error('No timer is running')
    }

    const endTime = Date.now()
    const entryId = await ctx.db.insert('timeEntries', {
      ownerId: owner,
      projectId: active.projectId,
      startTime: active.startedAt,
      endTime,
      durationMinutes: durationMinutes(active.startedAt, endTime),
      description: active.description,
      billable: active.billable,
      hourlyRate: active.hourlyRate,
    })
    await ctx.db.delete(active._id)
    return entryId
  },
})

export const addManualEntry = mutation({
  args: {
    projectId: v.id('projects'),
    description: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    billable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    const project = await ownedProject(ctx, args.projectId, owner)
    return await ctx.db.insert('timeEntries', {
      ownerId: owner,
      projectId: args.projectId,
      startTime: args.startTime,
      endTime: args.endTime,
      durationMinutes: durationMinutes(args.startTime, args.endTime),
      description: args.description,
      billable: args.billable,
      hourlyRate: project.hourlyRate,
    })
  },
})

export const updateTimeEntry = mutation({
  args: {
    entryId: v.id('timeEntries'),
    projectId: v.id('projects'),
    description: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    billable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    const entry = await ctx.db.get(args.entryId)
    if (!entry || entry.ownerId !== owner) {
      throw new Error('Time entry not found')
    }
    if (entry.invoiceId) {
      throw new Error('Invoiced entries cannot be edited')
    }
    const project = await ownedProject(ctx, args.projectId, owner)
    await ctx.db.patch(args.entryId, {
      projectId: args.projectId,
      startTime: args.startTime,
      endTime: args.endTime,
      durationMinutes: durationMinutes(args.startTime, args.endTime),
      description: args.description.trim(),
      billable: args.billable,
      hourlyRate: project.hourlyRate,
    })
  },
})

export const deleteTimeEntry = mutation({
  args: {
    entryId: v.id('timeEntries'),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    const entry = await ctx.db.get(args.entryId)
    if (!entry || entry.ownerId !== owner) {
      throw new Error('Time entry not found')
    }
    if (entry.invoiceId) {
      throw new Error('Invoiced entries cannot be deleted')
    }
    await ctx.db.delete(args.entryId)
  },
})

export const createInvoiceFromBillableEntries = mutation({
  args: {
    clientId: v.id('clients'),
    issueDate: v.string(),
    dueDate: v.string(),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    const client = await ownedClient(ctx, args.clientId, owner)
    const entries = await ctx.db.query('timeEntries').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect()
    const billableEntries = entries.filter((entry) => entry.billable && !entry.invoiceId)
    if (billableEntries.length === 0) {
      throw new Error('No billable entries are ready to invoice')
    }

    const invoiceCount = (await ctx.db.query('invoices').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect()).length
    const invoiceNumber = `INV-${new Date().getUTCFullYear()}-${String(invoiceCount + 1).padStart(3, '0')}`
    const lineItems = billableEntries.map((entry) => {
      const quantityHours = roundMoney(entry.durationMinutes / 60)
      const amount = roundMoney(quantityHours * entry.hourlyRate)
      return {
        sourceTimeEntryIds: [entry._id],
        description: entry.description,
        quantityHours,
        rate: entry.hourlyRate,
        amount,
      }
    })
    const subtotal = roundMoney(lineItems.reduce((sum, item) => sum + item.amount, 0))
    const invoiceId = await ctx.db.insert('invoices', {
      ownerId: owner,
      clientId: args.clientId,
      invoiceNumber,
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      status: 'ready',
      currency: client.defaultCurrency || defaultCurrency,
      subtotal,
      tax: 0,
      discount: 0,
      total: subtotal,
      publicToken: invoicePublicToken(),
    })

    for (const item of lineItems) {
      await ctx.db.insert('invoiceLineItems', {
        ownerId: owner,
        invoiceId,
        ...item,
      })
      for (const entryId of item.sourceTimeEntryIds) {
        await ctx.db.patch(entryId, { invoiceId })
      }
    }

    return invoiceId
  },
})

export const createInvoiceFromEntries = mutation({
  args: {
    clientId: v.id('clients'),
    timeEntryIds: v.array(v.id('timeEntries')),
    issueDate: v.string(),
    dueDate: v.string(),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    const client = await ownedClient(ctx, args.clientId, owner)
    if (args.timeEntryIds.length === 0) {
      throw new Error('Select at least one billable entry')
    }

    const selectedEntries = []
    for (const entryId of args.timeEntryIds) {
      const entry = await ctx.db.get(entryId)
      if (!entry || entry.ownerId !== owner) {
        throw new Error('Time entry not found')
      }
      if (!entry.billable || entry.invoiceId) {
        throw new Error('Only uninvoiced billable entries can be invoiced')
      }
      const project = await ownedProject(ctx, entry.projectId, owner)
      if (project.clientId !== args.clientId) {
        throw new Error('Selected entries must belong to the invoice client')
      }
      selectedEntries.push(entry)
    }

    const invoiceCount = (await ctx.db.query('invoices').withIndex('by_owner', (q) => q.eq('ownerId', owner)).collect()).length
    const invoiceNumber = `INV-${new Date().getUTCFullYear()}-${String(invoiceCount + 1).padStart(3, '0')}`
    const lineItems = selectedEntries.map((entry) => {
      const quantityHours = roundMoney(entry.durationMinutes / 60)
      const amount = roundMoney(quantityHours * entry.hourlyRate)
      return {
        sourceTimeEntryIds: [entry._id],
        description: entry.description,
        quantityHours,
        rate: entry.hourlyRate,
        amount,
      }
    })
    const subtotal = roundMoney(lineItems.reduce((sum, item) => sum + item.amount, 0))
    const invoiceId = await ctx.db.insert('invoices', {
      ownerId: owner,
      clientId: args.clientId,
      invoiceNumber,
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      status: 'ready',
      currency: client.defaultCurrency || defaultCurrency,
      subtotal,
      tax: 0,
      discount: 0,
      total: subtotal,
      publicToken: invoicePublicToken(),
    })

    for (const item of lineItems) {
      await ctx.db.insert('invoiceLineItems', {
        ownerId: owner,
        invoiceId,
        ...item,
      })
      for (const entryId of item.sourceTimeEntryIds) {
        await ctx.db.patch(entryId, { invoiceId })
      }
    }

    return invoiceId
  },
})

export const updateInvoiceStatus = mutation({
  args: {
    invoiceId: v.id('invoices'),
    status: v.union(
      v.literal('draft'),
      v.literal('ready'),
      v.literal('sent'),
      v.literal('paid'),
      v.literal('void'),
    ),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    await ownedInvoice(ctx, args.invoiceId, owner)
    await ctx.db.patch(args.invoiceId, { status: args.status })
  },
})

export const ensureInvoiceLink = mutation({
  args: {
    invoiceId: v.id('invoices'),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    return await ensureInvoicePublicToken(ctx, args.invoiceId, owner)
  },
})

export const getPublicInvoice = query({
  args: {
    publicToken: v.string(),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db
      .query('invoices')
      .withIndex('by_public_token', (q) => q.eq('publicToken', args.publicToken))
      .first()
    if (!invoice) {
      return null
    }

    const [client, user, lineItems] = await Promise.all([
      ctx.db.get(invoice.clientId),
      ctx.db.query('users').withIndex('by_owner', (q) => q.eq('ownerId', invoice.ownerId)).first(),
      ctx.db.query('invoiceLineItems').withIndex('by_invoice', (q) => q.eq('invoiceId', invoice._id)).collect(),
    ])

    if (!client || client.ownerId !== invoice.ownerId) {
      return null
    }

    return {
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        currency: invoice.currency,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        discount: invoice.discount,
        total: invoice.total,
        publicViewedAt: invoice.publicViewedAt,
      },
      client: {
        name: client.name,
        email: client.email,
        address: client.address,
      },
      sender: {
        name: user?.invoiceSenderName ?? user?.displayName ?? 'Inveliq',
        email: user?.invoiceSenderEmail,
        address: user?.invoiceSenderAddress,
      },
      lineItems: lineItems.map((item) => ({
        description: item.description,
        quantityHours: item.quantityHours,
        rate: item.rate,
        amount: item.amount,
      })),
    }
  },
})

export const recordPublicInvoiceView = mutation({
  args: {
    publicToken: v.string(),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db
      .query('invoices')
      .withIndex('by_public_token', (q) => q.eq('publicToken', args.publicToken))
      .first()
    if (!invoice || invoice.publicViewedAt) {
      return null
    }
    await ctx.db.patch(invoice._id, { publicViewedAt: Date.now() })
    return invoice._id
  },
})

export const prepareEmailDraft = mutation({
  args: {
    invoiceId: v.id('invoices'),
    appOrigin: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const owner = await ownerId(ctx)
    const invoice = await ctx.db.get(args.invoiceId)
    if (!invoice || invoice.ownerId !== owner) {
      throw new Error('Invoice not found')
    }
    const client = await ownedClient(ctx, invoice.clientId, owner)
    const user = await ctx.db.query('users').withIndex('by_owner', (q) => q.eq('ownerId', owner)).first()
    const senderName = user?.invoiceSenderName ?? user?.displayName ?? 'Inveliq'
    const publicToken = await ensureInvoicePublicToken(ctx, args.invoiceId, owner)
    const invoiceUrl = args.appOrigin ? `${args.appOrigin.replace(/\/$/, '')}/invoice/${publicToken}` : undefined

    return await ctx.db.insert('emailDrafts', {
      ownerId: owner,
      invoiceId: args.invoiceId,
      subject: `Invoice ${invoice.invoiceNumber} from Inveliq`,
      body: [
        `Hi ${client.name},`,
        '',
        `Invoice ${invoice.invoiceNumber} is ready for the tracked work.`,
        '',
        `Total: ${formatMoney(invoice.total, invoice.currency)}`,
        `Due: ${displayDate(invoice.dueDate)}`,
        ...(invoiceUrl ? ['', `View invoice: ${invoiceUrl}`] : []),
        '',
        'Thanks,',
        senderName,
      ].join('\n'),
      createdAt: Date.now(),
    })
  },
})
