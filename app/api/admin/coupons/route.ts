import { NextRequest, NextResponse } from 'next/server'
import { CouponRepository } from '@/lib/data/repositories'
import { Coupon } from '@/types'

export async function GET() {
  try {
    const coupons = await CouponRepository.getAllCoupons()
    return NextResponse.json({ success: true, coupons })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Error fetching coupons' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      id,
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      expiryDate,
      usageLimit,
      timesUsed,
      active,
      description,
    } = body

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, message: 'Coupon code is required.' },
        { status: 400 }
      )
    }

    if (discountValue === undefined || Number(discountValue) <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid discount value is required.' },
        { status: 400 }
      )
    }

    const couponId = id || `coup-${Date.now()}`
    const coupon: Coupon = {
      id: couponId,
      code: code.trim().toUpperCase(),
      discountType: discountType === 'flat' ? 'flat' : 'percentage',
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      startDate: startDate || undefined,
      expiryDate: expiryDate || undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      timesUsed: Number(timesUsed) || 0,
      active: active !== undefined ? Boolean(active) : true,
      description: description?.trim() || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const saved = await CouponRepository.saveCoupon(coupon)
    return NextResponse.json({ success: true, coupon: saved })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Error saving coupon' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Coupon ID is required for deletion.' },
        { status: 400 }
      )
    }

    await CouponRepository.deleteCoupon(id)
    return NextResponse.json({ success: true, message: 'Coupon deleted successfully.' })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Error deleting coupon' },
      { status: 500 }
    )
  }
}
