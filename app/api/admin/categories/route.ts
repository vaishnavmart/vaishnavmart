import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { CategoryRepository } from '@/lib/data/repositories'
import { Category } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const categories = await CategoryRepository.getAllCategories()
    return NextResponse.json({ success: true, categories })
  } catch (err: any) {
    console.error('[Admin Categories API GET] Error:', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Error fetching categories' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminCookie = cookies().get('vm_admin_session')
    if (adminCookie?.value !== 'authenticated_owner') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Superadmin session required.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    if (!body || !body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Category name is required.' },
        { status: 400 }
      )
    }

    const id = body.id || `cat-${Date.now()}`
    const category: Category = {
      ...body,
      id,
      name: body.name.trim(),
      slug: body.slug || id,
      sortOrder: Number(body.sortOrder) || 1,
    }

    const saved = await CategoryRepository.saveCategory(category)
    return NextResponse.json({ success: true, category: saved })
  } catch (err: any) {
    console.error('[Admin Categories API POST] Error:', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Error saving category' },
      { status: 500 }
    )
  }
}
