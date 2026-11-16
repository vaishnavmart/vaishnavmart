'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Product, Category, ProductFeature } from '@/types'
import { ProductRepository, CategoryRepository } from '@/lib/data/repositories'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Eye,
  Plus,
  Trash2,
  Copy,
  Edit,
} from 'lucide-react'

const wizardSteps = [
  '1. Basics',
  '2. Images',
  '3. Price & Stock',
  '4. Description',
  '5. Features',
  '6. Category',
  '7. Similar',
  '8. SEO',
  '9. Review',
]

function AddProductWizardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const cloneFromId = searchParams.get('cloneFrom')

  const [activeMode, setActiveMode] = useState<'create' | 'edit' | 'clone'>('create')
  const [originalProductId, setOriginalProductId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [existingProducts, setExistingProducts] = useState<Product[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Form States
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [status, setStatus] = useState<'active' | 'draft' | 'hidden'>('active')

  // Images (Exactly 4 slots)
  const [images, setImages] = useState<string[]>([
    '/images/generated/prod-shahi-masala.jpg',
    '/images/generated/story-why-exists.jpg',
    '/images/generated/hero-bg.jpg',
    '/images/generated/story-purity.jpg',
  ])

  // Price & Stock
  const [mrp, setMrp] = useState(299)
  const [price, setPrice] = useState(249)
  const [discountPercent, setDiscountPercent] = useState(17)
  const [stock, setStock] = useState(50)
  const [lowStockThreshold, setLowStockThreshold] = useState(10)
  const [sku, setSku] = useState('VM-MAS-NEW')
  const [weight, setWeight] = useState(150)
  const [unit, setUnit] = useState('g')

  // Description
  const [description, setDescription] = useState(
    'Crafted with absolute devotion for pure Satvik and Jain households. Our whole spices are ethically procured and stone-ground at slow temperatures in an isolated, allium-free cleanroom. Absolutely free from onion, garlic, preservatives, and synthetic dyes. Suitable for temple Bhoga offerings and sacred family meals.'
  )

  // Features
  const [features, setFeatures] = useState<ProductFeature[]>([
    { id: 'f-1', name: 'No Onion', visualType: 'icon', iconValue: 'shield', sortOrder: 1 },
    { id: 'f-2', name: 'No Garlic', visualType: 'icon', iconValue: 'shield', sortOrder: 2 },
    { id: 'f-3', name: 'Jain Friendly', visualType: 'icon', iconValue: 'check', sortOrder: 3 },
  ])
  const [newFeatureName, setNewFeatureName] = useState('')

  // Category & Similar
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [similarProductIds, setSimilarProductIds] = useState<string[]>([])

  // SEO
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  useEffect(() => {
    async function load() {
      const [cats, prods] = await Promise.all([
        CategoryRepository.getAllCategories(),
        ProductRepository.getAllProducts(),
      ])
      setCategories(cats)
      setExistingProducts(prods)

      const targetId = editId || cloneFromId
      if (targetId) {
        const prod = prods.find((p) => p.id === targetId) || (await ProductRepository.getProductById(targetId))
        if (prod) {
          if (editId) {
            setActiveMode('edit')
            setOriginalProductId(prod.id)
            setName(prod.name)
            setSlug(prod.slug)
            setStatus(prod.status)
          } else {
            setActiveMode('clone')
            setName(`${prod.name} (Copy)`)
            const cleanSlugBase = prod.slug.replace(/-copy(-\d+)?$/, '')
            setSlug(`${cleanSlugBase}-copy-${Date.now().toString().slice(-4)}`)
            setStatus('draft')
          }
          if (prod.images && prod.images.length > 0) {
            const padded = [...prod.images]
            while (padded.length < 4) {
              padded.push(prod.mainImage || '/images/generated/prod-shahi-masala.jpg')
            }
            setImages(padded.slice(0, 4))
          }
          setMrp(prod.mrp)
          setPrice(prod.price)
          if (prod.discountPercent !== undefined) {
            setDiscountPercent(prod.discountPercent)
          } else if (prod.mrp > 0 && prod.mrp >= prod.price) {
            setDiscountPercent(Math.round(((prod.mrp - prod.price) / prod.mrp) * 100))
          } else {
            setDiscountPercent(0)
          }
          setStock(prod.stock)
          setLowStockThreshold(prod.lowStockThreshold || 10)
          setSku(cloneFromId && prod.sku ? `${prod.sku}-CPY` : prod.sku || 'VM-MAS-NEW')
          setWeight(prod.weight)
          setUnit(prod.unit)
          setDescription(prod.description)
          if (prod.features && prod.features.length > 0) {
            setFeatures(prod.features)
          }
          if (prod.categoryIds && prod.categoryIds.length > 0) {
            setSelectedCategoryIds(prod.categoryIds)
          } else if (cats.length > 0) {
            setSelectedCategoryIds([cats[0].id])
          }
          if (prod.similarProductIds) {
            setSimilarProductIds(prod.similarProductIds)
          }
          if (prod.seo) {
            setMetaTitle(prod.seo.metaTitle)
            setMetaDescription(prod.seo.metaDescription)
          }
          return
        }
      }

      if (cats.length > 0) setSelectedCategoryIds([cats[0].id])
    }
    load()
  }, [editId, cloneFromId])

  // Auto slug generation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    if (activeMode !== 'edit') {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(autoSlug)
      setMetaTitle(`${val} | Vaishnava Mart`)
    }
  }

  // Dynamic pricing & discount handlers
  const handleMrpChange = (val: number) => {
    const newMrp = Math.max(0, val)
    setMrp(newMrp)
    if (newMrp > 0) {
      if (discountPercent > 0) {
        const newPrice = Math.max(0, Math.round(newMrp * (1 - discountPercent / 100)))
        setPrice(newPrice)
      } else if (price > 0) {
        const disc = price > newMrp ? 0 : Math.max(0, Math.round(((newMrp - price) / newMrp) * 100))
        setDiscountPercent(disc)
      }
    }
  }

  const handlePriceChange = (val: number) => {
    const newPrice = Math.max(0, val)
    setPrice(newPrice)
    if (mrp > 0) {
      const disc = newPrice > mrp ? 0 : Math.max(0, Math.round(((mrp - newPrice) / mrp) * 100))
      setDiscountPercent(disc)
    } else {
      setDiscountPercent(0)
    }
  }

  const handleDiscountChange = (val: number) => {
    const clampedDisc = Math.min(100, Math.max(0, val))
    setDiscountPercent(clampedDisc)
    if (mrp > 0) {
      const newPrice = Math.max(0, Math.round(mrp * (1 - clampedDisc / 100)))
      setPrice(newPrice)
    }
  }

  // Word count check
  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0

  const handleAddFeature = () => {
    if (!newFeatureName.trim()) return
    setFeatures([
      ...features,
      {
        id: `f-${Date.now()}`,
        name: newFeatureName,
        visualType: 'icon',
        iconValue: 'sparkles',
        sortOrder: features.length + 1,
      },
    ])
    setNewFeatureName('')
  }

  const handlePublishProduct = async () => {
    if (!name.trim()) {
      setErrorMessage('Please provide a product name.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const targetId = activeMode === 'edit' && originalProductId ? originalProductId : `prod-${Date.now()}`
      const existing = existingProducts.find((p) => p.id === targetId)

      const savedProduct: Product = {
        id: targetId,
        name,
        slug: slug || targetId,
        description,
        images,
        mainImage: images[0],
        mrp: Number(mrp),
        price: Number(price),
        discountPercent: Number(discountPercent),
        stock: Number(stock),
        lowStockThreshold: Number(lowStockThreshold),
        sku,
        weight: Number(weight),
        unit,
        categoryIds: selectedCategoryIds,
        features,
        similarProductIds,
        status,
        seo: {
          metaTitle: metaTitle || `${name} | Vaishnava Mart`,
          metaDescription: metaDescription || description.slice(0, 160),
          slug,
        },
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await ProductRepository.saveProduct(savedProduct)
      router.push('/admin/inventory')
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving product')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-sand">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="p-2 rounded-xl bg-ivory border border-sand hover:text-burgundy"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-cocoa">
              {activeMode === 'edit' ? 'Edit Product' : activeMode === 'clone' ? 'Duplicate & Customize Product' : 'Add Product Wizard'}
            </h1>
            <p className="text-xs text-taupe">Step {currentStep} of 9: {wizardSteps[currentStep - 1]}</p>
          </div>
        </div>

        <button
          onClick={handlePublishProduct}
          disabled={isSubmitting}
          className="btn-primary text-xs h-10 px-5 shadow-xs"
        >
          {isSubmitting ? 'Saving...' : activeMode === 'edit' ? 'Save Changes' : 'Publish Product'}
        </button>
      </div>

      {/* Mode Banner */}
      {activeMode === 'clone' && (
        <div className="p-3 bg-cream border border-gold/40 rounded-2xl text-cocoa text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <Copy className="w-4 h-4 text-burgundy" />
            Cloning product into a new draft. All sacred specifications, purity guarantees, and images pre-filled.
          </span>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gold/20 text-burgundy">
            Draft Copy
          </span>
        </div>
      )}
      {activeMode === 'edit' && (
        <div className="p-3 bg-porcelain border border-sand rounded-2xl text-cocoa text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <Edit className="w-4 h-4 text-copper" />
            Editing live catalog item. Saving will immediately update this product across the storefront.
          </span>
          <span className="font-mono text-[10px] text-taupe">{originalProductId}</span>
        </div>
      )}

      {/* 9 Steps Progress Bar */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center gap-1.5 min-w-[700px]">
          {wizardSteps.map((st, idx) => {
            const stepNum = idx + 1
            const isCurrent = currentStep === stepNum
            const isCompleted = currentStep > stepNum
            return (
              <button
                key={st}
                onClick={() => setCurrentStep(stepNum)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                  isCurrent
                    ? 'bg-burgundy text-ivory border-burgundy shadow-sm'
                    : isCompleted
                    ? 'bg-cream text-burgundy border-sand'
                    : 'bg-ivory text-taupe/60 border-sand'
                }`}
              >
                {st}
              </button>
            )
          })}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-clay/15 border border-clay/30 rounded-xl text-clay text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: BASICS */}
      {currentStep === 1 && (
        <div className="bg-ivory p-6 sm:p-8 rounded-3xl border border-sand space-y-4">
          <h2 className="font-serif text-xl text-cocoa font-medium">Product Basics</h2>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Shahi Paneer Masala (Pure Satvik)"
              value={name}
              onChange={handleNameChange}
              className="w-full p-3 bg-porcelain border border-sand rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
              Automatic Slug (URL Address)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-taupe font-mono">vaishnavamart.com/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 p-2.5 bg-porcelain border border-sand rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
              Visibility Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full p-3 bg-porcelain border border-sand rounded-xl text-xs"
            >
              <option value="active">Active (Visible in Store)</option>
              <option value="draft">Draft (Hidden from Store)</option>
              <option value="hidden">Archived</option>
            </select>
          </div>
        </div>
      )}

      {/* STEP 2: IMAGES (Exactly 4 Slots) */}
      {currentStep === 2 && (
        <div className="bg-ivory p-6 sm:p-8 rounded-3xl border border-sand space-y-6">
          <div>
            <h2 className="font-serif text-xl text-cocoa font-medium">Product Visual Gallery</h2>
            <p className="text-xs text-taupe">
              Provide exactly 4 image URLs. Image 1 is the primary showcase image.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((imgUrl, idx) => (
              <div key={idx} className="p-4 bg-porcelain rounded-2xl border border-sand space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-copper">Slot #{idx + 1} {idx === 0 ? '(Main Image)' : ''}</span>
                  {idx === 0 && (
                    <span className="text-[10px] bg-botanical/15 text-botanical px-2 py-0.5 rounded font-bold">
                      Shown First
                    </span>
                  )}
                </div>

                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-ivory border border-sand">
                  <Image src={imgUrl} alt={`Slot ${idx + 1}`} fill className="object-cover" />
                </div>

                <input
                  type="text"
                  value={imgUrl}
                  onChange={(e) => {
                    const updated = [...images]
                    updated[idx] = e.target.value
                    setImages(updated)
                  }}
                  placeholder="Paste ImageKit or image URL"
                  className="w-full p-2 bg-ivory border border-sand rounded-lg text-xs font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: PRICE AND STOCK */}
      {currentStep === 3 && (
        <div className="bg-ivory p-6 sm:p-8 rounded-3xl border border-sand space-y-4">
          <h2 className="font-serif text-xl text-cocoa font-medium">Pricing, Weight & Inventory</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
                MRP (₹)
              </label>
              <input
                type="number"
                min="0"
                value={mrp}
                onChange={(e) => handleMrpChange(Number(e.target.value))}
                className="w-full p-3 bg-porcelain border border-sand rounded-xl text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
                Discount (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => handleDiscountChange(Number(e.target.value))}
                  className="w-full p-3 bg-porcelain border border-sand rounded-xl text-sm font-semibold text-botanical pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-taupe pointer-events-none">
                  %
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="w-full p-3 bg-porcelain border border-sand rounded-xl text-sm font-bold text-burgundy"
              />
            </div>
          </div>

          {/* Pricing Status & Validation Indicators */}
          {price > mrp && (
            <div className="p-3 bg-clay/15 border border-clay/30 rounded-xl text-clay text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Warning:</strong> Selling Price (₹{price}) exceeds MRP (₹{mrp}). Recommended to adjust Selling Price or MRP so price does not exceed maximum retail price.
              </span>
            </div>
          )}
          {mrp > price && discountPercent > 0 && (
            <div className="p-3 bg-botanical/10 border border-botanical/25 rounded-xl text-botanical text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-botanical" />
                Customer saves <strong>₹{mrp - price}</strong> ({discountPercent}% OFF MRP).
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-botanical/20">
                Discount Active
              </span>
            </div>
          )}
          {mrp > 0 && price === mrp && (
            <div className="p-3 bg-sand/30 border border-sand rounded-xl text-taupe text-xs flex items-center justify-between">
              <span>Standard Pricing: 0% Discount (Selling Price equals MRP).</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sand/60 text-cocoa">
                No Discount
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full p-3 bg-porcelain border border-sand rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full p-3 bg-porcelain border border-sand rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
                SKU Identifier
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full p-3 bg-porcelain border border-sand rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
                Net Weight
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full p-3 bg-porcelain border border-sand rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
                Unit of Measure
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-3 bg-porcelain border border-sand rounded-xl text-sm"
              >
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="pcs">Pieces</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: DESCRIPTION (200 - 500 words target) */}
      {currentStep === 4 && (
        <div className="bg-ivory p-6 sm:p-8 rounded-3xl border border-sand space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-cocoa font-medium">Product Description</h2>
            <div className="text-xs flex items-center gap-2">
              <span className="font-semibold text-taupe">Word Count:</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded ${
                  wordCount >= 200 && wordCount <= 500
                    ? 'bg-botanical/15 text-botanical'
                    : 'bg-clay/15 text-clay'
                }`}
              >
                {wordCount} words
              </span>
            </div>
          </div>

          <p className="text-xs text-taupe">
            Target: 200 to 500 words of authentic Satvik kitchen context.
            {wordCount < 200 && (
              <span className="text-clay font-medium ml-2">
                ⚠️ Below 200 words (Recommendation for comprehensive customer trust).
              </span>
            )}
          </p>

          <textarea
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-4 bg-porcelain border border-sand rounded-2xl text-xs sm:text-sm leading-relaxed"
          />
        </div>
      )}

      {/* STEP 5: FEATURES */}
      {currentStep === 5 && (
        <div className="bg-ivory p-6 sm:p-8 rounded-3xl border border-sand space-y-6">
          <div>
            <h2 className="font-serif text-xl text-cocoa font-medium">Purity Features & Claims</h2>
            <p className="text-xs text-taupe">
              Select or add badges that will appear on product cards and animated sliders.
            </p>
          </div>

          {/* Add Feature Inline */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Zero Contamination, Sendha Namak, 100% Satvik"
              value={newFeatureName}
              onChange={(e) => setNewFeatureName(e.target.value)}
              className="flex-1 p-2.5 bg-porcelain border border-sand rounded-xl text-xs"
            />
            <button
              onClick={handleAddFeature}
              type="button"
              className="btn-secondary h-10 px-4 text-xs"
            >
              Add Claim
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {features.map((f, idx) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-porcelain border border-sand rounded-xl text-xs font-semibold text-burgundy shadow-sm"
              >
                <span>{f.name}</span>
                <button
                  onClick={() => setFeatures(features.filter((item) => item.id !== f.id))}
                  className="text-taupe hover:text-clay"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* STEP 6: CATEGORY */}
      {currentStep === 6 && (
        <div className="bg-ivory p-6 sm:p-8 rounded-3xl border border-sand space-y-4">
          <h2 className="font-serif text-xl text-cocoa font-medium">Assign Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((c) => {
              const checked = selectedCategoryIds.includes(c.id)
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCategoryIds((prev) =>
                      checked ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                    )
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    checked
                      ? 'bg-cream border-burgundy ring-1 ring-burgundy'
                      : 'bg-porcelain border-sand'
                  }`}
                >
                  <p className="font-bold text-xs text-cocoa">{c.name}</p>
                  <p className="text-[10px] text-taupe truncate mt-0.5">{c.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* STEP 7: SIMILAR PRODUCTS */}
      {currentStep === 7 && (
        <div className="bg-ivory p-6 sm:p-8 rounded-3xl border border-sand space-y-4">
          <h2 className="font-serif text-xl text-cocoa font-medium">Select Similar Products (Up to 6)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto">
            {existingProducts.map((p) => {
              const selected = similarProductIds.includes(p.id)
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSimilarProductIds((prev) =>
                      selected
                        ? prev.filter((id) => id !== p.id)
                        : prev.length < 6
                        ? [...prev, p.id]
                        : prev
                    )
                  }}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 ${
                    selected ? 'bg-cream border-burgundy' : 'bg-porcelain border-sand'
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={p.mainImage} alt={p.name} fill className="object-cover" />
                  </div>
                  <span className="text-xs font-medium text-cocoa truncate">{p.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* STEP 8: SEO */}
      {currentStep === 8 && (
        <div className="bg-ivory p-6 sm:p-8 rounded-3xl border border-sand space-y-6">
          <h2 className="font-serif text-xl text-cocoa font-medium">Search Engine Information (Google)</h2>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
              Google Title
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
              Google Description
            </label>
            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs"
            />
          </div>

          {/* Google Preview Snippet */}
          <div className="p-4 bg-white rounded-2xl border border-sand space-y-1">
            <span className="text-[10px] uppercase font-bold text-taupe">Google Search Preview</span>
            <p className="text-sm text-[#1a0dab] font-medium truncate">{metaTitle || `${name} | Vaishnava Mart`}</p>
            <p className="text-[11px] text-[#006621]">https://vaishnavamart.com/{slug}</p>
            <p className="text-xs text-[#545454] line-clamp-2">
              {metaDescription || description.slice(0, 160)}
            </p>
          </div>
        </div>
      )}

      {/* STEP 9: REVIEW */}
      {currentStep === 9 && (
        <div className="bg-ivory p-6 sm:p-8 rounded-3xl border border-sand space-y-6">
          <h2 className="font-serif text-2xl text-cocoa font-medium">Review & Publish</h2>

          <div className="p-5 bg-porcelain rounded-2xl border border-sand flex gap-6 items-center">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-sand flex-shrink-0">
              <Image src={images[0]} alt={name} fill className="object-cover" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-copper tracking-wider">{sku}</span>
              <h3 className="font-serif text-xl text-cocoa font-medium">{name || 'Untitled Product'}</h3>
              <p className="font-bold text-base text-burgundy mt-1">
                ₹{price} (MRP ₹{mrp})
                {discountPercent > 0 && (
                  <span className="ml-2 text-xs font-bold text-botanical uppercase bg-botanical/15 px-2 py-0.5 rounded">
                    {discountPercent}% OFF
                  </span>
                )}
              </p>
              <p className="text-xs text-taupe">{weight} {unit} • Stock: {stock}</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handlePublishProduct}
              disabled={isSubmitting}
              className="btn-primary text-sm px-8 h-12 justify-center shadow-xl"
            >
              <CheckCircle2 className="w-5 h-5 text-gold" />
              <span>{isSubmitting ? 'Publishing Product...' : 'Publish Product to Live Website'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Wizard Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-sand">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="btn-secondary h-11 px-6 text-xs disabled:opacity-30"
        >
          Previous
        </button>

        {currentStep < 9 ? (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="btn-primary h-11 px-8 text-xs inline-flex items-center gap-2"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default function AddProductWizardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-burgundy border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-sm text-cocoa">Loading Satvik Product Studio...</p>
        </div>
      }
    >
      <AddProductWizardContent />
    </Suspense>
  )
}
