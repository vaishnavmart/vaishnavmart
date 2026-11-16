'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Product, Category, ProductStatus } from '@/types'
import { ProductRepository, CategoryRepository, AuditLogRepository } from '@/lib/data/repositories'
import {
  Boxes,
  AlertTriangle,
  Check,
  RefreshCw,
  Plus,
  Calendar,
  Tag,
  Copy,
  Edit3,
  Loader2,
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  SlidersHorizontal,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import {
  exportMandiProcurementSheetCSV,
  exportPriceDiscountMasterCSV,
  downloadPricingTemplateCSV,
} from '@/lib/utils/invoiceGenerator'

interface CsvPreviewRow {
  rowNumber: number
  matchType: 'update' | 'create'
  matchedProduct?: Product
  product: Product
  oldPrice?: number
  newPrice: number
  priceChanged: boolean
  oldMrp?: number
  newMrp: number
  mrpChanged: boolean
  oldDiscount?: number
  newDiscount: number
  discountChanged: boolean
  oldStock?: number
  newStock: number
  stockChanged: boolean
  oldStatus?: string
  newStatus: string
  statusChanged: boolean
  categoryName: string
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({})
  const [thresholdInputs, setThresholdInputs] = useState<Record<string, number>>({})
  const [batchInputs, setBatchInputs] = useState<Record<string, string>>({})
  const [expiryInputs, setExpiryInputs] = useState<Record<string, string>>({})
  const [updatedMsg, setUpdatedMsg] = useState('')
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Price Editing CSV Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [csvFileName, setCsvFileName] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<CsvPreviewRow[]>([])
  const [previewFilter, setPreviewFilter] = useState<'all' | 'updates' | 'new' | 'errors'>('all')
  const [isApplying, setIsApplying] = useState(false)
  const [csvSuccessSummary, setCsvSuccessSummary] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const [data, cats] = await Promise.all([
        ProductRepository.getAllProducts(),
        CategoryRepository.getAllCategories(),
      ])
      setProducts(data)
      setCategories(cats)

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

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {}
    categories.forEach((c) => {
      map[c.id] = c.name
      map[c.slug] = c.name
    })
    return map
  }, [categories])

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

  // ==========================================
  // CSV FILE PARSING & PREVIEW LOGIC
  // ==========================================
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFileName(file.name)
    setParseErrors([])
    setPreviewRows([])
    setCsvSuccessSummary(null)
    setIsParsing(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) {
        setParseErrors(['Selected CSV file is empty.'])
        setIsParsing(false)
        return
      }

      try {
        parsePricingCSVText(text)
      } catch (err: any) {
        setParseErrors([`Failed to parse CSV file: ${err?.message || err}`])
      } finally {
        setIsParsing(false)
      }
    }
    reader.readAsText(file)
  }

  const splitCSVLines = (text: string): string[] => {
    const lines: string[] = []
    let cur = ''
    let inQuotes = false
    const cleanText = text.replace(/^\uFEFF/, '')
    for (let i = 0; i < cleanText.length; i++) {
      const c = cleanText[i]
      if (c === '"') {
        if (inQuotes && cleanText[i + 1] === '"') {
          cur += '""'
          i++
        } else {
          inQuotes = !inQuotes
          cur += c
        }
      } else if ((c === '\n' || c === '\r') && !inQuotes) {
        if (c === '\r' && cleanText[i + 1] === '\n') {
          i++
        }
        if (cur.trim().length > 0) {
          lines.push(cur)
        }
        cur = ''
      } else {
        cur += c
      }
    }
    if (cur.trim().length > 0) {
      lines.push(cur)
    }
    return lines
  }

  const parseCSVRow = (line: string): string[] => {
    const result: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim())
        cur = ''
      } else {
        cur += c
      }
    }
    result.push(cur.trim())
    return result
  }

  const parseCleanNumber = (val?: string): number | undefined => {
    if (!val || val.trim() === '') return undefined
    const cleaned = val.replace(/[^0-9.-]/g, '')
    if (cleaned === '' || isNaN(Number(cleaned))) return undefined
    return Number(cleaned)
  }

  const parsePricingCSVText = (text: string) => {
    const rawLines = splitCSVLines(text)
    if (rawLines.length < 2) {
      setParseErrors(['CSV file must have a header row and at least one product row.'])
      return
    }

    const headerCols = parseCSVRow(rawLines[0])
    const headerMap: Record<string, number> = {}
    headerCols.forEach((col, idx) => {
      const norm = col.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (norm === 'productid' || norm === 'id') headerMap['id'] = idx
      else if (norm === 'sku') headerMap['sku'] = idx
      else if (norm === 'name' || norm === 'productname' || norm === 'title') headerMap['name'] = idx
      else if (norm === 'mrp' || norm === 'maxretailprice') headerMap['mrp'] = idx
      else if (norm === 'price' || norm === 'sellingprice' || norm === 'offerprice') headerMap['price'] = idx
      else if (norm.startsWith('discount')) headerMap['discount'] = idx
      else if (norm === 'stock' || norm === 'inventory' || norm === 'qty' || norm === 'units') headerMap['stock'] = idx
      else if (norm === 'category' || norm === 'categoryname' || norm === 'categoryslug') headerMap['category'] = idx
      else if (norm === 'status' || norm === 'productstatus') headerMap['status'] = idx
    })

    const errors: string[] = []
    const parsedRows: CsvPreviewRow[] = []

    for (let i = 1; i < rawLines.length; i++) {
      const row = parseCSVRow(rawLines[i])
      if (row.length === 0 || (row.length === 1 && !row[0])) continue

      const rowId = (row[headerMap['id'] ?? -1] || '').trim()
      const rowSku = (row[headerMap['sku'] ?? -1] || '').trim()
      const rowName = (row[headerMap['name'] ?? -1] || '').trim()
      const rowMrp = parseCleanNumber(row[headerMap['mrp'] ?? -1])
      const rowPrice = parseCleanNumber(row[headerMap['price'] ?? -1])
      const rowDiscount = parseCleanNumber(row[headerMap['discount'] ?? -1])
      const rowStock = parseCleanNumber(row[headerMap['stock'] ?? -1])
      const rowCategory = (row[headerMap['category'] ?? -1] || '').trim()
      const rowStatus = (row[headerMap['status'] ?? -1] || '').trim().toLowerCase()

      // Match Priority 1: ID
      let matched: Product | undefined = undefined
      if (rowId) {
        matched = products.find((p) => p.id.toLowerCase() === rowId.toLowerCase())
      }
      // Match Priority 2: SKU
      if (!matched && rowSku) {
        matched = products.find((p) => p.sku && p.sku.toLowerCase() === rowSku.toLowerCase())
      }
      // Match Priority 3: Product Name
      if (!matched && rowName) {
        matched = products.find((p) => p.name.trim().toLowerCase() === rowName.toLowerCase())
      }

      if (matched) {
        // MATCHED: UPDATE EXISTING PRODUCT
        const oldPrice = matched.price
        const oldMrp = matched.mrp
        const oldDiscount =
          oldMrp > 0 && oldMrp > oldPrice ? Math.round(((oldMrp - oldPrice) / oldMrp) * 100) : 0
        const oldStock = matched.stock
        const oldStatus = matched.status

        let newPrice = oldPrice
        let newMrp = oldMrp
        let newDiscount = oldDiscount

        // Pricing logic:
        if (rowPrice !== undefined && rowPrice > 0) {
          newPrice = rowPrice
          if (rowMrp !== undefined && rowMrp > 0) {
            newMrp = Math.max(rowMrp, newPrice)
          } else {
            newMrp = Math.max(oldMrp, newPrice)
          }
          newDiscount = newMrp > 0 && newMrp > newPrice ? Math.round(((newMrp - newPrice) / newMrp) * 100) : 0
        } else if (rowDiscount !== undefined && rowDiscount >= 0) {
          const targetMrp = rowMrp !== undefined && rowMrp > 0 ? rowMrp : oldMrp
          newPrice = Math.max(1, Math.round(targetMrp * (1 - rowDiscount / 100)))
          newMrp = targetMrp
          newDiscount = rowDiscount
        } else if (rowMrp !== undefined && rowMrp > 0) {
          newMrp = rowMrp
          newPrice = oldPrice > newMrp ? newMrp : oldPrice
          newDiscount = newMrp > 0 && newMrp > newPrice ? Math.round(((newMrp - newPrice) / newMrp) * 100) : 0
        }

        const newStock = rowStock !== undefined && rowStock >= 0 ? rowStock : oldStock
        const validStatuses: ProductStatus[] = ['active', 'draft', 'hidden']
        const newStatus = validStatuses.includes(rowStatus as ProductStatus)
          ? (rowStatus as ProductStatus)
          : oldStatus

        let catIds = matched.categoryIds || ['cat-1']
        if (rowCategory) {
          const matchedCat = categories.find(
            (c) =>
              c.name.toLowerCase() === rowCategory.toLowerCase() ||
              c.slug.toLowerCase() === rowCategory.toLowerCase() ||
              c.id.toLowerCase() === rowCategory.toLowerCase()
          )
          if (matchedCat) {
            catIds = [matchedCat.id]
          }
        }

        const resolvedCategoryName =
          (catIds[0] && categoryMap[catIds[0]]) || catIds[0] || 'General'

        const updatedProd: Product = {
          ...matched,
          name: rowName || matched.name,
          sku: rowSku || matched.sku,
          price: newPrice,
          mrp: newMrp,
          stock: newStock,
          status: newStatus,
          categoryIds: catIds,
          updatedAt: new Date().toISOString(),
        }

        parsedRows.push({
          rowNumber: i + 1,
          matchType: 'update',
          matchedProduct: matched,
          product: updatedProd,
          oldPrice,
          newPrice,
          priceChanged: newPrice !== oldPrice,
          oldMrp,
          newMrp,
          mrpChanged: newMrp !== oldMrp,
          oldDiscount,
          newDiscount,
          discountChanged: newDiscount !== oldDiscount,
          oldStock,
          newStock,
          stockChanged: newStock !== oldStock,
          oldStatus,
          newStatus,
          statusChanged: newStatus !== oldStatus,
          categoryName: resolvedCategoryName,
        })
      } else {
        // UNMATCHED: CREATE NEW PRODUCT ROW
        if (!rowName) {
          errors.push(`Row ${i + 1}: Product Name is required for new item.`)
          continue
        }
        if ((rowPrice === undefined || rowPrice <= 0) && (rowMrp === undefined || rowMrp <= 0)) {
          errors.push(
            `Row ${i + 1} ("${rowName}"): A positive Selling Price or MRP is required.`
          )
          continue
        }

        let newPrice = 0
        let newMrp = 0
        if (rowPrice !== undefined && rowPrice > 0) {
          newPrice = rowPrice
          newMrp =
            rowMrp !== undefined && rowMrp > 0 ? Math.max(rowMrp, newPrice) : Math.round(rowPrice * 1.25)
        } else if (rowMrp !== undefined && rowMrp > 0) {
          newMrp = rowMrp
          const disc = rowDiscount !== undefined && rowDiscount >= 0 ? rowDiscount : 0
          newPrice = Math.max(1, Math.round(newMrp * (1 - disc / 100)))
        }

        const newDiscount =
          newMrp > 0 && newMrp > newPrice ? Math.round(((newMrp - newPrice) / newMrp) * 100) : 0
        const newStock = rowStock !== undefined && rowStock >= 0 ? rowStock : 50
        const validStatuses: ProductStatus[] = ['active', 'draft', 'hidden']
        const newStatus = validStatuses.includes(rowStatus as ProductStatus)
          ? (rowStatus as ProductStatus)
          : 'active'

        const cleanSlug =
          rowName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
          `prod-${Date.now()}`
        const newId = rowId || `rk-${cleanSlug.slice(0, 16)}-${Date.now().toString().slice(-4)}`
        const newSku = rowSku || `VM-${cleanSlug.toUpperCase().slice(0, 8)}-${Date.now().toString().slice(-4)}`

        let catIds = ['cat-1']
        if (rowCategory) {
          const matchedCat = categories.find(
            (c) =>
              c.name.toLowerCase() === rowCategory.toLowerCase() ||
              c.slug.toLowerCase() === rowCategory.toLowerCase() ||
              c.id.toLowerCase() === rowCategory.toLowerCase()
          )
          if (matchedCat) {
            catIds = [matchedCat.id]
          }
        }

        const resolvedCategoryName =
          (catIds[0] && categoryMap[catIds[0]]) || catIds[0] || 'General'

        const newProd: Product = {
          id: newId,
          name: rowName,
          slug: cleanSlug,
          description: `Pure Satvik authentic ${rowName} prepared under highest purity standards with zero onion, garlic, or chemical preservatives.`,
          images: [
            '/images/generated/prod-shahi-masala.jpg',
            '/images/generated/story-purity.jpg',
            '/images/generated/hero-bg.jpg',
            '/images/generated/story-why-exists.jpg',
          ],
          mainImage: '/images/generated/prod-shahi-masala.jpg',
          mrp: newMrp,
          price: newPrice,
          stock: newStock,
          lowStockThreshold: 10,
          sku: newSku,
          weight: 100,
          unit: 'g',
          categoryIds: catIds,
          features: [
            { id: 'f-1', name: 'No Onion', visualType: 'icon', iconValue: 'shield', sortOrder: 1 },
            { id: 'f-2', name: 'No Garlic', visualType: 'icon', iconValue: 'shield', sortOrder: 2 },
            { id: 'f-3', name: 'Jain Friendly', visualType: 'icon', iconValue: 'check', sortOrder: 3 },
          ],
          similarProductIds: [],
          status: newStatus,
          seo: {
            metaTitle: `${rowName} | Vaishnava Mart`,
            metaDescription: `Pure authentic satvik ${rowName} with zero onion and garlic.`,
            slug: cleanSlug,
          },
          batchNumber: 'LOT-2026-AUT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        parsedRows.push({
          rowNumber: i + 1,
          matchType: 'create',
          product: newProd,
          newPrice,
          priceChanged: true,
          newMrp,
          mrpChanged: true,
          newDiscount,
          discountChanged: true,
          newStock,
          stockChanged: true,
          newStatus,
          statusChanged: true,
          categoryName: resolvedCategoryName,
        })
      }
    }

    setParseErrors(errors)
    setPreviewRows(parsedRows)
  }

  // Commit updates to database & Cloud Firestore
  const handleApplyCsvUpdates = async () => {
    if (previewRows.length === 0) return
    setIsApplying(true)
    try {
      const productsToPersist = previewRows.map((r) => r.product)
      const updatesCount = previewRows.filter((r) => r.matchType === 'update').length
      const createsCount = previewRows.filter((r) => r.matchType === 'create').length
      const summary = `CSV Price & Catalog Sync: ${updatesCount} existing products updated, ${createsCount} new products onboarded.`

      const result = await ProductRepository.bulkUpdatePricing(productsToPersist, summary)

      // Reload fresh products and inventory inputs
      const freshProducts = await ProductRepository.getAllProducts()
      setProducts(freshProducts)

      const stocks: Record<string, number> = {}
      const thresholds: Record<string, number> = {}
      const batches: Record<string, string> = {}
      const expiries: Record<string, string> = {}
      freshProducts.forEach((p) => {
        stocks[p.id] = p.stock
        thresholds[p.id] = p.lowStockThreshold || 10
        batches[p.id] = p.batchNumber || 'VM-LOT-2026'
        expiries[p.id] = p.expiryDate || ''
      })
      setStockInputs(stocks)
      setThresholdInputs(thresholds)
      setBatchInputs(batches)
      setExpiryInputs(expiries)

      setCsvSuccessSummary(
        `✓ Sync Complete! Updated ${result.updatedCount} existing products and created ${result.createdCount} new products in Cloud Firestore.`
      )
      setUpdatedMsg(
        `✓ Price & Catalog CSV Sync complete: ${result.updatedCount} updated, ${result.createdCount} added.`
      )
      setTimeout(() => setUpdatedMsg(''), 5000)
    } catch (err: any) {
      setParseErrors((prev) => [...prev, `Cloud Firestore sync error: ${err?.message || err}`])
    } finally {
      setIsApplying(false)
    }
  }

  const handleResetCsv = () => {
    setCsvFileName('')
    setParseErrors([])
    setPreviewRows([])
    setCsvSuccessSummary(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const displayedProducts = products.filter((p) => {
    if (filter === 'low') return p.stock <= p.lowStockThreshold && p.stock > 0
    if (filter === 'out') return p.stock <= 0
    return true
  })

  const filteredPreviewRows = useMemo(() => {
    if (previewFilter === 'updates') return previewRows.filter((r) => r.matchType === 'update')
    if (previewFilter === 'new') return previewRows.filter((r) => r.matchType === 'create')
    return previewRows
  }, [previewRows, previewFilter])

  const updatesCount = previewRows.filter((r) => r.matchType === 'update').length
  const newCount = previewRows.filter((r) => r.matchType === 'create').length

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-cocoa">Inventory Management</h1>
          <p className="text-xs sm:text-sm text-taupe mt-1">
            Real-time stock controls, batch & expiry monitoring, quick restock, and bulk CSV price editing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Price & Stock CSV Modal Button */}
          <button
            onClick={() => setIsCsvModalOpen(true)}
            type="button"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-burgundy text-ivory hover:bg-burgundy/90 transition-all flex items-center gap-1.5 shadow-xs"
            title="Bulk Edit Prices, Discounts, Stock & Onboard Products via CSV"
          >
            <Tag className="w-3.5 h-3.5 text-gold" />
            <span>Price & Stock CSV</span>
          </button>

          {/* Mandi Sheet (CSV) */}
          <button
            onClick={() => exportMandiProcurementSheetCSV(products)}
            type="button"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-ivory border border-sand hover:border-gold hover:text-burgundy transition-all flex items-center gap-1.5 shadow-xs"
            title="Download wholesale spice procurement spreadsheet for mandi suppliers"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-botanical" />
            <span>Mandi Sheet (CSV)</span>
          </button>

          {/* Filters */}
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

      {/* Main Inventory List */}
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
              const mrp = Number(p.mrp) || 0
              const price = Number(p.price) || 0
              const discountPercent =
                mrp > 0 && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

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
                      {/* Price & Discount Indicator */}
                      <p className="text-xs text-cocoa font-mono font-medium pt-0.5">
                        Price: ₹{price} <span className="text-taupe line-through font-normal">MRP: ₹{mrp}</span>
                        {discountPercent > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded bg-botanical/15 text-botanical font-semibold text-[10px]">
                            {discountPercent}% OFF
                          </span>
                        )}
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

      {/* ========================================================================= */}
      {/* PRICE EDITING CSV EXPORT & IMPORT MODAL                                 */}
      {/* ========================================================================= */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-ivory rounded-3xl border border-sand max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-sand flex items-center justify-between bg-porcelain/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-burgundy/10 text-burgundy">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl text-cocoa font-bold">
                    Price & Discount Master CSV Manager
                  </h2>
                  <p className="text-xs text-taupe mt-0.5">
                    Bulk export, edit prices, MRPs, discount percentages, stock, or onboard new items via CSV spreadsheet.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCsvModalOpen(false)
                  handleResetCsv()
                }}
                className="p-2 rounded-xl text-taupe hover:text-cocoa hover:bg-sand/40 transition-colors"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Top Quick Actions: Export Master & Download Template */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Export Price Master */}
                <div className="p-4 rounded-2xl bg-white border border-sand/80 shadow-xs flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-burgundy font-semibold text-sm">
                      <Download className="w-4 h-4" />
                      <span>Export Price & Discount Master</span>
                    </div>
                    <p className="text-xs text-taupe">
                      Download full CSV containing Product ID, SKU, Name, MRP, Price, Discount %, Stock, Category, and Status for all {products.length} catalog items.
                    </p>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => exportPriceDiscountMasterCSV(products, categoryMap)}
                      className="w-full py-2 px-3.5 rounded-xl text-xs font-semibold bg-porcelain border border-sand hover:border-gold hover:text-burgundy transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5 text-botanical" />
                      <span>Download Price Master CSV</span>
                    </button>
                  </div>
                </div>

                {/* 2. Download Pricing Template */}
                <div className="p-4 rounded-2xl bg-white border border-sand/80 shadow-xs flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-botanical font-semibold text-sm">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Download Pricing Template</span>
                    </div>
                    <p className="text-xs text-taupe">
                      Get a blank standard CSV template with pre-configured headers and sample rows showing how to update existing products or onboard new ones.
                    </p>
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => downloadPricingTemplateCSV()}
                      className="w-full py-2 px-3.5 rounded-xl text-xs font-semibold bg-porcelain border border-sand hover:border-botanical hover:text-botanical transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5 text-botanical" />
                      <span>Download Blank Template</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="p-5 rounded-2xl bg-porcelain/80 border border-dashed border-sand/90 text-center space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  id="pricing-csv-input"
                />

                <div className="w-12 h-12 rounded-2xl bg-ivory border border-sand flex items-center justify-center mx-auto text-burgundy shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <div>
                  <label
                    htmlFor="pricing-csv-input"
                    className="cursor-pointer text-xs font-semibold text-burgundy hover:underline inline-flex items-center gap-1"
                  >
                    Click to select CSV spreadsheet
                  </label>
                  <span className="text-xs text-taupe"> or drag and drop your file here</span>
                  <p className="text-[11px] text-taupe/80 mt-1">
                    Supports matching by <strong>Product ID</strong> or <strong>SKU</strong>. Leaves blank IDs to create brand new products.
                  </p>
                </div>

                {csvFileName && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ivory border border-sand text-xs font-mono text-cocoa">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-botanical" />
                    <span>{csvFileName}</span>
                    <button
                      type="button"
                      onClick={handleResetCsv}
                      className="text-taupe hover:text-clay ml-1"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Parsing State */}
              {isParsing && (
                <div className="p-6 text-center text-xs text-taupe flex items-center justify-center gap-2 bg-white rounded-2xl border border-sand">
                  <Loader2 className="w-4 h-4 animate-spin text-burgundy" />
                  <span>Parsing spreadsheet and matching products by ID and SKU...</span>
                </div>
              )}

              {/* Success Notification */}
              {csvSuccessSummary && (
                <div className="p-4 bg-botanical/15 border border-botanical/30 rounded-2xl text-botanical text-xs font-semibold flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{csvSuccessSummary}</span>
                </div>
              )}

              {/* Errors Display */}
              {parseErrors.length > 0 && (
                <div className="p-4 bg-clay/10 border border-clay/30 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-clay font-semibold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    <span>CSV Validation Warnings ({parseErrors.length})</span>
                  </div>
                  <ul className="text-[11px] text-clay/90 list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto">
                    {parseErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Diff Table */}
              {previewRows.length > 0 && (
                <div className="space-y-4">
                  {/* Summary Metric Pills & Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-cocoa">Preview Changes:</span>
                      <button
                        type="button"
                        onClick={() => setPreviewFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          previewFilter === 'all'
                            ? 'bg-cocoa text-ivory'
                            : 'bg-white border border-sand text-cocoa hover:border-gold'
                        }`}
                      >
                        All ({previewRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewFilter('updates')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          previewFilter === 'updates'
                            ? 'bg-copper text-ivory'
                            : 'bg-white border border-sand text-copper hover:border-copper'
                        }`}
                      >
                        Updates ({updatesCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewFilter('new')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          previewFilter === 'new'
                            ? 'bg-botanical text-ivory'
                            : 'bg-white border border-sand text-botanical hover:border-botanical'
                        }`}
                      >
                        New Items ({newCount})
                      </button>
                    </div>

                    <span className="text-[11px] text-taupe font-mono">
                      {updatesCount} to update • {newCount} to add
                    </span>
                  </div>

                  {/* Diff Table */}
                  <div className="bg-white rounded-2xl border border-sand overflow-hidden shadow-xs">
                    <div className="max-h-72 overflow-y-auto overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-porcelain text-[10px] uppercase font-semibold text-taupe sticky top-0 border-b border-sand z-10">
                          <tr>
                            <th className="p-3">Type</th>
                            <th className="p-3">ID / SKU</th>
                            <th className="p-3">Product Name</th>
                            <th className="p-3">Selling Price</th>
                            <th className="p-3">MRP</th>
                            <th className="p-3">Discount</th>
                            <th className="p-3">Stock</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sand">
                          {filteredPreviewRows.map((r, idx) => {
                            const isUpdate = r.matchType === 'update'

                            return (
                              <tr key={idx} className="hover:bg-porcelain/40 transition-colors">
                                {/* Type Badge */}
                                <td className="p-3 whitespace-nowrap">
                                  {isUpdate ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-copper/15 text-copper">
                                      Update
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-botanical/15 text-botanical">
                                      + New Item
                                    </span>
                                  )}
                                </td>

                                {/* Identifier */}
                                <td className="p-3 font-mono text-[11px] text-taupe whitespace-nowrap">
                                  <div>{r.product.id}</div>
                                  <div className="text-[10px] text-cocoa">{r.product.sku || 'N/A'}</div>
                                </td>

                                {/* Name */}
                                <td className="p-3 font-medium text-cocoa max-w-xs truncate" title={r.product.name}>
                                  {r.product.name}
                                </td>

                                {/* Price Diff */}
                                <td className="p-3 whitespace-nowrap font-mono">
                                  {isUpdate && r.priceChanged ? (
                                    <div className="flex items-center gap-1">
                                      <span className="line-through text-taupe">₹{r.oldPrice}</span>
                                      <ArrowRight className="w-3 h-3 text-taupe" />
                                      <span className="font-bold text-botanical">₹{r.newPrice}</span>
                                    </div>
                                  ) : (
                                    <span className="font-bold text-cocoa">₹{r.newPrice}</span>
                                  )}
                                </td>

                                {/* MRP Diff */}
                                <td className="p-3 whitespace-nowrap font-mono">
                                  {isUpdate && r.mrpChanged ? (
                                    <div className="flex items-center gap-1">
                                      <span className="line-through text-taupe">₹{r.oldMrp}</span>
                                      <ArrowRight className="w-3 h-3 text-taupe" />
                                      <span className="font-semibold text-cocoa">₹{r.newMrp}</span>
                                    </div>
                                  ) : (
                                    <span className="text-taupe">₹{r.newMrp}</span>
                                  )}
                                </td>

                                {/* Discount % */}
                                <td className="p-3 whitespace-nowrap">
                                  <span className="px-1.5 py-0.5 rounded bg-sand/40 text-cocoa text-[10px] font-bold font-mono">
                                    {r.newDiscount}% OFF
                                  </span>
                                </td>

                                {/* Stock Diff */}
                                <td className="p-3 whitespace-nowrap font-mono">
                                  {isUpdate && r.stockChanged ? (
                                    <div className="flex items-center gap-1">
                                      <span className="line-through text-taupe">{r.oldStock}</span>
                                      <ArrowRight className="w-3 h-3 text-taupe" />
                                      <span className="font-bold text-copper">{r.newStock}</span>
                                    </div>
                                  ) : (
                                    <span>{r.newStock} units</span>
                                  )}
                                </td>

                                {/* Status */}
                                <td className="p-3 whitespace-nowrap">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      r.newStatus === 'active'
                                        ? 'bg-botanical/15 text-botanical'
                                        : 'bg-sand/60 text-taupe'
                                    }`}
                                  >
                                    {r.newStatus}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-sand bg-porcelain/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-[11px] text-taupe text-center sm:text-left">
                Updates sync immediately to <strong>Cloud Firestore</strong> and record a verified entry in the Superadmin Audit Log.
              </p>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsCsvModalOpen(false)
                    handleResetCsv()
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-sand hover:text-burgundy transition-all"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleApplyCsvUpdates}
                  disabled={previewRows.length === 0 || isApplying}
                  className="btn-primary px-5 py-2 text-xs inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Applying to Catalog...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        Apply {previewRows.length > 0 ? `${previewRows.length} Changes` : 'Changes'} to Catalog
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
