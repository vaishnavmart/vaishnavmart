import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import Razorpay from 'razorpay'
import { OrderRepository } from '@/lib/data/repositories'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const adminCookie = cookies().get('vm_admin_session')
    if (adminCookie?.value !== 'authenticated_owner') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Superadmin session required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId, paymentId, amount, reason } = body

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      )
    }

    const order = await OrderRepository.getOrderById(orderId)
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.paymentState === 'refunded') {
      return NextResponse.json(
        { success: false, message: 'Order is already marked as refunded' },
        { status: 400 }
      )
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''
    const keySecret = process.env.RAZORPAY_KEY_SECRET || ''

    let refundId = `rfnd_local_${Date.now()}`
    const refundAmount = amount ? Number(amount) : order.finalTotal

    // If real Razorpay keys exist and paymentId is present, execute live Razorpay refund
    if (keyId && keySecret && keyId !== 'mock_razorpay_key' && paymentId && !paymentId.startsWith('mock_')) {
      try {
        const instance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        })

        const rzpRefund = await instance.payments.refund(paymentId, {
          amount: Math.round(refundAmount * 100), // convert to paise
          notes: {
            orderNumber: order.orderNumber,
            reason: reason || 'Superadmin Initiated Refund',
          },
        })

        if (rzpRefund && rzpRefund.id) {
          refundId = rzpRefund.id
        }
      } catch (rzpErr: any) {
        console.error('[Razorpay Refund Error]:', rzpErr)
        return NextResponse.json(
          {
            success: false,
            message: rzpErr?.error?.description || rzpErr?.message || 'Razorpay refund failed',
          },
          { status: 500 }
        )
      }
    }

    // Update order state in database
    const updatedOrder = await OrderRepository.markOrderRefunded(order.id, refundId, refundAmount)

    return NextResponse.json({
      success: true,
      message: `Successfully processed refund of ₹${refundAmount}`,
      refundId,
      order: updatedOrder,
    })
  } catch (error: any) {
    console.error('[Admin Refund API] Error:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error processing refund' },
      { status: 500 }
    )
  }
}
