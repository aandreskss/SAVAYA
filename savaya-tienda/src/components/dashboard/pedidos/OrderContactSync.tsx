'use client'

import { useState } from 'react'
import ShippingAddressEditor from './ShippingAddressEditor'
import OrderWhatsAppActions from './OrderWhatsAppActions'
import type { OrderStatus } from '@/lib/types'

interface ShippingAddress {
  name: string
  address_line: string
  city: string
  department: string | null
  postal_code: string | null
  phone: string | null
}

interface Props {
  // shared
  orderId: string
  trackingNumber: string | null
  // ShippingAddressEditor
  email: string
  shippingAddress: ShippingAddress
  // OrderWhatsAppActions
  orderNumber: string
  currentStatus: OrderStatus
  paymentMethod: string | null
  paymentProofUrl: string | null
  paymentTransactionId: string | null
  paymentDate: string | null
  paymentAccountHolder: string | null
  shippingProofUrl: string | null
  shippingNotes: string | null
}

export default function OrderContactSync({
  orderId,
  trackingNumber,
  email,
  shippingAddress,
  orderNumber,
  currentStatus,
  paymentMethod,
  paymentProofUrl,
  paymentTransactionId,
  paymentDate,
  paymentAccountHolder,
  shippingProofUrl,
  shippingNotes,
}: Props) {
  // Mutable contact data — updated instantly when the admin edits the customer info
  const [name, setName] = useState(shippingAddress.name)
  const [phone, setPhone] = useState(shippingAddress.phone ?? '')

  return (
    <>
      <ShippingAddressEditor
        orderId={orderId}
        email={email}
        shippingAddress={{ ...shippingAddress, name, phone: phone || null }}
        trackingNumber={trackingNumber}
        onSaved={(savedName, savedPhone) => {
          setName(savedName)
          setPhone(savedPhone)
        }}
      />

      <OrderWhatsAppActions
        orderId={orderId}
        orderNumber={orderNumber}
        customerName={name}
        customerPhone={phone || null}
        currentStatus={currentStatus}
        paymentMethod={paymentMethod}
        paymentProofUrl={paymentProofUrl}
        paymentTransactionId={paymentTransactionId}
        paymentDate={paymentDate}
        paymentAccountHolder={paymentAccountHolder}
        trackingNumber={trackingNumber}
        shippingProofUrl={shippingProofUrl}
        shippingNotes={shippingNotes}
      />
    </>
  )
}
