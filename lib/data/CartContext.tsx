'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { CartItem, Product } from '@/types'
import { CartRepository, ProductRepository } from '@/lib/data/repositories'
import { useAuth } from '@/lib/auth/AuthContext'

export interface CartItemDetailed {
  productId: string
  product: Product
  quantity: number
}

export interface AppliedCouponInfo {
  code: string
  discountType: 'percentage' | 'flat'
  discountValue: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  description?: string
}

interface CartContextType {
  items: CartItemDetailed[]
  itemCount: number
  subtotal: number
  shippingCost: number
  total: number
  discount: number
  finalTotal: number
  appliedCoupon: AppliedCouponInfo | null
  applyCoupon: (code: string) => Promise<{ valid: boolean; discount: number; message: string }>
  removeCoupon: () => void
  isCartDrawerOpen: boolean
  setIsCartDrawerOpen: (open: boolean) => void
  addToCart: (productId: string, quantity?: number) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  clearCart: () => Promise<void>
  toastMessage: string | null
  showToast: (msg: string) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [detailedItems, setDetailedItems] = useState<CartItemDetailed[]>([])
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponInfo | null>(null)
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // 1. Initial Load: Guest cart and applied coupon from localStorage
  useEffect(() => {
    try {
      const savedGuestCart = localStorage.getItem('vm_guest_cart')
      if (savedGuestCart) {
        setCartItems(JSON.parse(savedGuestCart))
      }
      const savedCoupon = localStorage.getItem('vm_cart_coupon')
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon))
      }
    } catch {
      // ignore
    }
  }, [])

  // 2. User login / change: merge guest cart into user's cart in repository
  useEffect(() => {
    async function syncUserCart() {
      if (!user) return

      const remoteCart = await CartRepository.getCart(user.uid)
      const guestCartRaw = localStorage.getItem('vm_guest_cart')
      let guestItems: CartItem[] = []
      if (guestCartRaw) {
        try {
          guestItems = JSON.parse(guestCartRaw)
        } catch {
          guestItems = []
        }
      }

      let merged: CartItem[] = remoteCart ? [...remoteCart.items] : []

      if (guestItems.length > 0) {
        guestItems.forEach((gItem) => {
          const existing = merged.find((m) => m.productId === gItem.productId)
          if (existing) {
            existing.quantity += gItem.quantity
          } else {
            merged.push(gItem)
          }
        })
        // Clear guest cart once merged
        localStorage.removeItem('vm_guest_cart')
      }

      await CartRepository.saveCart({
        userId: user.uid,
        items: merged,
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      })

      setCartItems(merged)
    }

    syncUserCart()
  }, [user])

  // 3. Hydrate detailed items with current live product info
  useEffect(() => {
    async function hydrate() {
      const detailed: CartItemDetailed[] = []
      for (const item of cartItems) {
        const prod = await ProductRepository.getProductById(item.productId)
        if (prod) {
          detailed.push({
            productId: item.productId,
            product: prod,
            quantity: item.quantity,
          })
        }
      }
      setDetailedItems(detailed)
    }
    hydrate()
  }, [cartItems])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  const persistCart = async (newItems: CartItem[]) => {
    setCartItems(newItems)
    if (user) {
      await CartRepository.saveCart({
        userId: user.uid,
        items: newItems,
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      })
    } else {
      localStorage.setItem('vm_guest_cart', JSON.stringify(newItems))
    }
  }

  const addToCart = async (productId: string, quantity = 1) => {
    const existingIndex = cartItems.findIndex((i) => i.productId === productId)
    let updated: CartItem[]
    if (existingIndex >= 0) {
      updated = [...cartItems]
      updated[existingIndex].quantity += quantity
    } else {
      updated = [...cartItems, { productId, quantity }]
    }
    await persistCart(updated)
    showToast('Added to your cart')
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }
    const updated = cartItems.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    await persistCart(updated)
  }

  const removeFromCart = async (productId: string) => {
    const updated = cartItems.filter((i) => i.productId !== productId)
    await persistCart(updated)
    showToast('Removed from cart')
  }

  const clearCart = async () => {
    setCartItems([])
    setAppliedCoupon(null)
    try {
      localStorage.removeItem('vm_cart_coupon')
    } catch {
      // ignore
    }
    if (user) {
      await CartRepository.clearCart(user.uid)
    } else {
      localStorage.removeItem('vm_guest_cart')
    }
  }

  const applyCoupon = async (code: string): Promise<{ valid: boolean; discount: number; message: string }> => {
    if (!code || !code.trim()) {
      return { valid: false, discount: 0, message: 'Please enter a coupon code.' }
    }
    const cleanCode = code.trim().toUpperCase()
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode, subtotal }),
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        const couponInfo: AppliedCouponInfo = {
          code: data.coupon?.code || cleanCode,
          discountType: data.coupon?.discountType || 'flat',
          discountValue: Number(data.coupon?.discountValue) || data.discount,
          minOrderAmount: data.coupon?.minOrderAmount ? Number(data.coupon.minOrderAmount) : undefined,
          maxDiscountAmount: data.coupon?.maxDiscountAmount ? Number(data.coupon.maxDiscountAmount) : undefined,
          description: data.coupon?.description || '',
        }
        setAppliedCoupon(couponInfo)
        try {
          localStorage.setItem('vm_cart_coupon', JSON.stringify(couponInfo))
        } catch {
          // ignore
        }
        showToast(`Coupon "${cleanCode}" applied! Saved ₹${data.discount}`)
        return { valid: true, discount: data.discount, message: data.message }
      } else {
        return { valid: false, discount: 0, message: data.message || 'Invalid coupon code.' }
      }
    } catch (err: any) {
      return { valid: false, discount: 0, message: err?.message || 'Error validating coupon.' }
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    try {
      localStorage.removeItem('vm_cart_coupon')
    } catch {
      // ignore
    }
    showToast('Coupon removed')
  }

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = detailedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shippingCost = subtotal >= 499 || subtotal === 0 ? 0 : 50

  // Calculate dynamic coupon discount against current subtotal
  let discount = 0
  if (appliedCoupon && subtotal > 0) {
    if (!appliedCoupon.minOrderAmount || subtotal >= appliedCoupon.minOrderAmount) {
      if (appliedCoupon.discountType === 'percentage') {
        const raw = Math.round((subtotal * appliedCoupon.discountValue) / 100)
        discount = appliedCoupon.maxDiscountAmount ? Math.min(appliedCoupon.maxDiscountAmount, raw) : raw
      } else {
        discount = Math.min(subtotal, appliedCoupon.discountValue)
      }
    }
  }

  const total = subtotal + shippingCost
  const finalTotal = Math.max(0, subtotal + shippingCost - discount)

  return (
    <CartContext.Provider
      value={{
        items: detailedItems,
        itemCount,
        subtotal,
        shippingCost,
        total,
        discount,
        finalTotal,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
