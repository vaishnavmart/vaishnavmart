'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Product } from '@/types'
import { ProductRepository } from '@/lib/data/repositories'
import {
  ArrowLeft,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  Boxes,
} from 'lucide-react'

export default function BulkCSVImportPage() {
  const router = useRouter()
  const [parsedProducts, setParsedProducts] = useState<Product[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccessMsg, setImportSuccessMsg] = useState('')

  // 1. Download Sample CSV Template
  const handleDownloadSampleCSV = () => {
    const headers = [
      'Name',
      'Slug',
      'Price',
      'MRP',
      'Stock',
      'LowStockThreshold',
      'SKU',
      'Weight',
      'Unit',
      'CategorySlug',
      'BatchNumber',
      'ExpiryDate',
      'Description',
    ]

    const sampleRows = [
      [
        'Pure Shahi Paneer Masala (Satvik)',
        'shahi-paneer-masala-satvik',
        '249',
        '299',
        '50',
        '10',
        'VM-MAS-SHAHI',
        '150',
        'g',
        'whole-spices',
        'LOT-SP26-01',
        '2027-12-31',
        'Prepared in an isolated allium-free cleanroom without onion or garlic.',
      ],
      [
        'Handmade Methi Khakhra (Whole Wheat)',
        'handmade-methi-khakhra',
        '180',
        '220',
        '75',
        '15',
        'VM-KHA-METHI',
        '200',
        'g',
        'khakhra',
        'LOT-KH26-02',
        '2027-06-30',
        'Traditional Jain roasting with pure cold-pressed sesame oil.',
      ],
      [
        'Singhara Atta (Water Chestnut Vrat Flour)',
        'singhara-atta-vrat-flour',
        '195',
        '240',
        '60',
        '12',
        'VM-FLR-SINGH',
        '500',
        'g',
        'fasting-vrat',
        'LOT-FL26-03',
        '2027-08-31',
        'Ekadashi compliant 100% stone-milled water chestnut fasting flour.',
      ],
    ]

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...sampleRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')),
      ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vaishnavamart_product_import_template.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 2. CSV File Parse Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setErrors([])
    setImportSuccessMsg('')

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      try {
        parseCSVText(text)
      } catch (err: any) {
        setErrors([`Failed to read CSV: ${err.message}`])
      }
    }
    reader.readAsText(file)
  }

  const parseCSVText = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) {
      setErrors(['CSV file must have a header row and at least one data row.'])
      return
    }

    const parseLine = (line: string): string[] => {
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

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase())
    const headerMap: Record<string, number> = {}
    headers.forEach((h, idx) => {
      headerMap[h] = idx
    })

    const newErrors: string[] = []
    const products: Product[] = []

    for (let i = 1; i < lines.length; i++) {
      const row = parseLine(lines[i])
      if (row.length === 0 || (row.length === 1 && !row[0])) continue

      const name = row[headerMap['name'] ?? 0] || ''
      const slugRaw = row[headerMap['slug'] ?? 1] || ''
      const priceVal = Number(row[headerMap['price'] ?? 2] || 0)
      const mrpVal = Number(row[headerMap['mrp'] ?? 3] || priceVal)
      const stockVal = Number(row[headerMap['stock'] ?? 4] || 50)
      const thresholdVal = Number(row[headerMap['lowstockthreshold'] ?? 5] || 10)
      const skuVal = row[headerMap['sku'] ?? 6] || `VM-${Date.now()}-${i}`
      const weightVal = Number(row[headerMap['weight'] ?? 7] || 100)
      const unitVal = row[headerMap['unit'] ?? 8] || 'g'
      const catSlug = row[headerMap['categoryslug'] ?? 9] || 'whole-spices'
      const batchVal = row[headerMap['batchnumber'] ?? 10] || 'LOT-2026-AUT'
      const expiryVal = row[headerMap['expirydate'] ?? 11] || ''
      const descVal = row[headerMap['description'] ?? 12] || 'Pure Satvik authentic preparation.'

      if (!name) {
        newErrors.push(`Row ${i + 1}: Missing product Name`)
        continue
      }
      if (isNaN(priceVal) || priceVal <= 0) {
        newErrors.push(`Row ${i + 1} (${name}): Price must be a positive number`)
        continue
      }

      const autoSlug =
        slugRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

      const prod: Product = {
        id: `rk-${autoSlug.slice(0, 16)}-${Date.now().toString().slice(-4)}`,
        name,
        slug: autoSlug,
        description: descVal,
        images: [
          '/images/generated/prod-shahi-masala.jpg',
          '/images/generated/story-purity.jpg',
          '/images/generated/hero-bg.jpg',
          '/images/generated/story-why-exists.jpg',
        ],
        mainImage: '/images/generated/prod-shahi-masala.jpg',
        mrp: mrpVal,
        price: priceVal,
        stock: stockVal,
        lowStockThreshold: thresholdVal,
        sku: skuVal,
        weight: weightVal,
        unit: unitVal,
        categoryIds: [catSlug],
        features: [
          { id: 'f-1', name: 'No Onion', visualType: 'icon', iconValue: 'shield', sortOrder: 1 },
          { id: 'f-2', name: 'No Garlic', visualType: 'icon', iconValue: 'shield', sortOrder: 2 },
          { id: 'f-3', name: 'Jain Friendly', visualType: 'icon', iconValue: 'check', sortOrder: 3 },
        ],
        similarProductIds: [],
        status: 'active',
        seo: {
          metaTitle: `${name} | Vaishnava Mart`,
          metaDescription: descVal.slice(0, 155),
          slug: autoSlug,
        },
        batchNumber: batchVal,
        expiryDate: expiryVal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      products.push(prod)
    }

    setErrors(newErrors)
    setParsedProducts(products)
  }

  // 3. Commit products to database
  const handleCommitProducts = async () => {
    if (parsedProducts.length === 0) return
    setIsImporting(true)
    try {
      const count = await ProductRepository.bulkImportProducts(parsedProducts)
      setImportSuccessMsg(`✓ Successfully committed ${count} products to Vaishnava Mart catalog!`)
      setParsedProducts([])
      setFileName('')
      setTimeout(() => {
        router.push('/admin/inventory')
      }, 2000)
    } catch (err: any) {
      setErrors([`Error saving to database: ${err.message}`])
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sand">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/add"
            className="p-2 rounded-xl bg-ivory border border-sand hover:text-burgundy"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-cocoa">Bulk Catalog CSV Importer</h1>
            <p className="text-xs text-taupe">
              Import 10 to 100+ stone-ground spices, fasting flours, and dry fruits in seconds.
            </p>
          </div>
        </div>

        {/* Download Sample Template */}
        <button
          type="button"
          onClick={handleDownloadSampleCSV}
          className="btn-secondary h-10 px-4 text-xs inline-flex items-center gap-2 hover:border-gold hover:text-burgundy shadow-xs"
        >
          <Download className="w-4 h-4 text-copper" />
          <span>Download Sample CSV Template</span>
        </button>
      </div>

      {importSuccessMsg && (
        <div className="p-4 bg-botanical/15 border border-botanical/30 rounded-2xl text-botanical text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{importSuccessMsg}</span>
        </div>
      )}

      {errors.length > 0 && (
        <div className="p-4 bg-clay/15 border border-clay/30 rounded-2xl text-clay text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> CSV Validation Notice:
          </p>
          <ul className="list-disc pl-5 space-y-0.5">
            {errors.map((e, idx) => (
              <li key={idx}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="p-8 bg-ivory rounded-3xl border-2 border-dashed border-sand hover:border-burgundy/60 transition-colors text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-porcelain border border-sand flex items-center justify-center text-burgundy shadow-xs">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <p className="font-serif text-xl text-cocoa font-medium">Select your Products CSV file</p>
          <p className="text-xs text-taupe">Supports standard UTF-8 formatted CSV spreadsheets.</p>
        </div>

        <div className="pt-2">
          <label className="btn-primary h-10 px-6 text-xs cursor-pointer inline-flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            <span>{fileName ? `File: ${fileName}` : 'Choose CSV File'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Preview Table if products parsed */}
      {parsedProducts.length > 0 && (
        <div className="bg-ivory rounded-3xl border border-sand p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sand">
            <div>
              <h2 className="font-serif text-xl text-cocoa font-medium">
                Parsed Products Preview ({parsedProducts.length})
              </h2>
              <p className="text-xs text-taupe">Review parsed items before committing to catalog.</p>
            </div>

            <button
              type="button"
              onClick={handleCommitProducts}
              disabled={isImporting}
              className="btn-primary h-10 px-6 text-xs font-bold bg-botanical hover:bg-botanical/90 flex items-center gap-2 shadow-xs"
            >
              <Boxes className="w-4 h-4" />
              <span>{isImporting ? 'Importing Products...' : `Commit ${parsedProducts.length} Items to Catalog`}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-porcelain border-b border-sand text-taupe uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">MRP</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Lot #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {parsedProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-porcelain/50">
                    <td className="p-3 font-mono text-taupe">{idx + 1}</td>
                    <td className="p-3 font-medium text-cocoa">{p.name}</td>
                    <td className="p-3 font-mono text-taupe">{p.sku}</td>
                    <td className="p-3 font-bold text-burgundy font-mono">₹{p.price}</td>
                    <td className="p-3 font-mono text-taupe">₹{p.mrp}</td>
                    <td className="p-3 font-mono font-bold">{p.stock}</td>
                    <td className="p-3 text-taupe">{p.weight} {p.unit}</td>
                    <td className="p-3 font-mono text-[11px] text-copper">{p.batchNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
