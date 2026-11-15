'use client'

import React, { useState, useEffect } from 'react'
import { Order, Product } from '@/types'
import { OrderRepository, ProductRepository, CartRepository } from '@/lib/data/repositories'
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingBag,
  ArrowUpRight,
  Calendar,
  Percent,
  Truck,
  PackageCheck,
  CreditCard,
} from 'lucide-react'

type DateRange = 'today' | 'yesterday' | '7days' | '30days' | 'all'

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [cartUsersCount, setCartUsersCount] = useState(0)
  const [abandonedValue, setAbandonedValue] = useState(0)
  const [dateRange, setDateRange] = useState<DateRange>('30days')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [o, p, cu] = await Promise.all([
        OrderRepository.getOrders(),
        ProductRepository.getAllProducts(),
        CartRepository.getCartUsers(),
      ])
      setOrders(o)
      setProducts(p)
      setCartUsersCount(cu.length)
      setAbandonedValue(cu.reduce((sum, item) => sum + item.totalValue, 0))
      setLoading(false)
    }
    load()
  }, [])

  // Filter orders by date range
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const filteredOrders = orders.filter((o) => {
    if (!o.createdAt) return true
    const orderDate = new Date(o.createdAt)
    const dateStr = o.createdAt.slice(0, 10)

    if (dateRange === 'today') return dateStr === todayStr
    if (dateRange === 'yesterday') return dateStr === yesterdayStr
    if (dateRange === '7days') return orderDate >= sevenDaysAgo
    if (dateRange === '30days') return orderDate >= thirtyDaysAgo
    return true
  })

  // Financial calculations
  const grossSubtotal = filteredOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0)
  const shippingCollected = filteredOrders.reduce((sum, o) => sum + (o.shipping || 0), 0)
  const discountsGiven = filteredOrders.reduce((sum, o) => sum + (o.discount || 0), 0)
  const netRevenue = filteredOrders.reduce((sum, o) => sum + (o.finalTotal || 0), 0)
  const totalOrdersCount = filteredOrders.length
  const aov = totalOrdersCount > 0 ? Math.round(netRevenue / totalOrdersCount) : 0

  // Derive top selling products from filtered orders
  const itemCounts: Record<string, { name: string; qty: number; revenue: number }> = {}
  filteredOrders.forEach((o) => {
    o.items?.forEach((item) => {
      const pId = item.productId
      if (!itemCounts[pId]) {
        itemCounts[pId] = {
          name: item.productNameSnapshot,
          qty: 0,
          revenue: 0,
        }
      }
      itemCounts[pId].qty += item.quantity
      itemCounts[pId].revenue += item.priceSnapshot * item.quantity
    })
  })

  const topSelling = Object.entries(itemCounts)
    .map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6)

  // Order status counts
  const statusCounts: Record<string, number> = {
    new: 0,
    confirmed: 0,
    processing: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }
  filteredOrders.forEach((o) => {
    const st = o.orderStatus || 'new'
    statusCounts[st] = (statusCounts[st] || 0) + 1
  })

  if (loading) {
    return <div className="p-8 text-center text-xs text-taupe">Loading analytics...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header and Date Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sand">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-cocoa">Business Analytics & Financials</h1>
          <p className="text-xs sm:text-sm text-taupe mt-1">
            Real-time financial reconciliation, patron order velocity, and pantry performance.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-ivory p-1 rounded-2xl border border-sand">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setDateRange(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dateRange === t.id
                  ? 'bg-burgundy text-ivory shadow-xs'
                  : 'text-taupe hover:text-cocoa'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-ivory rounded-2xl border border-sand shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-taupe block">Net Revenue</span>
          <p className="font-serif text-3xl font-bold text-burgundy mt-2">₹{netRevenue}</p>
          <span className="text-[11px] text-botanical font-medium mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> Total Realized Sales
          </span>
        </div>

        <div className="p-5 bg-ivory rounded-2xl border border-sand shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-taupe block">Completed Orders</span>
          <p className="font-serif text-3xl font-bold text-cocoa mt-2">{totalOrdersCount}</p>
          <span className="text-[11px] text-taupe mt-1 block">In selected period</span>
        </div>

        <div className="p-5 bg-ivory rounded-2xl border border-sand shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-taupe block">Average Order Value</span>
          <p className="font-serif text-3xl font-bold text-cocoa mt-2">₹{aov}</p>
          <span className="text-[11px] text-taupe mt-1 block">Per successful cart</span>
        </div>

        <div className="p-5 bg-ivory rounded-2xl border border-sand shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-taupe block">Abandoned Cart Value</span>
          <p className="font-serif text-3xl font-bold text-copper mt-2">₹{abandonedValue}</p>
          <span className="text-[11px] text-copper font-medium mt-1 block">{cartUsersCount} Pending patrons</span>
        </div>
      </div>

      {/* Financial Breakdown (Gross vs Shipping vs Discounts vs Net) */}
      <div className="p-6 bg-ivory rounded-3xl border border-sand space-y-4">
        <h2 className="font-serif text-xl text-cocoa font-medium flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-copper" /> Financial Reconciliation
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-porcelain rounded-2xl border border-sand">
            <span className="text-[10px] uppercase font-bold text-taupe block">Gross Product Sales</span>
            <p className="font-serif text-xl font-bold text-cocoa mt-1">₹{grossSubtotal}</p>
          </div>

          <div className="p-4 bg-porcelain rounded-2xl border border-sand">
            <span className="text-[10px] uppercase font-bold text-taupe block">Shipping Fees Collected</span>
            <p className="font-serif text-xl font-bold text-botanical mt-1">+₹{shippingCollected}</p>
          </div>

          <div className="p-4 bg-porcelain rounded-2xl border border-sand">
            <span className="text-[10px] uppercase font-bold text-taupe block">Discounts & Coupons</span>
            <p className="font-serif text-xl font-bold text-clay mt-1">-₹{discountsGiven}</p>
          </div>

          <div className="p-4 bg-porcelain rounded-2xl border border-sand">
            <span className="text-[10px] uppercase font-bold text-taupe block">Final Settled Total</span>
            <p className="font-serif text-xl font-bold text-burgundy mt-1">₹{netRevenue}</p>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Top Products vs Order Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Dynamic Top Selling Products (7 cols) */}
        <div className="lg:col-span-7 bg-ivory p-6 sm:p-8 rounded-3xl border border-sand space-y-4">
          <h2 className="font-serif text-xl text-cocoa font-medium flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-copper" /> Top Selling Pantry Items (By Volume)
          </h2>

          {topSelling.length === 0 ? (
            <p className="text-xs text-taupe py-6 text-center">No orders recorded in this date range.</p>
          ) : (
            <div className="divide-y divide-sand">
              {topSelling.map((item, idx) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-taupe w-5">{idx + 1}.</span>
                    <div>
                      <p className="font-medium text-cocoa">{item.name}</p>
                      <p className="text-[11px] text-taupe font-mono">
                        {item.qty} units sold • ₹{item.revenue} gross
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-burgundy text-xs bg-cream px-2.5 py-1 rounded-full">
                    {item.qty} Sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Order Status Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-ivory p-6 sm:p-8 rounded-3xl border border-sand space-y-4">
          <h2 className="font-serif text-xl text-cocoa font-medium flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-copper" /> Order Pipeline Health
          </h2>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Delivered', count: statusCounts.delivered, color: 'bg-botanical text-ivory' },
              { label: 'Shipped / In Transit', count: statusCounts.shipped, color: 'bg-gold text-cocoa' },
              { label: 'Packed & Ready', count: statusCounts.packed, color: 'bg-copper text-ivory' },
              { label: 'Processing in Kitchen', count: statusCounts.processing, color: 'bg-sand text-cocoa' },
              { label: 'New / Confirmed', count: statusCounts.new + statusCounts.confirmed, color: 'bg-burgundy text-ivory' },
              { label: 'Cancelled', count: statusCounts.cancelled, color: 'bg-clay text-ivory' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between p-3 bg-porcelain rounded-xl text-xs border border-sand">
                <span className="font-medium text-cocoa">{s.label}</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${s.color}`}>
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
