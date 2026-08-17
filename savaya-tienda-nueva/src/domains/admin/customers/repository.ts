import { db } from '@/shared/lib/db'
import { sql } from 'drizzle-orm'
import { customerNotes, customerTags } from '@/domains/customers/schema'
import { auditLog } from '@/domains/audit-log/schema'
import { eq, and } from 'drizzle-orm'
import type {
  CustomerListItem,
  CustomerDetail,
  CustomerNote,
  CustomerTag,
  AdminCustomerFilters,
} from './types'

const PAGE_SIZE = 25

export async function listAdminCustomers(
  filters: AdminCustomerFilters = {},
): Promise<{ items: CustomerListItem[]; total: number }> {
  const { search, tag, page = 1 } = filters
  const offset = (page - 1) * PAGE_SIZE

  const searchFilter = search
    ? sql`AND (
        c.first_name ILIKE ${'%' + search + '%'}
        OR c.last_name  ILIKE ${'%' + search + '%'}
        OR c.email      ILIKE ${'%' + search + '%'}
        OR c.phone      ILIKE ${'%' + search + '%'}
      )`
    : sql``

  const tagFilter = tag
    ? sql`AND EXISTS (
        SELECT 1 FROM customer_tags ct
        WHERE ct.customer_id = c.id AND ct.tag = ${tag}
      )`
    : sql``

  const rows = await db.execute<{
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    whatsapp: string | null
    total_orders: number
    total_spent_usd: string
    last_order_at: Date | null
    created_at: Date
    tags: string | null
    city: string | null
    state: string | null
  }>(sql`
    SELECT
      c.id,
      c.first_name,
      c.last_name,
      c.email,
      c.phone,
      c.whatsapp,
      c.total_orders,
      c.total_spent_usd,
      c.last_order_at,
      c.created_at,
      -- aggregate tags as comma-separated string
      (SELECT string_agg(ct.tag::text, ',') FROM customer_tags ct WHERE ct.customer_id = c.id) AS tags,
      -- default address location
      (SELECT a.city  FROM addresses a WHERE a.customer_id = c.id AND a.is_default = true LIMIT 1) AS city,
      (SELECT a.state FROM addresses a WHERE a.customer_id = c.id AND a.is_default = true LIMIT 1) AS state
    FROM customers c
    WHERE c.is_active = true
      ${searchFilter}
      ${tagFilter}
    ORDER BY c.last_order_at DESC NULLS LAST, c.created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `)

  const [{ count }] = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text AS count
    FROM customers c
    WHERE c.is_active = true
      ${searchFilter}
      ${tagFilter}
  `)

  return {
    items: rows.map((r) => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      phone: r.phone,
      whatsapp: r.whatsapp,
      totalOrders: Number(r.total_orders),
      totalSpentUsd: r.total_spent_usd,
      lastOrderAt: r.last_order_at,
      createdAt: r.created_at,
      tags: r.tags ? (r.tags.split(',') as CustomerTag[]) : [],
      city: r.city,
      state: r.state,
    })),
    total: Number(count),
  }
}

export async function getAdminCustomerById(
  customerId: string,
): Promise<CustomerDetail | null> {
  const [customer] = await db.execute<{
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    whatsapp: string | null
    is_active: boolean
    total_orders: number
    total_spent_usd: string
    last_order_at: Date | null
    created_at: Date
  }>(sql`
    SELECT id, first_name, last_name, email, phone, whatsapp,
           is_active, total_orders, total_spent_usd, last_order_at, created_at
    FROM customers
    WHERE id = ${customerId}
    LIMIT 1
  `)

  if (!customer) return null

  const [tags, notes, orders, addresses] = await Promise.all([
    db.execute<{ tag: string }>(sql`
      SELECT tag FROM customer_tags WHERE customer_id = ${customerId}
    `),

    db.execute<{
      id: string
      content: string
      author_email: string | null
      created_at: Date
    }>(sql`
      SELECT cn.id, cn.content, u.email AS author_email, cn.created_at
      FROM customer_notes cn
      LEFT JOIN users u ON u.id = cn.author_id
      WHERE cn.customer_id = ${customerId}
      ORDER BY cn.created_at DESC
    `),

    db.execute<{
      id: string
      order_number: string
      status: string
      total_usd: string
      total_bs: string
      item_count: number
      created_at: Date
    }>(sql`
      SELECT
        o.id,
        o.order_number,
        o.status,
        o.total_usd,
        o.total_bs,
        (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id)::int AS item_count,
        o.created_at
      FROM orders o
      WHERE o.customer_id = ${customerId}
      ORDER BY o.created_at DESC
      LIMIT 20
    `),

    db.execute<{
      id: string
      label: string
      state: string
      city: string
      address: string
      is_default: boolean
    }>(sql`
      SELECT id, label, state, city, address, is_default
      FROM addresses
      WHERE customer_id = ${customerId}
      ORDER BY is_default DESC, created_at DESC
    `),
  ])

  const totalSpent = Number(customer.total_spent_usd)
  const totalOrders = Number(customer.total_orders)
  const avgTicket = totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : '0.00'

  return {
    id: customer.id,
    firstName: customer.first_name,
    lastName: customer.last_name,
    email: customer.email,
    phone: customer.phone,
    whatsapp: customer.whatsapp,
    isActive: customer.is_active,
    totalOrders,
    totalSpentUsd: customer.total_spent_usd,
    avgTicketUsd: avgTicket,
    lastOrderAt: customer.last_order_at,
    createdAt: customer.created_at,
    tags: tags.map((t) => t.tag as CustomerTag),
    notes: notes.map((n) => ({
      id: n.id,
      content: n.content,
      authorEmail: n.author_email,
      createdAt: n.created_at,
    })),
    recentOrders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      totalUsd: o.total_usd,
      totalBs: o.total_bs,
      itemCount: Number(o.item_count),
      createdAt: o.created_at,
    })),
    addresses: addresses.map((a) => ({
      id: a.id,
      label: a.label,
      state: a.state,
      city: a.city,
      address: a.address,
      isDefault: a.is_default,
    })),
  }
}

type ActorContext = { actorId: string; actorEmail: string; ip: string }

export async function addCustomerNote(
  customerId: string,
  content: string,
  actor: ActorContext,
): Promise<CustomerNote> {
  const [note] = await db
    .insert(customerNotes)
    .values({ customerId, authorId: actor.actorId, content })
    .returning()

  await db.insert(auditLog).values({
    actorId: actor.actorId,
    actorEmail: actor.actorEmail,
    action: 'customer.note_added',
    resourceType: 'customer',
    resourceId: customerId,
    after: { noteId: note.id, preview: content.slice(0, 80) },
    ip: actor.ip,
  })

  return {
    id: note.id,
    content: note.content,
    authorEmail: actor.actorEmail,
    createdAt: note.createdAt,
  }
}

export async function setCustomerTag(
  customerId: string,
  tag: CustomerTag,
  active: boolean,
  actor: ActorContext,
): Promise<void> {
  if (active) {
    // INSERT OR IGNORE (primary key conflict = tag already set)
    await db.execute(sql`
      INSERT INTO customer_tags (customer_id, tag)
      VALUES (${customerId}, ${tag})
      ON CONFLICT DO NOTHING
    `)
  } else {
    await db
      .delete(customerTags)
      .where(and(eq(customerTags.customerId, customerId), eq(customerTags.tag, tag)))
  }

  await db.insert(auditLog).values({
    actorId: actor.actorId,
    actorEmail: actor.actorEmail,
    action: active ? 'customer.tag_added' : 'customer.tag_removed',
    resourceType: 'customer',
    resourceId: customerId,
    after: { tag },
    ip: actor.ip,
  })
}
