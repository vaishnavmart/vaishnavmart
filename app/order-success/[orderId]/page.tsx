import { Metadata } from 'next'
import { OrderRepository } from '@/lib/data/repositories'
import { OrderSuccessView } from '@/components/store/OrderSuccessView'

interface Props {
  params: { orderId: string }
}

export const metadata: Metadata = {
  title: 'Order Confirmed | Vaishnava Mart',
  description: 'Your pure Satvik food order has been confirmed.',
}

export default async function OrderSuccessPage({ params }: Props) {
  // Gracefully attempt server fetch; client OrderSuccessView provides instant local & Firestore recovery
  let initialOrder = null
  try {
    initialOrder = await OrderRepository.getOrderById(params.orderId)
  } catch {
    // Non-blocking fallback to client hydration
  }

  return <OrderSuccessView initialOrder={initialOrder} orderId={params.orderId} />
}
