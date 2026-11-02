import { Metadata } from 'next'
import { OrderSuccessView } from '@/components/store/OrderSuccessView'
import { OrderSuccessQueryClient } from './OrderSuccessQueryClient'

export const metadata: Metadata = {
  title: 'Order Status | Vaishnava Mart',
  description: 'Your pure Satvik food order status and confirmation.',
}

interface Props {
  searchParams?: {
    order_id?: string
    orderId?: string
    razorpay_order_id?: string
    id?: string
  }
}

export default function OrderSuccessGeneralPage({ searchParams }: Props) {
  const targetId =
    searchParams?.order_id ||
    searchParams?.orderId ||
    searchParams?.razorpay_order_id ||
    searchParams?.id

  if (targetId) {
    return <OrderSuccessView initialOrder={null} orderId={targetId} />
  }

  return <OrderSuccessQueryClient />
}
