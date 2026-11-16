import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ProductRepository } from '@/lib/data/repositories'
import { Product } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const adminCookie = cookies().get('vm_admin_session')
    if (adminCookie?.value !== 'authenticated_owner') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Superadmin session required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const categoryId = searchParams.get('categoryId') || undefined

    const products = await ProductRepository.getAllProducts({
      status: status === 'all' ? undefined : status,
      categoryId,
    })

    return NextResponse.json({ success: true, products })
  } catch (err: any) {
    console.error('[Admin API Products GET] Error:', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Error fetching products' },
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
        { success: false, message: 'Product name is required.' },
        { status: 400 }
      )
    }

    const id = body.id || `prod-${Date.now()}`
    const rawMrp = Number(body.mrp) || 0
    const rawPrice = Number(body.price) || 0
    const rawDiscount = body.discountPercent !== undefined
      ? Number(body.discountPercent)
      : (rawMrp > rawPrice && rawMrp > 0 ? Math.round(((rawMrp - rawPrice) / rawMrp) * 100) : 0)

    const product: Product = {
      ...body,
      id,
      name: body.name.trim(),
      slug: body.slug || id,
      mrp: rawMrp,
      price: rawPrice,
      discountPercent: rawDiscount,
      stock: Number(body.stock) || 0,
      lowStockThreshold: Number(body.lowStockThreshold) || 10,
      weight: Number(body.weight) || 100,
      unit: body.unit || 'g',
      status: body.status || 'active',
      images: Array.isArray(body.images) && body.images.length > 0 ? body.images : ['/images/generated/prod-shahi-masala.jpg'],
      mainImage: body.mainImage || (Array.isArray(body.images) && body.images[0]) || '/images/generated/prod-shahi-masala.jpg',
      categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds : [],
      features: Array.isArray(body.features) ? body.features : [],
      updatedAt: new Date().toISOString(),
    }

    const saved = await ProductRepository.saveProduct(product)
    return NextResponse.json({ success: true, product: saved })
  } catch (err: any) {
    console.error('[Admin API Products POST] Error:', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Error saving product' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminCookie = cookies().get('vm_admin_session')
    if (adminCookie?.value !== 'authenticated_owner') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Superadmin session required.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required for update.' },
        { status: 400 }
      )
    }

    const existing = await ProductRepository.getProductById(body.id)
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Product not found.' },
        { status: 404 }
      )
    }

    const updatedMrp = body.mrp !== undefined ? Number(body.mrp) : existing.mrp
    const updatedPrice = body.price !== undefined ? Number(body.price) : existing.price
    const updatedDiscount = body.discountPercent !== undefined
      ? Number(body.discountPercent)
      : (existing.discountPercent !== undefined ? existing.discountPercent : (updatedMrp > updatedPrice && updatedMrp > 0 ? Math.round(((updatedMrp - updatedPrice) / updatedMrp) * 100) : 0))

    const updatedProduct: Product = {
      ...existing,
      ...body,
      mrp: updatedMrp,
      price: updatedPrice,
      discountPercent: updatedDiscount,
      stock: body.stock !== undefined ? Number(body.stock) : existing.stock,
      lowStockThreshold: body.lowStockThreshold !== undefined ? Number(body.lowStockThreshold) : existing.lowStockThreshold,
      batchNumber: body.batchNumber !== undefined ? body.batchNumber : existing.batchNumber,
      expiryDate: body.expiryDate !== undefined ? body.expiryDate : existing.expiryDate,
      updatedAt: new Date().toISOString(),
    }

    const saved = await ProductRepository.saveProduct(updatedProduct)
    return NextResponse.json({ success: true, product: saved })
  } catch (err: any) {
    console.error('[Admin API Products PATCH] Error:', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Error updating product' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminCookie = cookies().get('vm_admin_session')
    if (adminCookie?.value !== 'authenticated_owner') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Superadmin session required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const hard = searchParams.get('hard') === 'true'

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required for deletion.' },
        { status: 400 }
      )
    }

    await ProductRepository.deleteProduct(id, !hard)
    return NextResponse.json({
      success: true,
      message: `Product ${id} ${hard ? 'permanently removed' : 'hidden from storefront'}.`,
    })
  } catch (err: any) {
    console.error('[Admin API Products DELETE] Error:', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Error deleting product' },
      { status: 500 }
    )
  }
}
