'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/data/CartContext'

export const CartDrawer: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    shippingCost,
    total,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeFromCart,
  } = useCart()

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartDrawerOpen) {
        setIsCartDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCartDrawerOpen, setIsCartDrawerOpen])

  if (!isCartDrawerOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      {/* Drawer Container: Right slide on desktop, bottom sheet on mobile */}
      <div className="relative z-10 w-full sm:max-w-md h-full bg-porcelain shadow-2xl flex flex-col border-l border-sand transition-transform duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-sand flex items-center justify-between bg-ivory">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-burgundy" />
            <h3 className="font-serif text-xl text-cocoa">Your Sacred Pantry</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sand/60 text-taupe">
              {itemCount}
            </span>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-1.5 text-taupe hover:text-burgundy rounded-full hover:bg-cream/40 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        <div className="bg-cream/40 px-6 py-2.5 text-xs text-taupe border-b border-sand flex items-center justify-between">
          {subtotal >= 499 ? (
            <span className="text-botanical font-medium">✓ You unlocked complimentary free shipping!</span>
          ) : (
            <span>Add ₹{499 - subtotal} more for Free Pan India Delivery</span>
          )}
          <span className="font-mono text-[10px]">Min ₹499</span>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-cream/50 flex items-center justify-center text-taupe">
                <ShoppingBag className="w-8 h-8 opacity-40" />
              </div>
              <p className="font-serif text-xl text-cocoa">Your cart is empty</p>
              <p className="text-xs text-taupe max-w-xs mx-auto">
                Discover our cold-ground spices, Ekadashi foods, and pure Satvik staples.
              </p>
              <div className="pt-2">
                <Link
                  href="/shop"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="btn-primary text-sm py-2 px-5 h-10 inline-flex"
                >
                  Explore Pantry
                </Link>
              </div>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-4 p-3.5 bg-ivory/60 rounded-xl border border-sand/70 transition-all"
              >
                {/* 1:1 Image */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-porcelain flex-shrink-0 border border-sand">
                  <Image
                    src={product.mainImage}
                    alt={product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/${product.slug}`}
                        onClick={() => setIsCartDrawerOpen(false)}
                        className="font-medium text-sm text-cocoa hover:text-burgundy transition-colors line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      {product.weight && (
                        <span className="inline-block mt-0.5 text-[11px] font-semibold text-copper bg-cream/70 px-1.5 py-0.5 rounded border border-sand">
                          {product.weight} {product.unit}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-taupe/60 hover:text-clay p-1"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-sand rounded-lg bg-porcelain overflow-hidden">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="px-2.5 py-1 text-taupe hover:text-burgundy hover:bg-cream/40 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono text-xs font-semibold text-cocoa">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="px-2.5 py-1 text-taupe hover:text-burgundy hover:bg-cream/40 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="font-semibold text-sm text-burgundy">₹{product.price * quantity}</span>
                      {product.mrp > product.price && (
                        <div className="text-[10px] text-taupe flex items-center justify-end gap-1">
                          <span className="line-through">₹{product.mrp * quantity}</span>
                          {(() => {
                            const disc = product.discountPercent !== undefined
                              ? product.discountPercent
                              : (product.mrp > 0 ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0)
                            return disc > 0 ? (
                              <span className="text-botanical font-bold">
                                ({disc}% OFF)
                              </span>
                            ) : null
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {items.length > 0 && (
          <div className="p-6 border-t border-sand bg-ivory space-y-4">
            <div className="space-y-1.5 text-xs text-taupe">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-cocoa">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{shippingCost === 0 ? <span className="text-botanical font-medium">Free</span> : `₹${shippingCost}`}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-cocoa pt-2 border-t border-sand">
                <span>Total</span>
                <span className="text-burgundy text-base">₹{total}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                href="/cart"
                onClick={() => setIsCartDrawerOpen(false)}
                className="btn-secondary h-12 text-sm justify-center rounded-xl"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={() => setIsCartDrawerOpen(false)}
                className="btn-primary h-12 text-sm justify-center rounded-xl"
              >
                <span>Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
