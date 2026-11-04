'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Order, OrderStatus } from '@/types'
import { OrderRepository } from '@/lib/data/repositories'
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  CheckCircle2,
  Truck,
  XCircle,
  Phone,
  Mail,
  Printer,
  FileSpreadsheet,
  Tag,
  Download,
} from 'lucide-react'
import {
  generateOrderInvoicePDF,
  generateDeliveryStickerPDF,
  exportOrdersToCSV,
} from '@/lib/utils/invoiceGenerator'

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionSuccess, setActionSuccess] = useState('')

  useEffect(() => {
    async function load() {
      const data = await OrderRepository.getOrderById(orderId)
      setOrder(data)
      setLoading(false)
    }
    load()
  }, [orderId])

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return
    const updated = await OrderRepository.updateOrderStatus(order.id, newStatus)
    if (updated) {
      setOrder({ ...updated })
      setActionSuccess(`Order updated to ${newStatus}`)
      setTimeout(() => setActionSuccess(''), 3000)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-xs text-taupe">Loading order detail...</div>
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="font-serif text-xl text-cocoa">Order not found</p>
        <Link href="/admin/orders" className="btn-secondary text-xs h-10 px-5">
          Back to Orders
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sand">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl bg-ivory border border-sand hover:text-burgundy"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl text-cocoa">
                Order #{order.orderNumber}
              </h1>
              <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-cream text-burgundy">
                {order.orderStatus}
              </span>
            </div>
            <p className="text-xs text-taupe mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons & Print / Export Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sticker & Invoice Export Group */}
          <div className="flex items-center gap-1.5 p-1 bg-ivory border border-sand rounded-2xl shadow-xs">
            <button
              onClick={() => generateDeliveryStickerPDF(order)}
              type="button"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-burgundy text-ivory hover:bg-burgundy/90 transition-all flex items-center gap-1.5 shadow-xs"
              title="Download 4x6 inch Delivery Box Sticker (Destination, Phone, Pantry Items)"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Print Sticker (PDF)</span>
            </button>

            <button
              onClick={() => generateOrderInvoicePDF(order)}
              type="button"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-porcelain border border-sand text-cocoa hover:border-gold hover:text-burgundy transition-all flex items-center gap-1.5"
              title="Download Full A4 Tax Invoice PDF"
            >
              <Printer className="w-3.5 h-3.5 text-copper" />
              <span>Invoice (PDF)</span>
            </button>

            <button
              onClick={() => exportOrdersToCSV([order], `Order_${order.orderNumber}.csv`)}
              type="button"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-porcelain border border-sand text-cocoa hover:border-gold hover:text-burgundy transition-all flex items-center gap-1.5"
              title="Export Order to CSV Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-botanical" />
              <span>CSV</span>
            </button>
          </div>

          {order.orderStatus === 'confirmed' && (
            <button
              onClick={() => handleUpdateStatus('processing')}
              className="btn-primary h-10 px-4 text-xs"
            >
              Start Processing
            </button>
          )}
          {order.orderStatus === 'processing' && (
            <button
              onClick={() => handleUpdateStatus('packed')}
              className="btn-primary h-10 px-4 text-xs"
            >
              Mark Packed
            </button>
          )}
          {order.orderStatus === 'packed' && (
            <button
              onClick={() => handleUpdateStatus('shipped')}
              className="btn-primary h-10 px-4 text-xs"
            >
              Mark Shipped
            </button>
          )}
          {order.orderStatus === 'shipped' && (
            <button
              onClick={() => handleUpdateStatus('delivered')}
              className="btn-primary h-10 px-4 text-xs bg-botanical hover:bg-botanical/90"
            >
              Mark Delivered
            </button>
          )}
          {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
            <button
              onClick={() => {
                if (confirm('Cancel this order?')) handleUpdateStatus('cancelled')
              }}
              className="btn-secondary h-10 px-4 text-xs text-clay border-clay/30"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-botanical/15 border border-botanical/30 rounded-xl text-botanical text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2-Column Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Product Items & Totals (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-ivory p-6 rounded-3xl border border-sand space-y-4">
            <h2 className="font-serif text-xl text-cocoa flex items-center gap-2">
              <Package className="w-4 h-4 text-copper" /> Ordered Pantry Items ({order.items.length})
            </h2>

            <div className="divide-y divide-sand">
              {order.items.map((item, idx) => (
                <div key={idx} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-porcelain border border-sand flex-shrink-0">
                      <Image
                        src={item.imageSnapshot}
                        alt={item.productNameSnapshot}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm text-cocoa truncate">
                        {item.productNameSnapshot}
                      </p>
                      <p className="text-xs text-taupe font-mono mt-0.5">
                        Qty: {item.quantity} × ₹{item.priceSnapshot}
                      </p>
                    </div>
                  </div>

                  <span className="font-sans font-bold text-sm sm:text-base text-cocoa flex-shrink-0">
                    ₹{item.priceSnapshot * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-sand space-y-2 text-xs text-taupe">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>{order.shipping === 0 ? 'Free' : `₹${order.shipping}`}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-cocoa pt-2 border-t border-sand">
                <span>Total Amount</span>
                <span className="text-burgundy text-lg">₹{order.finalTotal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Customer & Delivery Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Customer Card */}
          <div className="bg-ivory p-6 rounded-3xl border border-sand space-y-4">
            <h3 className="font-serif text-lg text-cocoa flex items-center gap-2">
              <User className="w-4 h-4 text-copper" /> Customer Snapshot
            </h3>

            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-porcelain border border-sand flex-shrink-0">
                {order.customerSnapshot.photoURL ? (
                  <Image src={order.customerSnapshot.photoURL} alt={order.customerSnapshot.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-taupe font-bold">
                    {order.customerSnapshot.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="text-xs">
                <p className="font-bold text-sm text-cocoa">{order.customerSnapshot.name}</p>
                <p className="text-taupe">{order.customerSnapshot.email}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-sand/70 space-y-2 text-xs text-taupe font-sans">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-copper" />
                <a href={`tel:${order.customerSnapshot.phone}`} className="text-cocoa font-medium hover:underline">
                  {order.customerSnapshot.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-copper" />
                <a href={`mailto:${order.customerSnapshot.email}`} className="text-cocoa font-medium hover:underline">
                  {order.customerSnapshot.email}
                </a>
              </div>
            </div>
          </div>

          {/* Delivery Card */}
          <div className="bg-ivory p-6 rounded-3xl border border-sand space-y-3 text-xs text-taupe">
            <h3 className="font-serif text-lg text-cocoa flex items-center gap-2">
              <MapPin className="w-4 h-4 text-copper" /> Delivery Destination
            </h3>
            <p className="font-bold text-cocoa text-sm">{order.deliveryAddressSnapshot.fullName}</p>
            <p className="leading-relaxed">
              {order.deliveryAddressSnapshot.line1}, {order.deliveryAddressSnapshot.area}
              {order.deliveryAddressSnapshot.landmark ? `, Near ${order.deliveryAddressSnapshot.landmark}` : ''}
              <br />
              {order.deliveryAddressSnapshot.city}, {order.deliveryAddressSnapshot.state} - {order.deliveryAddressSnapshot.pin}
            </p>
            <p className="font-mono text-cocoa pt-1">Phone: {order.deliveryAddressSnapshot.phone}</p>
            {order.notes && (
              <p className="italic text-copper pt-2">Instructions: &ldquo;{order.notes}&rdquo;</p>
            )}
          </div>

          {/* Payment Card */}
          <div className="bg-ivory p-6 rounded-3xl border border-sand space-y-3 text-xs text-taupe">
            <h3 className="font-serif text-lg text-cocoa flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-copper" /> Payment Guarantee
            </h3>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-bold uppercase text-botanical">{order.paymentState}</span>
            </div>
            <div className="flex justify-between">
              <span>Method:</span>
              <span className="font-medium text-cocoa uppercase">{order.paymentMethod}</span>
            </div>
            {order.paymentId && (
              <div className="flex justify-between font-mono text-[11px]">
                <span>Transaction Ref:</span>
                <span>{order.paymentId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
