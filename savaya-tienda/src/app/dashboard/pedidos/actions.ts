'use server'

/*
  ── SQL: ejecutar en Supabase SQL Editor antes de usar el historial ────────────

  create table order_status_history (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references orders on delete cascade not null,
    previous_status text,
    new_status text not null,
    note text,
    changed_at timestamptz default now()
  );

  alter table order_status_history enable row level security;

  create policy "Admin full access" on order_status_history
    for all using (true) with check (true);

  ──────────────────────────────────────────────────────────────────────────────
*/

import { createAdminClient, requireAdminOrRoles } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ORDER_STATUS_CONFIG } from '@/lib/constants'
import { sendOrderShippedEmail } from '@/lib/email'
import type { OrderStatus } from '@/lib/types'

export type ActionResult = { error: string } | { success: true }

// ─── Update order status + email + history ────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  previousStatus: OrderStatus,
  orderEmail: string,
  orderNumber: string,
): Promise<ActionResult> {
  await requireAdminOrRoles('gestor_pedidos')
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  if (error) return { error: error.message }

  // Insert history entry (non-blocking — graceful if table doesn't exist yet)
  // Non-blocking history insert — wrapped to prevent unhandled rejection
  void supabase
    .from('order_status_history')
    .insert({ order_id: orderId, previous_status: previousStatus, new_status: newStatus })
    .then(() => undefined)

  // Send email notification (non-blocking)
  void (async () => {
    try {
      if (newStatus === 'shipped') {
        const supabaseInner = await createAdminClient()
        const { data: order } = await supabaseInner
          .from('orders')
          .select('tracking_number, shipping_address')
          .eq('id', orderId)
          .single()

        await sendOrderShippedEmail({
          email: orderEmail,
          customerName: (order?.shipping_address as { name?: string } | null)?.name ?? '',
          orderNumber,
          orderId,
          trackingNumber: order?.tracking_number ?? null,
        })
      } else {
        await sendStatusUpdateEmail(orderEmail, orderNumber, newStatus)
      }
    } catch {
      // Email failure does not block status update
    }
  })()

  revalidatePath('/dashboard/pedidos')
  revalidatePath(`/dashboard/pedidos/${orderId}`)
  return { success: true }
}

// ─── Update tracking number ───────────────────────────────────────────────────

export async function updateTrackingNumber(
  orderId: string,
  trackingNumber: string,
): Promise<ActionResult> {
  await requireAdminOrRoles('gestor_pedidos')
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('orders')
    .update({ tracking_number: trackingNumber.trim() || null })
    .eq('id', orderId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/pedidos/${orderId}`)
  return { success: true }
}

// ─── Generic status update email (non-shipped statuses) ──────────────────────

// ─── Delete orders ────────────────────────────────────────────────────────────

export async function deleteOrders(orderIds: string[]): Promise<ActionResult> {
  await requireAdminOrRoles('gestor_pedidos')
  if (!orderIds.length) return { error: 'No hay pedidos seleccionados.' }

  const supabase = await createAdminClient()
  const { error } = await supabase.from('orders').delete().in('id', orderIds)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/pedidos')
  return { success: true }
}

// ─── Pause / resume orders ────────────────────────────────────────────────────

export async function pauseOrders(
  orderIds: string[],
  pause: boolean,
): Promise<ActionResult> {
  await requireAdminOrRoles('gestor_pedidos')
  if (!orderIds.length) return { error: 'No hay pedidos seleccionados.' }

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('orders')
    .update({ status: pause ? 'on_hold' : 'pending' })
    .in('id', orderIds)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/pedidos')
  return { success: true }
}

// ─── Generic status update email (non-shipped statuses) ──────────────────────

async function sendStatusUpdateEmail(
  orderEmail: string,
  orderNumber: string,
  status: OrderStatus,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const statusLabel = ORDER_STATUS_CONFIG[status].label

  const messages: Partial<Record<OrderStatus, string>> = {
    paid: 'Recibimos el pago de tu pedido y ya lo estamos preparando.',
    processing: 'Nuestro equipo está preparando tu pedido con cuidado.',
    delivered: '¡Tu pedido fue entregado! Esperamos que lo disfrutes.',
    cancelled: 'Tu pedido ha sido cancelado. Si tienes preguntas, contáctanos.',
    returned: 'Tu pedido ha sido marcado como devuelto.',
  }

  const message = messages[status] ?? 'El estado de tu pedido ha sido actualizado.'

  await resend.emails.send({
    from: `Savaya <${process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'}>`,
    to: orderEmail,
    subject: `Tu pedido ${orderNumber} — ${statusLabel}`,
    html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:4px;overflow:hidden;">
    <div style="background:#1a1a2e;padding:24px 32px;">
      <p style="margin:0;font-size:17px;font-weight:900;letter-spacing:5px;color:#ffffff;">TULUJOSHOP</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:13px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Actualización de pedido</p>
      <h1 style="margin:0 0 24px;font-size:22px;color:#111111;font-weight:700;">Pedido ${orderNumber}</h1>
      <div style="background:#f5f5f5;border-left:3px solid #1a1a2e;padding:16px 20px;margin:0 0 24px;border-radius:0 4px 4px 0;">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888888;">Estado actual</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#111111;">${statusLabel}</p>
      </div>
      <p style="font-size:14px;color:#555555;line-height:1.7;margin:0 0 24px;">${message}</p>
      <p style="font-size:13px;color:#888888;line-height:1.6;margin:0;">
        ¿Tienes alguna pregunta? Escríbenos por WhatsApp o responde este correo.
      </p>
    </div>
    <div style="background:#f5f5f5;padding:16px 32px;">
      <p style="margin:0;font-size:11px;color:#aaaaaa;">
        © ${new Date().getFullYear()} Savaya · Todos los derechos reservados
      </p>
    </div>
  </div>
</body>
</html>`,
  })
}
