import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { OrderRepository } from '@/lib/data/repositories'
import { OrderStatus } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const adminCookie = cookies().get('vm_admin_session')
    if (adminCookie?.value !== 'authenticated_owner') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Superadmin session required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const orders = await OrderRepository.getOrders({
      status: status === 'all' ? undefined : status,
      search,
    })

    return NextResponse.json({ success: true, orders })
  } catch (error: any) {
    console.error('[Admin API] Error fetching orders:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error fetching orders' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminCookie = cookies().get('vm_admin_session')
    if (adminCookie?.value !== 'authenticated_owner') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Superadmin session required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId, orderStatus, courierPartner, trackingNumber, trackingUrl, adminNotes, items } = body

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required.' },
        { status: 400 }
      )
    }

    let updatedOrder = await OrderRepository.getOrderById(orderId)
    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: `Order #${orderId} not found.` },
        { status: 404 }
      )
    }

    if (orderStatus) {
      updatedOrder = await OrderRepository.updateOrderStatus(orderId, orderStatus as OrderStatus)
    }

    if (courierPartner !== undefined || trackingNumber !== undefined || trackingUrl !== undefined || adminNotes !== undefined) {
      updatedOrder = await OrderRepository.updateOrderDetails(orderId, {
        courierPartner,
        trackingNumber,
        trackingUrl,
        adminNotes,
      })
    }

    if (Array.isArray(items) && items.length > 0) {
      updatedOrder = await OrderRepository.updateOrderItems(orderId, items)
    }

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (error: any) {
    console.error('[Admin API PATCH] Error updating order:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error updating order' },
      { status: 500 }
    )
  }
}
