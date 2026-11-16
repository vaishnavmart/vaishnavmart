import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { FirestoreOrderService } from '@/lib/firebase/firestoreService'
import { OrderRepository, ProductRepository, CouponRepository } from '@/lib/data/repositories'
import { Order } from '@/types'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const rawOrder = await request.json()

    if (!rawOrder || !rawOrder.id || !Array.isArray(rawOrder.items) || rawOrder.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid order payload: items array required.' },
        { status: 400 }
      )
    }

    // Deep copy
    const cleanOrder: Order = JSON.parse(JSON.stringify(rawOrder))

    // Server-side Price & Integrity Recalculation
    let calculatedSubtotal = 0
    for (const item of cleanOrder.items) {
      if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid order item data' },
          { status: 400 }
        )
      }

      // Look up true canonical product
      const product = await ProductRepository.getProductById(item.productId)
      if (product) {
        // Enforce true catalog price to prevent client-side price tampering
        item.priceSnapshot = product.price
        item.mrpSnapshot = product.mrp
        item.productNameSnapshot = product.name
        if (product.mainImage) {
          item.imageSnapshot = product.mainImage
        }
      }

      calculatedSubtotal += (item.priceSnapshot || 0) * item.quantity
    }

    cleanOrder.subtotal = calculatedSubtotal

    // Canonical shipping rule: orders >= 499 get free shipping, otherwise Rs. 50
    const calculatedShipping = calculatedSubtotal >= 499 ? 0 : 50
    cleanOrder.shipping = calculatedShipping

    // Server-side Coupon & Discount Verification
    let verifiedDiscount = 0
    const suppliedCouponCode = rawOrder.couponCode || (cleanOrder as any).couponCode
    if (suppliedCouponCode) {
      const cleanCouponCode = String(suppliedCouponCode).trim().toUpperCase()
      const couponCheck = await CouponRepository.validateCoupon(cleanCouponCode, calculatedSubtotal)
      if (couponCheck.valid) {
        verifiedDiscount = couponCheck.discount
        cleanOrder.couponCode = cleanCouponCode
        await CouponRepository.incrementUsage(cleanCouponCode)
      } else {
        delete (cleanOrder as any).couponCode
      }
    }
    cleanOrder.discount = verifiedDiscount
    cleanOrder.finalTotal = Math.max(0, calculatedSubtotal + calculatedShipping - verifiedDiscount)

    // Security check on payment state: COD must start as pending
    if (cleanOrder.paymentMethod === 'cod') {
      cleanOrder.paymentState = 'pending'
    }

    // Default status for incoming verified orders
    if (!cleanOrder.orderStatus) {
      cleanOrder.orderStatus = 'new'
    }

    cleanOrder.createdAt = cleanOrder.createdAt || new Date().toISOString()
    cleanOrder.updatedAt = new Date().toISOString()

    // 1. Persist directly to Cloud Firestore
    await FirestoreOrderService.save(cleanOrder)

    // 2. Also register in server repository memory
    await OrderRepository.createOrder(cleanOrder)

    return NextResponse.json({
      success: true,
      order: cleanOrder,
      message: 'Order created, verified, and persisted successfully',
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

    // Bulk orders fetch requires Superadmin session
    const adminCookie = cookies().get('vm_admin_session')
    if (adminCookie?.value !== 'authenticated_owner') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Superadmin session required to list orders.' },
        { status: 401 }
      )
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
