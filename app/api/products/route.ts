import { NextRequest, NextResponse } from 'next/server'
import { ProductRepository } from '@/lib/data/repositories'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId') || undefined
    const id = searchParams.get('id') || undefined
    const slug = searchParams.get('slug') || undefined

    if (id) {
      const product = await ProductRepository.getProductById(id)
      if (!product) {
        return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, product })
    }

    if (slug) {
      const product = await ProductRepository.getProductBySlug(slug)
      if (!product) {
        return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, product })
    }

    const products = await ProductRepository.getAllProducts({
      status: 'active',
      categoryId,
    })

    return NextResponse.json({ success: true, products })
  } catch (err: any) {
    console.error('[Public Products API] Error:', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Error fetching products' },
      { status: 500 }
    )
  }
}
