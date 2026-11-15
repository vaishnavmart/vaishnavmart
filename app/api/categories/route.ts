import { NextResponse } from 'next/server'
import { CategoryRepository } from '@/lib/data/repositories'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const categories = await CategoryRepository.getAllCategories()
    return NextResponse.json({ success: true, categories })
  } catch (err: any) {
    console.error('[Public Categories API] Error:', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Error fetching categories' },
      { status: 500 }
    )
  }
}
