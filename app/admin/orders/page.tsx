'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Order, OrderStatus } from '@/types'
import { OrderRepository } from '@/lib/data/repositories'
import { Search, Package, ArrowRight, User, FileSpreadsheet, Download } from 'lucide-react'
import { exportOrdersToCSV } from '@/lib/utils/invoiceGenerator'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const queryParams = new URLSearchParams()
        if (filterStatus && filterStatus !== 'all') queryParams.set('status', filterStatus)
        if (searchTerm) queryParams.set('search', searchTerm)

        const res = await fetch(`/api/admin/orders?${queryParams.toString()}`)
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.orders)) {
            setOrders(json.orders)
            setLoading(false)
            return
          }
        }
      } catch {
        // Fallback to client repository
      }

      const data = await OrderRepository.getOrders({
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: searchTerm || undefined,
      })
      setOrders(data)
      setLoading(false)
    }
    load()
  }, [filterStatus, searchTerm])

  const statusFilters = [
    'all',
    'new',
    'confirmed',
    'processing',
    'packed',
    'shipped',
    'delivered',
    'cancelled',
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-cocoa">Manage Orders</h1>
          <p className="text-xs sm:text-sm text-taupe mt-1">
            Review live patron orders, generate delivery stickers, download invoices, and export CSV data.
          </p>
        </div>

        {/* Bulk Export CSV Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportOrdersToCSV(orders, `All_Orders_Export_${new Date().toISOString().slice(0, 10)}.csv`)}
            disabled={orders.length === 0}
            type="button"
            className="btn-secondary h-10 px-4 text-xs inline-flex items-center gap-2 hover:border-gold hover:text-burgundy disabled:opacity-50"
            title="Export all currently displayed orders to CSV spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-botanical" />
            <span>Export View to CSV ({orders.length})</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-taupe absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, customer name, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-sand rounded-2xl text-xs sm:text-sm outline-none focus:border-burgundy"
          />
        </div>

        {/* Status Filters Pill Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {statusFilters.map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                filterStatus === st
                  ? 'bg-burgundy text-ivory shadow-sm'
                  : 'bg-ivory border border-sand text-taupe hover:text-cocoa'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-taupe">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-ivory rounded-3xl border border-sand p-8 space-y-3">
          <Package className="w-10 h-10 mx-auto text-taupe opacity-40" />
          <p className="font-serif text-xl text-cocoa">No orders matching this view</p>
          <p className="text-xs text-taupe">Try clearing your search term or switching to &apos;all&apos; status.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="p-5 bg-ivory rounded-2xl border border-sand hover:border-gold/60 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 block group"
            >
              {/* Order & Customer */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-porcelain border border-sand flex-shrink-0">
                  {order.customerSnapshot.photoURL ? (
                    <Image
                      src={order.customerSnapshot.photoURL}
                      alt={order.customerSnapshot.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-taupe">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-burgundy">
                      #{order.orderNumber}
                    </span>
                    {order.id.startsWith('ord-100') ? (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-sand/60 text-taupe">
                        Demo
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-botanical/15 text-botanical">
                        Live Order
                      </span>
                    )}
                    <span className="text-xs text-taupe">
                      • {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="font-medium text-xs sm:text-sm text-cocoa truncate">
                    {order.customerSnapshot.name} ({order.customerSnapshot.phone})
                  </p>
                  <p className="text-[11px] text-taupe truncate mt-0.5">
                    {order.items.map((i) => i.productNameSnapshot).join(', ')}
                  </p>
                </div>
              </div>

              {/* Status & Amount */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-sand/70">
                <div className="text-left sm:text-right">
                  <span className="font-sans font-bold text-sm sm:text-base text-cocoa block">
                    ₹{order.finalTotal}
                  </span>
                  <span className="text-[10px] text-taupe">{order.items.length} items</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-cream text-burgundy">
                    {order.orderStatus}
                  </span>
                  <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-botanical/15 text-botanical">
                    {order.paymentState}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-porcelain border border-sand group-hover:text-burgundy">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
