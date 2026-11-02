'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Order } from '@/types'
import { OrderRepository } from '@/lib/data/repositories'
import { OrderSuccessView } from '@/components/store/OrderSuccessView'
import { Package, ArrowRight } from 'lucide-react'

export function OrderSuccessQueryClient() {
  const router = useRouter()
  const [resolvedOrder, setResolvedOrder] = useState<Order | null>(null)
  const [checking, setChecking] = useState<boolean>(true)

  useEffect(() => {
    // 1. Try reading the most recently saved order from localStorage
    try {
      const lastOrderStr = localStorage.getItem('vm_last_order')
      if (lastOrderStr) {
        const order = JSON.parse(lastOrderStr) as Order
        if (order && order.id) {
          setResolvedOrder(order)
          setChecking(false)
          return
        }
      }
    } catch {
      // Continue to repository
    }

    // 2. Try retrieving the latest order from the repository
    OrderRepository.getOrders().then((orders) => {
      if (orders && orders.length > 0) {
        setResolvedOrder(orders[0])
      }
      setChecking(false)
    }).catch(() => {
      setChecking(false)
    })
  }, [])

  if (checking) {
    return (
      <div className="bg-ivory min-h-screen py-24 flex items-center justify-center">
        <div className="bg-porcelain p-10 rounded-3xl border border-sand shadow-sm text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 border-3 border-burgundy border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="font-serif text-2xl text-cocoa">Retrieving Order</h2>
          <p className="text-xs text-taupe">Checking your recent purchases...</p>
        </div>
      </div>
    )
  }

  if (resolvedOrder) {
    return <OrderSuccessView initialOrder={resolvedOrder} orderId={resolvedOrder.id} />
  }

  return (
    <div className="bg-ivory min-h-screen py-20 border-b border-sand flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center bg-porcelain p-8 sm:p-10 rounded-3xl border border-sand shadow-sm space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-cream text-burgundy flex items-center justify-center">
          <Package className="w-8 h-8 text-copper" />
        </div>
        <h1 className="font-serif text-3xl text-cocoa">Order Chronicle</h1>
        <p className="text-xs sm:text-sm text-taupe leading-relaxed">
          You can track and manage all your active and past Satvik food orders in your personal orders dashboard.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/account/orders" className="btn-primary text-xs h-10 px-5 inline-flex items-center justify-center gap-1.5">
            <span>View All Orders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/shop" className="btn-secondary text-xs h-10 px-5">
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
