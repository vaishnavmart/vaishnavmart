import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { UserRepository } from '@/lib/data/repositories'

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
    const search = searchParams.get('search') || undefined

    const users = await UserRepository.getAllUsers({ search })

    return NextResponse.json({ success: true, users })
  } catch (error: any) {
    console.error('[Admin API] Error fetching users:', error)
    return NextResponse.json(
      { success: false, message: error?.message || 'Error fetching users' },
      { status: 500 }
    )
  }
}
