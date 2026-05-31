import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    ownerId: v.string(),
    displayName: v.string(),
    defaultCurrency: v.string(),
    invoiceSenderName: v.string(),
    invoiceSenderEmail: v.optional(v.string()),
    invoiceSenderAddress: v.optional(v.string()),
  }).index('by_owner', ['ownerId']),

  clients: defineTable({
    ownerId: v.string(),
    name: v.string(),
    email: v.string(),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    defaultCurrency: v.string(),
  }).index('by_owner', ['ownerId']),

  projects: defineTable({
    ownerId: v.string(),
    clientId: v.id('clients'),
    name: v.string(),
    hourlyRate: v.number(),
    currency: v.string(),
    status: v.union(v.literal('active'), v.literal('archived')),
    billableDefault: v.boolean(),
  })
    .index('by_owner', ['ownerId'])
    .index('by_client', ['clientId']),

  timeEntries: defineTable({
    ownerId: v.string(),
    projectId: v.id('projects'),
    startTime: v.number(),
    endTime: v.number(),
    durationMinutes: v.number(),
    description: v.string(),
    billable: v.boolean(),
    hourlyRate: v.number(),
    invoiceId: v.optional(v.id('invoices')),
  })
    .index('by_owner', ['ownerId'])
    .index('by_project', ['projectId'])
    .index('by_invoice', ['invoiceId']),

  timers: defineTable({
    ownerId: v.string(),
    projectId: v.id('projects'),
    startedAt: v.number(),
    description: v.string(),
    billable: v.boolean(),
    hourlyRate: v.number(),
  }).index('by_owner', ['ownerId']),

  invoices: defineTable({
    ownerId: v.string(),
    clientId: v.id('clients'),
    invoiceNumber: v.string(),
    issueDate: v.string(),
    dueDate: v.string(),
    status: v.union(
      v.literal('draft'),
      v.literal('ready'),
      v.literal('sent'),
      v.literal('paid'),
      v.literal('void'),
    ),
    currency: v.string(),
    subtotal: v.number(),
    tax: v.number(),
    discount: v.number(),
    total: v.number(),
    publicToken: v.optional(v.string()),
    publicViewedAt: v.optional(v.number()),
  })
    .index('by_owner', ['ownerId'])
    .index('by_client', ['clientId'])
    .index('by_public_token', ['publicToken']),

  invoiceLineItems: defineTable({
    ownerId: v.string(),
    invoiceId: v.id('invoices'),
    sourceTimeEntryIds: v.array(v.id('timeEntries')),
    description: v.string(),
    quantityHours: v.number(),
    rate: v.number(),
    amount: v.number(),
  })
    .index('by_owner', ['ownerId'])
    .index('by_invoice', ['invoiceId']),

  emailDrafts: defineTable({
    ownerId: v.string(),
    invoiceId: v.id('invoices'),
    subject: v.string(),
    body: v.string(),
    createdAt: v.number(),
  })
    .index('by_owner', ['ownerId'])
    .index('by_invoice', ['invoiceId']),
})
