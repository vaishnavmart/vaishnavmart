'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { useCart } from '@/lib/data/CartContext'
import { Address, Order, OrderItemSnapshot } from '@/types'
import { OrderRepository } from '@/lib/data/repositories'
import { getPaymentProvider } from '@/lib/payments/paymentProvider'
import {
  ShieldCheck,
  MapPin,
  CreditCard,
  CheckCircle2,
  Plus,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, isAuthenticated, addAddress } = useAuth()
  const { items, subtotal, shippingCost, total, clearCart } = useCart()

  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1)
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay')
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // New address form state
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false)
  const [newFullName, setNewFullName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newLine1, setNewLine1] = useState('')
  const [newArea, setNewArea] = useState('')
  const [newCity, setNewCity] = useState('New Delhi')
  const [newState, setNewState] = useState('Delhi')
  const [newPin, setNewPin] = useState('110018')

  // Pre-select default address
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0]
      setSelectedAddressId(defaultAddr.id)
    }
  }, [user])

  const selectedAddress = user?.addresses.find((a) => a.id === selectedAddressId) || user?.addresses[0]

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLine1.trim() || !newArea.trim()) return

    const newAddr = await addAddress({
      label: 'Home',
      fullName: newFullName || user?.name || 'Customer',
      phone: newPhone || user?.phone || '',
      line1: newLine1,
      area: newArea,
      city: newCity,
      state: newState,
      pin: newPin,
      isDefault: true,
    })

    if (newAddr?.id) {
      setSelectedAddressId(newAddr.id)
    }

    setIsAddingNewAddress(false)
  }

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddress) {
      setErrorMessage('Please select a valid delivery address')
      setIsProcessing(false)
      return
    }

    if (items.length === 0) {
      setErrorMessage('Your cart is empty')
      setIsProcessing(false)
      return
    }

    setIsProcessing(true)
    setErrorMessage('')

    const createAndSaveOrder = async (payId: string, method: 'razorpay' | 'cod') => {
      try {
        const itemSnapshots: OrderItemSnapshot[] = items.map((i) => ({
          productId: i.productId,
          productNameSnapshot: i.product.name,
          imageSnapshot: i.product.mainImage,
          priceSnapshot: i.product.price,
          mrpSnapshot: i.product.mrp,
          quantity: i.quantity,
        }))

        const orderNumber = `VM-${Date.now().toString().slice(-6)}`
        const newOrder: Order = {
          id: `ord-${Date.now()}`,
          orderNumber,
          userId: user.uid,
          customerSnapshot: {
            name: user.name,
            email: user.email,
            phone: user.phone,
            secondaryPhone: user.secondaryPhone,
            photoURL: user.photoURL,
          },
          deliveryAddressSnapshot: selectedAddress,
          items: itemSnapshots,
          subtotal,
          discount: 0,
          shipping: shippingCost,
          finalTotal: total,
          paymentState: method === 'cod' ? 'pending' : 'paid',
          paymentMethod: method,
          paymentId: payId,
          orderStatus: 'confirmed',
          notes: deliveryNotes || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Store immediately in localStorage for instant hydration on success page
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('vm_last_order', JSON.stringify(newOrder))
          } catch {
            // Storage quota catch
          }
        }

        // Persist order in repository and Firestore
        await OrderRepository.createOrder(newOrder)
        await clearCart()

        // Use router.push or window.location for robust navigation
        router.push(`/order-success/${newOrder.id}`)
      } catch (orderErr: any) {
        console.error('Order creation error:', orderErr)
        setErrorMessage(orderErr?.message || 'Could not save order. Please check connection.')
        setIsProcessing(false)
      }
    }

    try {
      if (paymentMethod === 'cod') {
        await createAndSaveOrder(`cod_${Date.now()}`, 'cod')
        return
      }

      // Online Live Razorpay Payment
      const paymentProvider = getPaymentProvider()
      const paymentOrder = await paymentProvider.createOrder({
        amount: total,
        receipt: `rcpt_${Date.now()}`,
        notes: { userId: user.uid, customerEmail: user.email || '' },
      })

      // If Razorpay SDK is loaded in window
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: paymentOrder.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: paymentOrder.amountPaise ?? Math.round(paymentOrder.amount * 100),
          currency: paymentOrder.currency || 'INR',
          name: 'Vaishnava Mart',
          description: `Order ${paymentOrder.orderId} - Pure Satvik Food`,
          image: '/images/logo/logo.png',
          order_id: paymentOrder.orderId,
          handler: async function (response: any) {
            try {
              const verifyRes = await paymentProvider.verifyPayment({
                orderId: response.razorpay_order_id || paymentOrder.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              })

              if (verifyRes.success) {
                await createAndSaveOrder(response.razorpay_payment_id, 'razorpay')
              } else {
                setErrorMessage('Payment verification failed on server.')
                setIsProcessing(false)
              }
            } catch (vErr: any) {
              setErrorMessage(vErr.message || 'Error verifying Razorpay transaction')
              setIsProcessing(false)
            }
          },
          prefill: {
            name: selectedAddress.fullName || user.name || '',
            email: user.email || '',
            contact: selectedAddress.phone || user.phone || '',
          },
          theme: {
            color: '#800020', // Burgundy
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false)
            },
          },
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.on('payment.failed', function (failRes: any) {
          setErrorMessage(failRes.error?.description || 'Payment was declined')
          setIsProcessing(false)
        })
        rzp.open()
      } else {
        setErrorMessage(
          'Payment gateway is loading or was blocked by an ad-blocker. Please refresh or try again, or select Cash on Delivery.'
        )
        setIsProcessing(false)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order. Please try again.')
      setIsProcessing(false)
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="bg-ivory min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-porcelain border border-sand p-8 rounded-2xl text-center max-w-md">
          <p className="font-serif text-2xl text-cocoa">Please sign in to proceed</p>
          <p className="text-xs text-taupe mt-2">
            You must be signed in with your verified profile to confirm orders.
          </p>
          <div className="pt-6">
            <Link href="/cart" className="btn-primary w-full justify-center text-xs">
              Back to Cart
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-ivory min-h-screen py-10 sm:py-16 border-b border-sand">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        {/* Simple Progress Bar (No heavy animation) */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl sm:text-4xl text-cocoa">Secure Checkout</h1>
          <div className="grid grid-cols-3 gap-2 mt-6">
            {[
              { num: 1, label: '1. Delivery' },
              { num: 2, label: '2. Payment' },
              { num: 3, label: '3. Review' },
            ].map((step) => (
              <button
                key={step.num}
                onClick={() => {
                  if (step.num < currentStage) setCurrentStage(step.num as any)
                }}
                className={`py-3 text-center text-xs font-semibold rounded-xl border transition-all ${
                  currentStage === step.num
                    ? 'bg-burgundy text-ivory border-burgundy shadow-sm'
                    : currentStage > step.num
                    ? 'bg-cream text-burgundy border-sand cursor-pointer'
                    : 'bg-porcelain text-taupe/60 border-sand cursor-not-allowed'
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-clay/10 border border-clay/30 rounded-xl text-clay text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STAGE 1: DELIVERY */}
        {currentStage === 1 && (
          <div className="bg-porcelain rounded-3xl border border-sand p-6 sm:p-10 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-sand">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-burgundy" />
                <h2 className="font-serif text-2xl text-cocoa">Select Delivery Address</h2>
              </div>
              <button
                onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                className="btn-secondary text-xs h-9 px-3.5 inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingNewAddress ? 'Cancel' : 'Add New'}</span>
              </button>
            </div>

            {/* Add Address Inline Form */}
            {isAddingNewAddress && (
              <form onSubmit={handleAddNewAddress} className="p-5 bg-ivory rounded-2xl border border-sand space-y-4">
                <h3 className="font-serif text-lg text-cocoa font-medium">New Delivery Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-taupe block mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-taupe block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-taupe block mb-1">House / Flat / Street *</label>
                  <input
                    type="text"
                    required
                    placeholder="Address line 1"
                    value={newLine1}
                    onChange={(e) => setNewLine1(e.target.value)}
                    className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-taupe block mb-1">Area / Sector *</label>
                    <input
                      type="text"
                      required
                      placeholder="Vikaspuri"
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-taupe block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-taupe block mb-1">PIN *</label>
                    <input
                      type="text"
                      required
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary text-xs h-10 px-5">
                  Save Address
                </button>
              </form>
            )}

            {/* Address Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id
                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-burgundy bg-cream/40 ring-1 ring-burgundy shadow-sm'
                        : 'border-sand bg-ivory hover:border-copper'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-porcelain border border-sand text-burgundy">
                        {addr.label}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-burgundy" />}
                    </div>
                    <p className="font-semibold text-sm text-cocoa">{addr.fullName}</p>
                    <p className="text-xs text-taupe mt-1 leading-relaxed">
                      {addr.line1}, {addr.area}, {addr.city}, {addr.state} - {addr.pin}
                    </p>
                    <p className="text-xs text-taupe font-mono mt-2">Ph: {addr.phone}</p>
                  </div>
                )
              })}
            </div>

            {/* Delivery Note */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1.5">
                Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Ring bell twice, deliver to security, avoid plastic packing"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full p-3 bg-ivory border border-sand rounded-xl text-xs text-cocoa focus:border-burgundy outline-none"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => {
                  if (!selectedAddress) {
                    setErrorMessage('Please choose a delivery address')
                    return
                  }
                  setCurrentStage(2)
                }}
                className="btn-primary text-sm px-8"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: PAYMENT */}
        {currentStage === 2 && (
          <div className="bg-porcelain rounded-3xl border border-sand p-6 sm:p-10 space-y-6">
            <div className="pb-4 border-b border-sand flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-burgundy" />
              <h2 className="font-serif text-2xl text-cocoa">Payment Method</h2>
            </div>

            <div className="space-y-4">
              <div
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === 'razorpay'
                    ? 'border-burgundy bg-cream/40 ring-1 ring-burgundy shadow-sm'
                    : 'border-sand bg-ivory hover:border-copper'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-cocoa">
                      Instant Online Payment (UPI, Cards, NetBanking)
                    </span>
                    <span className="text-[10px] bg-botanical/15 text-botanical font-bold px-2 py-0.5 rounded">
                      Zero Surcharge
                    </span>
                  </div>
                  <p className="text-xs text-taupe mt-1">
                    Processed securely via live Razorpay gateway (UPI, Cards, NetBanking, QR).
                  </p>
                </div>
                {paymentMethod === 'razorpay' && <CheckCircle2 className="w-5 h-5 text-burgundy" />}
              </div>

              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === 'cod'
                    ? 'border-burgundy bg-cream/40 ring-1 ring-burgundy shadow-sm'
                    : 'border-sand bg-ivory hover:border-copper'
                }`}
              >
                <div>
                  <span className="font-semibold text-sm text-cocoa">
                    Cash on Delivery (COD)
                  </span>
                  <p className="text-xs text-taupe mt-1">
                    Pay securely in cash upon physical doorstep receipt.
                  </p>
                </div>
                {paymentMethod === 'cod' && <CheckCircle2 className="w-5 h-5 text-burgundy" />}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button onClick={() => setCurrentStage(1)} className="btn-secondary text-xs h-11 px-5">
                Back
              </button>
              <button onClick={() => setCurrentStage(3)} className="btn-primary text-sm px-8">
                <span>Review Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: REVIEW & PLACE ORDER */}
        {currentStage === 3 && (
          <div className="bg-porcelain rounded-3xl border border-sand p-6 sm:p-10 space-y-8">
            <div className="pb-4 border-b border-sand">
              <h2 className="font-serif text-2xl text-cocoa">Review & Confirm</h2>
              <p className="text-xs text-taupe mt-0.5">Please review your items and address before placing order</p>
            </div>

            {/* Address & Payment Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-ivory rounded-2xl border border-sand text-xs space-y-1">
                <span className="font-semibold uppercase tracking-wider text-copper">Shipping To</span>
                <p className="font-medium text-cocoa text-sm">{selectedAddress?.fullName}</p>
                <p className="text-taupe">{selectedAddress?.line1}, {selectedAddress?.area}</p>
                <p className="text-taupe">{selectedAddress?.city}, {selectedAddress?.state} - {selectedAddress?.pin}</p>
                <p className="font-mono text-taupe">Phone: {selectedAddress?.phone}</p>
              </div>

              <div className="p-4 bg-ivory rounded-2xl border border-sand text-xs space-y-1">
                <span className="font-semibold uppercase tracking-wider text-copper">Payment Method</span>
                <p className="font-medium text-cocoa text-sm">
                  {paymentMethod === 'razorpay' ? 'Instant Online Payment (Razorpay Live)' : 'Cash on Delivery'}
                </p>
                <p className="text-taupe">Customer: {user.name} ({user.email})</p>
                {deliveryNotes && <p className="italic text-taupe mt-2">Note: &ldquo;{deliveryNotes}&rdquo;</p>}
              </div>
            </div>

            {/* Items Snapshot */}
            <div className="space-y-3">
              <span className="text-xs uppercase font-semibold text-taupe tracking-wider block">
                Order Items ({items.length})
              </span>
              <div className="divide-y divide-sand border-y border-sand">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-ivory border border-sand flex-shrink-0">
                        <Image src={product.mainImage} alt={product.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-medium text-cocoa">{product.name}</p>
                        <p className="text-taupe">{product.weight ? `${product.weight}${product.unit} • ` : ''}Qty: {quantity} × ₹{product.price}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm text-cocoa">₹{product.price * quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Total Summary */}
            <div className="p-4 bg-cream/50 rounded-2xl border border-sand space-y-2 text-xs text-taupe">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-cocoa">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{shippingCost === 0 ? 'Complimentary Free' : `₹${shippingCost}`}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-cocoa pt-2 border-t border-sand">
                <span>Final Total Payable</span>
                <span className="text-burgundy text-xl">₹{total}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button onClick={() => setCurrentStage(2)} className="btn-secondary text-xs h-11 px-5">
                Back
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="btn-primary text-base px-10 h-13 justify-center shadow-xl"
              >
                <span>{isProcessing ? 'Processing Order...' : 'Place Order'}</span>
                <ShieldCheck className="w-5 h-5 text-gold" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
