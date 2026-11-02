import { NextResponse } from 'next/server'
import { FirestoreOrderService } from '@/lib/firebase/firestoreService'
import { OrderRepository } from '@/lib/data/repositories'
import { Order } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const rawOrder = await request.json()

    if (!rawOrder || !rawOrder.id || !Array.isArray(rawOrder.items)) {
      return NextResponse.json(
        { success: false, message: 'Invalid order payload' },
        { status: 400 }
      )
    }

    // Deep sanitize to strip any undefined values that Firestore rejects
    const cleanOrder: Order = JSON.parse(JSON.stringify(rawOrder))

    // 1. Persist directly to Cloud Firestore
    await FirestoreOrderService.save(cleanOrder)

    // 2. Also register in server repository memory
    await OrderRepository.createOrder(cleanOrder)

    return NextResponse.json({
      success: true,
      order: cleanOrder,
      message: 'Order created and persisted successfully',
    })
  } catch (err: any) {
    console.error('[API Orders] Failed to persist order:', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Server error creating order' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const order = await OrderRepository.getOrderById(id)
      if (!order) {
        return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, order })
    }

    const orders = await OrderRepository.getOrders()
    return NextResponse.json({ success: true, orders })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Error fetching orders' },
      { status: 500 }
    )
  }
}
