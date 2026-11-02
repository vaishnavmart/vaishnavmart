import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { OrderRepository } from '@/lib/data/repositories'

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
