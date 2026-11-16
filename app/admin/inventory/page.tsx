'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'
import { ProductRepository, AuditLogRepository } from '@/lib/data/repositories'
import { Boxes, AlertTriangle, Check, RefreshCw, Plus, Calendar, Tag, Copy, Edit3, Loader2, FileSpreadsheet } from 'lucide-react'
import { exportMandiProcurementSheetCSV } from '@/lib/utils/invoiceGenerator'

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({})
  const [thresholdInputs, setThresholdInputs] = useState<Record<string, number>>({})
  const [batchInputs, setBatchInputs] = useState<Record<string, string>>({})
  const [expiryInputs, setExpiryInputs] = useState<Record<string, string>>({})
  const [updatedMsg, setUpdatedMsg] = useState('')
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await ProductRepository.getAllProducts()
      setProducts(data)
      const stocks: Record<string, number> = {}
      const thresholds: Record<string, number> = {}
      const batches: Record<string, string> = {}
      const expiries: Record<string, string> = {}

      data.forEach((p) => {
        stocks[p.id] = p.stock
        thresholds[p.id] = p.lowStockThreshold || 10
        batches[p.id] = p.batchNumber || 'VM-LOT-2026'
        expiries[p.id] = p.expiryDate || ''
      })

      setStockInputs(stocks)
      setThresholdInputs(thresholds)
      setBatchInputs(batches)
      setExpiryInputs(expiries)
      setLoading(false)
    }
    load()
  }, [])

  const handleQuickAdd = (productId: string, addAmount: number) => {
    const current = stockInputs[productId] ?? 0
    setStockInputs({ ...stockInputs, [productId]: current + addAmount })
  }

  const handleUpdateProductInventory = async (product: Product) => {
    const newQty = stockInputs[product.id]
    const newThreshold = thresholdInputs[product.id] ?? product.lowStockThreshold
    const newBatch = batchInputs[product.id] || product.batchNumber
    const newExpiry = expiryInputs[product.id] || product.expiryDate

    if (newQty === undefined || newQty < 0) return

    const prevStock = product.stock
    const updated = await ProductRepository.saveProduct({
      ...product,
      stock: newQty,
      lowStockThreshold: newThreshold,
      batchNumber: newBatch,
      expiryDate: newExpiry,
    })

    await AuditLogRepository.addLog(
      'Inventory Restock',
      `Stock for ${product.name} adjusted: ${prevStock} -> ${newQty} units (Batch: ${newBatch || 'N/A'}, Threshold: ${newThreshold})`,
      'Owner'
    )

    setProducts(products.map((p) => (p.id === updated.id ? updated : p)))
    setUpdatedMsg(`Updated inventory for ${product.name} to ${newQty} units`)
    setTimeout(() => setUpdatedMsg(''), 3000)
  }

  const handleDuplicateProduct = async (product: Product) => {
    setDuplicatingId(product.id)
    try {
      const cloned = await ProductRepository.duplicateProduct(product.id)
      if (cloned) {
        setProducts([cloned, ...products])
        setStockInputs((prev) => ({ ...prev, [cloned.id]: cloned.stock }))
        setThresholdInputs((prev) => ({ ...prev, [cloned.id]: cloned.lowStockThreshold }))
        setBatchInputs((prev) => ({ ...prev, [cloned.id]: cloned.batchNumber || '' }))
        setExpiryInputs((prev) => ({ ...prev, [cloned.id]: cloned.expiryDate || '' }))
        setUpdatedMsg(`Duplicated "${product.name}" as draft "${cloned.name}". Ready for customization!`)
        setTimeout(() => setUpdatedMsg(''), 4000)
      }
    } catch (err: any) {
      alert(`Could not duplicate: ${err?.message || err}`)
    } finally {
      setDuplicatingId(null)
    }
  }

  const displayedProducts = products.filter((p) => {
    if (filter === 'low') return p.stock <= p.lowStockThreshold && p.stock > 0
    if (filter === 'out') return p.stock <= 0
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-cocoa">Inventory Management</h1>
          <p className="text-xs sm:text-sm text-taupe mt-1">
            Real-time stock controls, batch & expiry monitoring, quick restock, and low-stock alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportMandiProcurementSheetCSV(products)}
            type="button"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-ivory border border-sand hover:border-gold hover:text-burgundy transition-all flex items-center gap-1.5 shadow-xs"
            title="Download wholesale spice procurement spreadsheet for mandi suppliers"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-botanical" />
            <span>Mandi Sheet (CSV)</span>
          </button>

          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              filter === 'all' ? 'bg-burgundy text-ivory' : 'bg-ivory border border-sand text-cocoa'
            }`}
          >
            All Items ({products.length})
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              filter === 'low' ? 'bg-burgundy text-ivory' : 'bg-ivory border border-sand text-copper'
            }`}
          >
            Low Stock ({products.filter((p) => p.stock <= p.lowStockThreshold && p.stock > 0).length})
          </button>
          <button
            onClick={() => setFilter('out')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              filter === 'out' ? 'bg-burgundy text-ivory' : 'bg-ivory border border-sand text-clay'
            }`}
          >
            Out of Stock ({products.filter((p) => p.stock <= 0).length})
          </button>
        </div>
      </div>

      {updatedMsg && (
        <div className="p-3 bg-botanical/15 border border-botanical/30 rounded-xl text-botanical text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{updatedMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-xs text-taupe flex flex-col items-center justify-center gap-3 bg-ivory rounded-3xl border border-sand shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-burgundy" />
          <span className="font-medium text-cocoa">Synchronizing live inventory from Cloud Firestore...</span>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="text-center py-20 bg-ivory rounded-3xl border border-sand p-8 space-y-3">
          <Boxes className="w-10 h-10 mx-auto text-taupe opacity-40" />
          <p className="font-serif text-xl text-cocoa">No products matching this filter</p>
          <p className="text-xs text-taupe">Try switching to &apos;All Items&apos; to view the complete catalog.</p>
        </div>
      ) : (
        <div className="bg-ivory rounded-3xl border border-sand overflow-hidden shadow-xs">
          <div className="divide-y divide-sand">
          {displayedProducts.map((p) => {
            const isLow = p.stock <= p.lowStockThreshold && p.stock > 0
            const isOut = p.stock <= 0

            return (
              <div
                key={p.id}
                className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-porcelain border border-sand flex-shrink-0">
                    <Image src={p.mainImage} alt={p.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-base text-cocoa font-medium truncate">{p.name}</p>
                    <p className="text-xs text-taupe font-mono">
                      SKU: {p.sku || 'N/A'} • Unit: {p.weight} {p.unit}
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      {isOut ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-clay/15 text-clay">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-copper/15 text-copper flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" /> Low Stock Warning ({p.stock} units)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-botanical/15 text-botanical">
                          In Stock ({p.stock} units)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Batch & Expiry and Stock Controls */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-sand/70">
                  {/* Lot / Batch */}
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-semibold text-taupe">Batch Lot #</label>
                    <input
                      type="text"
                      placeholder="Lot #"
                      value={batchInputs[p.id] ?? ''}
                      onChange={(e) => setBatchInputs({ ...batchInputs, [p.id]: e.target.value })}
                      className="w-24 p-1.5 bg-porcelain border border-sand rounded-xl text-center text-xs font-mono text-cocoa"
                    />
                  </div>

                  {/* Threshold */}
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-semibold text-taupe">Alert Threshold</label>
                    <input
                      type="number"
                      min="1"
                      value={thresholdInputs[p.id] ?? p.lowStockThreshold}
                      onChange={(e) =>
                        setThresholdInputs({ ...thresholdInputs, [p.id]: Number(e.target.value) })
                      }
                      className="w-16 p-1.5 bg-porcelain border border-sand rounded-xl text-center text-xs font-mono"
                    />
                  </div>

                  {/* Stock Input & Quick Add */}
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-semibold text-taupe">Current Stock</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={stockInputs[p.id] ?? p.stock}
                        onChange={(e) =>
                          setStockInputs({ ...stockInputs, [p.id]: Number(e.target.value) })
                        }
                        className="w-20 p-1.5 bg-porcelain border border-sand rounded-xl text-center text-xs font-mono font-bold"
                      />
                      <div className="flex items-center gap-0.5">
                        {[5, 25, 50].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleQuickAdd(p.id, amt)}
                            className="px-1.5 py-1 text-[10px] font-bold bg-cream hover:bg-gold/20 text-burgundy rounded-lg border border-sand transition-colors"
                            title={`Add +${amt} units to count`}
                          >
                            +{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Save Update Button */}
                  <div className="flex items-center gap-1.5 pt-3 sm:pt-0">
                    <button
                      onClick={() => handleUpdateProductInventory(p)}
                      className="btn-primary h-9 px-3.5 text-xs inline-flex items-center gap-1 shadow-xs"
                      title="Save Stock & Batch Changes"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateProduct(p)}
                      disabled={duplicatingId === p.id}
                      className="h-9 px-3 rounded-xl text-xs font-semibold bg-porcelain border border-sand hover:border-burgundy hover:text-burgundy transition-all inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                      title="Duplicate this spice/product with (Copy) name and unique slug"
                    >
                      {duplicatingId === p.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-burgundy" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-taupe hover:text-burgundy" />
                      )}
                      <span>Clone</span>
                    </button>

                    <Link
                      href={`/admin/add/product?edit=${p.id}`}
                      className="h-9 px-3 rounded-xl text-xs font-semibold bg-porcelain border border-sand hover:border-gold hover:text-burgundy transition-all inline-flex items-center gap-1 shadow-xs"
                      title="Open in full 9-step product wizard"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-taupe" />
                      <span>Edit</span>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      )}
    </div>
  )
}
