'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Order, OrderStatus, OrderItemSnapshot, Product } from '@/types'
import { OrderRepository, ProductRepository } from '@/lib/data/repositories'
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
  Edit2,
  Plus,
  Trash2,
  RotateCcw,
  AlertTriangle,
  X,
  MessageSquare,
  Send,
  Check,
  ClipboardList,
} from 'lucide-react'
import {
  generateOrderInvoicePDF,
  generateDeliveryStickerPDF,
  generatePackingSlipPDF,
  exportOrdersToCSV,
} from '@/lib/utils/invoiceGenerator'

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionSuccess, setActionSuccess] = useState('')
  const [actionError, setActionError] = useState('')

  // Logistics state
  const [courierPartner, setCourierPartner] = useState('Shiprocket')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [savingLogistics, setSavingLogistics] = useState(false)

  // Line item editing state
  const [isEditingItems, setIsEditingItems] = useState(false)
  const [editableItems, setEditableItems] = useState<OrderItemSnapshot[]>([])
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([])
  const [selectedAddProductId, setSelectedAddProductId] = useState('')
  const [savingItems, setSavingItems] = useState(false)

  // Refund state
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('Customer cancellation / Satvik return')
  const [processingRefund, setProcessingRefund] = useState(false)

  // WhatsApp Concierge state
  const [waType, setWaType] = useState<'order_confirmed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'custom'>('order_confirmed')
  const [waCustomMessage, setWaCustomMessage] = useState('')
  const [sendingWa, setSendingWa] = useState(false)

  useEffect(() => {
    async function load() {
      const [orderData, productsData] = await Promise.all([
        OrderRepository.getOrderById(orderId),
        ProductRepository.getAllProducts(),
      ])

      setOrder(orderData)
      setCatalogProducts(productsData)

      if (orderData) {
        setCourierPartner(orderData.courierPartner || 'Shiprocket')
        setTrackingNumber(orderData.trackingNumber || '')
        setTrackingUrl(orderData.trackingUrl || '')
        setAdminNotes(orderData.adminNotes || '')
        setEditableItems(JSON.parse(JSON.stringify(orderData.items || [])))
        setRefundAmount(String(orderData.finalTotal || ''))
      }
      setLoading(false)
    }
    load()
  }, [orderId])

  const handleSaveLogistics = async () => {
    if (!order) return
    setSavingLogistics(true)
    const updated = await OrderRepository.updateOrderDetails(order.id, {
      courierPartner,
      trackingNumber,
      trackingUrl,
      adminNotes,
    })
    if (updated) {
      setOrder({ ...updated })
      setActionSuccess('Logistics & Staff Notes saved!')
      setTimeout(() => setActionSuccess(''), 3000)
    }
    setSavingLogistics(false)
  }

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return
    const updated = await OrderRepository.updateOrderStatus(order.id, newStatus)
    if (updated) {
      setOrder({ ...updated })
      setActionSuccess(`Order updated to ${newStatus}`)
      setTimeout(() => setActionSuccess(''), 3000)
    }
  }

  // Line item editing functions
  const handleItemQuantityChange = (idx: number, delta: number) => {
    const updated = [...editableItems]
    const newQty = Math.max(1, updated[idx].quantity + delta)
    updated[idx].quantity = newQty
    setEditableItems(updated)
  }

  const handleRemoveItem = (idx: number) => {
    if (editableItems.length <= 1) {
      alert('Order must contain at least one item. Cancel the order instead if needed.')
      return
    }
    setEditableItems(editableItems.filter((_, i) => i !== idx))
  }

  const handleAddNewItem = () => {
    if (!selectedAddProductId) return
    const product = catalogProducts.find((p) => p.id === selectedAddProductId)
    if (!product) return

    const existingIdx = editableItems.findIndex((it) => it.productId === product.id)
    if (existingIdx >= 0) {
      handleItemQuantityChange(existingIdx, 1)
    } else {
      const newItem: OrderItemSnapshot = {
        productId: product.id,
        productNameSnapshot: product.name,
        imageSnapshot: product.mainImage,
        priceSnapshot: product.price,
        mrpSnapshot: product.mrp,
        quantity: 1,
      }
      setEditableItems([...editableItems, newItem])
    }
    setSelectedAddProductId('')
  }

  const handleSaveItemsChanges = async () => {
    if (!order) return
    setSavingItems(true)
    const updated = await OrderRepository.updateOrderItems(order.id, editableItems)
    if (updated) {
      setOrder({ ...updated })
      setIsEditingItems(false)
      setActionSuccess('Order line items and totals updated successfully!')
      setTimeout(() => setActionSuccess(''), 3000)
    }
    setSavingItems(false)
  }

  // Refund processing handler
  const handleTriggerRefund = async () => {
    if (!order) return
    setProcessingRefund(true)
    setActionError('')

    try {
      const res = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          paymentId: order.paymentId || 'mock_pay_id',
          amount: refundAmount ? Number(refundAmount) : order.finalTotal,
          reason: refundReason,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        setOrder(json.order)
        setIsRefundModalOpen(false)
        setActionSuccess(`✓ Refund of ₹${refundAmount} processed (ID: ${json.refundId})`)
        setTimeout(() => setActionSuccess(''), 5000)
      } else {
        setActionError(json.message || 'Refund request failed. Check server logs.')
      }
    } catch (err: any) {
      setActionError(err?.message || 'Error processing refund')
    } finally {
      setProcessingRefund(false)
    }
  }

  // WhatsApp Notification Dispatcher
  const handleSendWhatsApp = async (type = waType) => {
    if (!order) return
    setSendingWa(true)
    setActionError('')

    try {
      const res = await fetch('/api/admin/notifications/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          type,
          customMessage: waCustomMessage,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        window.open(json.whatsappUrl, '_blank')
        setActionSuccess(`✓ WhatsApp notification generated for devotee (${json.phone})! Window opened.`)
        setTimeout(() => setActionSuccess(''), 5000)
      } else {
        setActionError(json.message || 'Failed to prepare WhatsApp message.')
      }
    } catch (err: any) {
      setActionError(err?.message || 'Error sending WhatsApp notification.')
    } finally {
      setSendingWa(false)
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

  // Preview recalculations for edit items mode
  const previewSubtotal = editableItems.reduce(
    (sum, i) => sum + i.priceSnapshot * i.quantity,
    0
  )
  const previewShipping = previewSubtotal >= 499 ? 0 : 60
  const previewTotal = Math.max(0, previewSubtotal + previewShipping - (order.discount || 0))

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
              title="Download 4x6 inch Delivery Box Sticker"
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
              onClick={() => generatePackingSlipPDF(order)}
              type="button"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-porcelain border border-sand text-cocoa hover:border-gold hover:text-burgundy transition-all flex items-center gap-1.5"
              title="Download Warehouse Pick & Pack Slip with Quality Sign-off"
            >
              <ClipboardList className="w-3.5 h-3.5 text-burgundy" />
              <span>Packing Slip</span>
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

      {actionError && (
        <div className="p-3 bg-clay/15 border border-clay/30 rounded-xl text-clay text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 2-Column Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Product Items & Totals (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-ivory p-6 rounded-3xl border border-sand space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-sand">
              <h2 className="font-serif text-xl text-cocoa flex items-center gap-2">
                <Package className="w-4 h-4 text-copper" /> Ordered Pantry Items ({order.items.length})
              </h2>

              {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => setIsEditingItems(!isEditingItems)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-porcelain border border-sand text-cocoa hover:text-burgundy hover:border-gold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 text-copper" />
                  <span>{isEditingItems ? 'Cancel Editing' : 'Edit Items'}</span>
                </button>
              )}
            </div>

            {/* NORMAL VIEW: Display Items */}
            {!isEditingItems ? (
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
            ) : (
              /* EDIT MODE: Interactive Line-Item Editor */
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-cream/50 rounded-2xl border border-gold/40 text-xs text-cocoa">
                  <p className="font-bold">Line-Item Editing Mode</p>
                  <p className="text-[11px] text-taupe">
                    Adjust quantities, remove items, or add new items. Stock will adjust automatically upon saving.
                  </p>
                </div>

                <div className="divide-y divide-sand">
                  {editableItems.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-porcelain border border-sand flex-shrink-0">
                          <Image
                            src={item.imageSnapshot}
                            alt={item.productNameSnapshot}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-xs text-cocoa truncate">
                            {item.productNameSnapshot}
                          </p>
                          <p className="text-[11px] text-taupe font-mono">₹{item.priceSnapshot} each</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-porcelain border border-sand rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(idx, -1)}
                            className="w-6 h-6 rounded-lg bg-ivory flex items-center justify-center font-bold text-xs hover:bg-cream"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(idx, 1)}
                            className="w-6 h-6 rounded-lg bg-ivory flex items-center justify-center font-bold text-xs hover:bg-cream"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-mono font-bold text-xs w-16 text-right">
                          ₹{item.priceSnapshot * item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-clay hover:bg-clay/10 rounded-lg transition-colors"
                          title="Remove item from order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new product dropdown */}
                <div className="pt-3 border-t border-sand flex items-center gap-2">
                  <select
                    value={selectedAddProductId}
                    onChange={(e) => setSelectedAddProductId(e.target.value)}
                    className="flex-1 p-2 bg-porcelain border border-sand rounded-xl text-xs text-cocoa"
                  >
                    <option value="">+ Select product to add to order...</option>
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.price})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddNewItem}
                    disabled={!selectedAddProductId}
                    className="btn-secondary h-9 px-3 text-xs disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </button>
                </div>

                {/* Recalculated Preview & Save Controls */}
                <div className="p-4 bg-porcelain rounded-2xl border border-sand flex items-center justify-between text-xs">
                  <div>
                    <span className="text-taupe">Recalculated Total:</span>
                    <span className="font-serif text-lg font-bold text-burgundy ml-2">
                      ₹{previewTotal}
                    </span>
                    <span className="text-[10px] text-taupe block">
                      (Subtotal: ₹{previewSubtotal} + Shipping: ₹{previewShipping})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditableItems(JSON.parse(JSON.stringify(order.items)))
                        setIsEditingItems(false)
                      }}
                      className="px-3 py-1.5 text-xs text-taupe hover:text-cocoa"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveItemsChanges}
                      disabled={savingItems}
                      className="btn-primary h-9 px-4 text-xs font-bold"
                    >
                      {savingItems ? 'Saving...' : 'Save Order Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Totals Box */}
            <div className="pt-4 border-t border-sand space-y-2 text-xs">
              <div className="flex justify-between text-taupe">
                <span>Subtotal:</span>
                <span className="font-mono">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-taupe">
                <span>Shipping:</span>
                <span className="font-mono">{order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-clay">
                  <span>Discount:</span>
                  <span className="font-mono">-₹{order.discount}</span>
                </div>
              )}
              {order.refundAmount && order.refundAmount > 0 && (
                <div className="flex justify-between text-clay font-bold">
                  <span>Refunded:</span>
                  <span className="font-mono">-₹{order.refundAmount}</span>
                </div>
              )}
              <div className="flex justify-between font-serif text-lg text-cocoa font-bold pt-2 border-t border-sand">
                <span>Final Total:</span>
                <span className="text-burgundy">₹{order.finalTotal}</span>
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

          {/* Payment Card with Refund Trigger */}
          <div className="bg-ivory p-6 rounded-3xl border border-sand space-y-4 text-xs text-taupe">
            <h3 className="font-serif text-lg text-cocoa flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-copper" /> Payment Guarantee & Refunds
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-bold uppercase ${order.paymentState === 'refunded' ? 'text-clay' : 'text-botanical'}`}>
                  {order.paymentState}
                </span>
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
              {order.refundId && (
                <div className="flex justify-between font-mono text-[11px] text-clay">
                  <span>Refund Ref:</span>
                  <span>{order.refundId}</span>
                </div>
              )}
            </div>

            {/* Direct Razorpay Refund Button */}
            {order.paymentState !== 'refunded' && (
              <div className="pt-2 border-t border-sand">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(true)}
                  className="w-full btn-secondary h-9 text-xs text-clay border-clay/30 hover:border-clay hover:bg-clay/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Issue Razorpay Refund</span>
                </button>
              </div>
            )}
          </div>

          {/* Courier Logistics & Parcel Tracking Card */}
          <div className="bg-ivory p-6 rounded-3xl border border-sand space-y-4 text-xs text-taupe">
            <h3 className="font-serif text-lg text-cocoa flex items-center gap-2">
              <Truck className="w-4 h-4 text-copper" /> Courier Logistics & Tracking
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe block mb-1">
                  Courier Partner
                </label>
                <select
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                  className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs text-cocoa"
                >
                  <option value="Shiprocket">Shiprocket (Automated)</option>
                  <option value="Delhivery">Delhivery Express</option>
                  <option value="Blue Dart">Blue Dart Surface/Air</option>
                  <option value="DTDC">DTDC Courier</option>
                  <option value="India Post">India Post (Speed Post)</option>
                  <option value="Local Van">Dedicated Local Cleanroom Van</option>
                  <option value="Self Pickup">Temple Trust Self-Pickup</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe block mb-1">
                  Tracking / AWB Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. DLHV123456789"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs font-mono text-cocoa"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe block mb-1">
                  Direct Tracking URL
                </label>
                <input
                  type="text"
                  placeholder="https://track.delhivery.com/..."
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs font-mono text-cocoa"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe block mb-1">
                  Internal Staff & Kitchen Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Private packing instructions, sacred packaging notes, or delivery verification..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs text-cocoa"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveLogistics}
                disabled={savingLogistics}
                className="w-full btn-secondary h-9 text-xs font-semibold hover:border-gold hover:text-burgundy"
              >
                {savingLogistics ? 'Saving...' : 'Save Logistics & Staff Notes'}
              </button>
            </div>
          </div>

          {/* WhatsApp Patron Concierge & Dispatcher Card */}
          <div className="bg-ivory p-6 rounded-3xl border border-sand space-y-4 text-xs text-taupe shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-sand">
              <h3 className="font-serif text-lg text-cocoa flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-botanical" /> WhatsApp Patron Concierge
              </h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-botanical/15 text-botanical flex items-center gap-1">
                Serverless Dispatch
              </span>
            </div>

            <p className="text-xs text-taupe leading-relaxed">
              Send devotional status, tracking numbers, and delivery blessings directly to the devotee&apos;s WhatsApp.
            </p>

            {/* Quick Templates Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe block">
                Instant Notification Templates
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'order_confirmed', label: 'Order Confirmed' },
                  { id: 'shipped', label: 'Dispatched & AWB' },
                  { id: 'out_for_delivery', label: 'Out for Delivery' },
                  { id: 'delivered', label: 'Delivered Blessing' },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setWaType(tpl.id as any)
                      handleSendWhatsApp(tpl.id as any)
                    }}
                    disabled={sendingWa}
                    className={`p-2.5 rounded-xl text-left font-semibold text-[11px] border transition-all flex items-center justify-between ${
                      waType === tpl.id
                        ? 'bg-cream text-burgundy border-burgundy shadow-xs'
                        : 'bg-porcelain text-cocoa border-sand hover:border-gold'
                    }`}
                  >
                    <span>{tpl.label}</span>
                    <Send className="w-3 h-3 opacity-60" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Note Input */}
            <div className="pt-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe block mb-1">
                Custom Message / Devotional Note (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Optional custom note to accompany this order..."
                value={waCustomMessage}
                onChange={(e) => setWaCustomMessage(e.target.value)}
                className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs text-cocoa outline-none focus:border-gold"
              />
            </div>

            <button
              type="button"
              onClick={() => handleSendWhatsApp(waCustomMessage ? 'custom' : waType)}
              disabled={sendingWa}
              className="w-full h-10 px-4 rounded-xl text-xs font-bold bg-botanical text-ivory hover:bg-botanical/90 transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>
                {sendingWa
                  ? 'Preparing WhatsApp...'
                  : `Send to ${order.deliveryAddressSnapshot.phone || order.customerSnapshot.phone}`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Refund Confirmation Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-ivory border border-sand rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-sand">
              <h3 className="font-serif text-xl text-cocoa font-medium flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-clay" /> Initiate Razorpay Refund
              </h3>
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-cream text-taupe"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-taupe">
              Trigger a secure refund directly to the customer&apos;s source payment method.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe block mb-1">
                  Refund Amount (₹)
                </label>
                <input
                  type="number"
                  max={order.finalTotal}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full p-3 bg-porcelain border border-sand rounded-xl text-sm font-bold text-cocoa font-mono"
                />
                <span className="text-[10px] text-taupe mt-1 block">
                  Original Order Final Total: ₹{order.finalTotal}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe block mb-1">
                  Reason for Refund
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs text-cocoa"
                />
              </div>
            </div>

            {actionError && (
              <div className="p-2.5 bg-clay/15 text-clay rounded-xl text-xs">
                {actionError}
              </div>
            )}

            <div className="pt-3 border-t border-sand flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRefundModalOpen(false)}
                className="px-4 py-2 text-xs text-taupe hover:text-cocoa"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriggerRefund}
                disabled={processingRefund || !refundAmount}
                className="btn-primary h-10 px-5 text-xs bg-clay hover:bg-clay/90 font-bold"
              >
                {processingRefund ? 'Processing with Razorpay...' : `Confirm Refund ₹${refundAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
