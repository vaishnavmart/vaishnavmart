import { NextRequest, NextResponse } from 'next/server'
import { CouponRepository } from '@/lib/data/repositories'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, subtotal } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, discount: 0, message: 'Please provide a coupon code.' },
        { status: 400 }
      )
    }

    const numericSubtotal = Number(subtotal) || 0
    const result = await CouponRepository.validateCoupon(code, numericSubtotal)

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, discount: 0, message: result.message },
        { status: 200 }
      )
    }

    return NextResponse.json({
      valid: true,
      discount: result.discount,
      message: result.message,
      coupon: {
        code: result.coupon?.code,
        discountType: result.coupon?.discountType,
        discountValue: result.coupon?.discountValue,
        description: result.coupon?.description,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, discount: 0, message: err?.message || 'Error validating coupon.' },
      { status: 500 }
    )
  }
}
