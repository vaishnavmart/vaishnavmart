import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { OrderRepository, AuditLogRepository } from '@/lib/data/repositories'

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.warn('RAZORPAY_WEBHOOK_SECRET is not configured on the server.')
      return NextResponse.json(
        { error: 'Webhook secret is not configured' },
        { status: 500 }
      )
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      )
    }

    // Verify webhook signature with timing-safe comparison
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    const expectedBuf = Buffer.from(expectedSignature, 'utf8')
    const receivedBuf = Buffer.from(signature, 'utf8')

    if (
      expectedBuf.length !== receivedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      )
    }

    const payload = JSON.parse(rawBody)
    const event = payload.event
    const paymentEntity = payload.payload?.payment?.entity
    const orderEntity = payload.payload?.order?.entity

    const orderId = orderEntity?.id || paymentEntity?.order_id
    const paymentId = paymentEntity?.id

    switch (event) {
      case 'order.paid':
      case 'payment.captured': {
        if (orderId) {
          const orders = await OrderRepository.getOrders()
          const matched = orders.find(
            (o) => o.paymentId === orderId || o.paymentId === paymentId || o.notes?.includes(orderId)
          )
          if (matched) {
            await OrderRepository.updateOrderStatus(matched.id, 'confirmed', 'paid')
            await AuditLogRepository.addLog(
              'Payment Webhook Captured',
              `Payment ${paymentId} captured for Order #${matched.orderNumber}`,
              'Razorpay Webhook'
            )
          }
        }
        break
      }

      case 'payment.failed': {
        if (orderId) {
          const orders = await OrderRepository.getOrders()
          const matched = orders.find(
            (o) => o.paymentId === orderId || o.paymentId === paymentId
          )
          if (matched) {
            await OrderRepository.updateOrderStatus(matched.id, 'cancelled', 'failed')
            await AuditLogRepository.addLog(
              'Payment Webhook Failed',
              `Payment ${paymentId} failed for Order #${matched.orderNumber}`,
              'Razorpay Webhook'
            )
          }
        }
        break
      }

      default:
        // Acknowledge receipt of other Razorpay lifecycle events
        break
    }

    return NextResponse.json({ status: 'ok', received: true })
  } catch (err: any) {
    console.error('Razorpay webhook error:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error processing webhook' },
      { status: 500 }
    )
  }
}
