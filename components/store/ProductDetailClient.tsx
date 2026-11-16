'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Product } from '@/types'
import { ProductGallery } from './ProductGallery'
import { ProductFeatureCards } from './ProductFeatureCards'
import { ProductCard } from './ProductCard'
import { useCart } from '@/lib/data/CartContext'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  ChevronRight,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronDown,
  Sparkles,
} from 'lucide-react'

interface ProductDetailClientProps {
  product: Product
  similarProducts: Product[]
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({
  product,
  similarProducts,
}) => {
  const router = useRouter()
  const { addToCart, setIsCartDrawerOpen } = useCart()
  const { isAuthenticated, user, setIsLoginModalOpen, setIsProfileModalOpen } = useAuth()

  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const [openAccordion, setOpenAccordion] = useState<string | null>('description')

  // Buying Options / Pack Selection (e.g. 200g vs Pocket 50g Khakhra)
  const [selectedPackId, setSelectedPackId] = useState<string>(
    product.packOptions?.[0]?.id || (product.weight === 50 ? '50g' : '200g')
  )

  const activePack = product.packOptions?.find((p) => p.id === selectedPackId) || product.packOptions?.[0]
  const displayPrice = activePack ? activePack.price : product.price
  const displayMrp = activePack ? activePack.mrp : product.mrp
  const displayWeight = activePack ? activePack.weight : product.weight
  const displayUnit = activePack ? activePack.unit : product.unit
  const activeProductId = activePack?.productId || product.id

  const discountPercent = activePack
    ? (activePack.discountPercent !== undefined
        ? activePack.discountPercent
        : (displayMrp > displayPrice && displayMrp > 0 ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0))
    : (product.discountPercent !== undefined
        ? product.discountPercent
        : (displayMrp > displayPrice && displayMrp > 0 ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0))

  const handleAddToCart = async () => {
    await addToCart(activeProductId, quantity)
    setJustAdded(true)
    setTimeout(() => {
      setJustAdded(false)
      setIsCartDrawerOpen(true)
    }, 600)
  }

  const handleBuyNow = async () => {
    await addToCart(activeProductId, quantity)
    if (!isAuthenticated) {
      setIsLoginModalOpen(true)
      return
    }
    if (!user?.profileComplete) {
      setIsProfileModalOpen(true)
      return
    }
    router.push('/checkout')
  }

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id)
  }

  // Accordion Sections (only non-empty)
  const accordionSections = [
    { id: 'description', title: 'Product Narrative & Craft', content: product.description },
    { id: 'ingredients', title: 'Sacred Ingredients', content: product.ingredients },
    { id: 'purityInfo', title: 'Dedicated Purity Standards', content: product.purityInfo },
    { id: 'usage', title: 'Preparation & Culinary Use', content: product.usage },
    { id: 'storage', title: 'Storage Guidelines', content: product.storage },
    { id: 'nutrition', title: 'Nutritional Overview', content: product.nutrition },
    { id: 'shipping', title: 'Packaging & Delivery', content: product.shippingInfo },
  ].filter((s) => Boolean(s.content))

  return (
    <div className="bg-ivory min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-taupe mb-8">
          <Link href="/" className="hover:text-burgundy transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/shop" className="hover:text-burgundy transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-cocoa font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        {/* 2-Column Product Main Section (52% Gallery, 48% Info) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start pb-16">
          {/* Left Gallery (approx 52%) */}
          <div className="lg:col-span-6 lg:sticky lg:top-28">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Right Product Information (approx 48%) */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              {/* Feature Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {product.features.slice(0, 3).map((f) => (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 bg-porcelain border border-sand rounded-md text-burgundy shadow-sm"
                  >
                    <Sparkles className="w-3 h-3 text-gold" />
                    <span>{f.name}</span>
                  </span>
                ))}
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl text-cocoa font-normal leading-tight">
                {product.name}
              </h1>

              <p className="text-xs text-taupe mt-2 font-mono">
                SKU: {product.sku || 'VM-STD'} • Net Wt: {displayWeight} {displayUnit}
              </p>
            </div>

            {/* Buying Options (Pack Size Selection for Khakhras & Multi-pack Products) */}
            {product.packOptions && product.packOptions.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-taupe">
                    Select Buying Option:
                  </span>
                  <span className="text-[11px] font-semibold text-copper">
                    {activePack?.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {product.packOptions.map((opt) => {
                    const isSelected = selectedPackId === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedPackId(opt.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-burgundy bg-burgundy/5 text-burgundy shadow-sm ring-2 ring-burgundy'
                            : 'border-sand bg-porcelain text-cocoa hover:border-gold'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{opt.name}</span>
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-burgundy ring-2 ring-cream" />
                          )}
                        </div>
                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="font-sans font-bold text-base text-burgundy">
                            ₹{opt.price}
                          </span>
                          <span className="font-sans text-xs text-taupe line-through">
                            ₹{opt.mrp}
                          </span>
                          <span className="text-[10px] font-bold text-clay uppercase">
                            {opt.discountPercent}% OFF
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Pricing Area */}
            <div className="p-4 bg-porcelain rounded-2xl border border-sand flex items-baseline justify-between">
              <div className="flex items-baseline gap-3">
                <span className="font-sans text-2xl sm:text-3xl font-bold text-burgundy">
                  ₹{displayPrice}
                </span>
                {displayMrp > displayPrice && (
                  <>
                    <span className="font-sans text-base text-taupe line-through">
                      MRP ₹{displayMrp}
                    </span>
                    {discountPercent > 0 && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-clay text-ivory uppercase tracking-wider shadow-sm">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className="text-right">
                {product.stock > 0 ? (
                  <span className="text-xs font-semibold text-botanical flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-botanical animate-pulse" />
                    In Stock ({product.stock} units)
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-clay">Out of Stock</span>
                )}
              </div>
            </div>

            {/* Combo Bundle Included Items */}
            {product.isCombo && product.comboItemNames && product.comboItemNames.length > 0 && (
              <div className="p-4 bg-cream/40 border border-gold/40 rounded-2xl space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-copper block">
                  Items Included in this Combo:
                </span>
                <ul className="space-y-1 text-xs text-cocoa">
                  {product.comboItemNames.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-burgundy font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity Selector & Purchase Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-taupe">Quantity</span>
                <div className="flex items-center border border-sand rounded-xl bg-porcelain overflow-hidden h-11">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 text-taupe hover:text-burgundy hover:bg-cream/40 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 font-mono text-sm font-semibold text-cocoa">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3.5 text-taupe hover:text-burgundy hover:bg-cream/40 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="btn-secondary h-13 text-sm justify-center rounded-xl bg-porcelain"
                >
                  {justAdded ? (
                    <span className="flex items-center gap-1.5 text-botanical font-semibold">
                      <Check className="w-4 h-4" /> Added ✓
                    </span>
                  ) : (
                    <span>Add to Cart</span>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="btn-primary h-13 text-sm justify-center rounded-xl"
                >
                  <span>Buy Now</span>
                </button>
              </div>
            </div>

            {/* Delivery & Purity Badges (Including Pan India & No Return Policy Notice) */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-sand text-center">
              <div className="p-3 bg-porcelain rounded-xl border border-sand/60">
                <Truck className="w-4 h-4 mx-auto text-copper mb-1" />
                <p className="text-[10px] text-cocoa font-semibold">Pan India Delivery</p>
                <p className="text-[9px] text-taupe">Serving All States</p>
              </div>
              <div className="p-3 bg-porcelain rounded-xl border border-sand/60">
                <ShieldCheck className="w-4 h-4 mx-auto text-burgundy mb-1" />
                <p className="text-[10px] text-cocoa font-semibold">100% Satvik Verified</p>
                <p className="text-[9px] text-taupe">Zero Allium</p>
              </div>
              <Link
                href="/return-policy"
                className="p-3 bg-porcelain rounded-xl border border-sand/60 hover:border-gold/60 transition-colors group"
              >
                <RotateCcw className="w-4 h-4 mx-auto text-copper mb-1 group-hover:text-burgundy" />
                <p className="text-[10px] text-cocoa font-semibold group-hover:text-burgundy">No Return Policy</p>
                <p className="text-[9px] text-taupe group-hover:underline">Learn Why ↗</p>
              </Link>
            </div>

            {/* Accordion Information (Only displays non-empty sections) */}
            <div className="divide-y divide-sand border-y border-sand mt-6">
              {accordionSections.map((acc) => {
                const isOpen = openAccordion === acc.id
                return (
                  <div key={acc.id} className="py-4">
                    <button
                      onClick={() => toggleAccordion(acc.id)}
                      className="w-full flex items-center justify-between text-left font-serif text-lg text-cocoa font-medium hover:text-burgundy transition-colors"
                    >
                      <span>{acc.title}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-taupe transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="mt-3 text-xs sm:text-sm text-taupe leading-relaxed font-sans max-w-2xl animate-in fade-in duration-200">
                        {acc.content}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards Marquee */}
      <ProductFeatureCards features={product.features} />

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className="py-16 sm:py-24 border-t border-sand/70 bg-ivory">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs uppercase tracking-widest text-copper font-semibold">
                Harmonious Pairings
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-cocoa mt-2 font-normal">
                You may also like
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {similarProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
