'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { UserProfile, Order, Cart, Product } from '@/types'
import { UserRepository, OrderRepository, CartRepository, ProductRepository, AuditLogRepository } from '@/lib/data/repositories'
import {
  ArrowLeft,
  User,
  Package,
  ShoppingCart,
  MapPin,
  ShieldCheck,
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Tag,
} from 'lucide-react'

export default function AdminUserDetailPage() {
  const params = useParams()
  const uid = params.id as string

  const [user, setUser] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [cart, setCart] = useState<Cart | null>(null)
  const [cartProducts, setCartProducts] = useState<Array<{ product: Product; quantity: number }>>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'cart' | 'addresses'>('orders')
  const [loading, setLoading] = useState(true)
  const [adminNotes, setAdminNotes] = useState('')
  const [userStatus, setUserStatus] = useState<'active' | 'suspended'>('active')
  const [savedMsg, setSavedMsg] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [u, o, c] = await Promise.all([
        UserRepository.getUserById(uid),
        OrderRepository.getOrders({ userId: uid }),
        CartRepository.getCart(uid),
      ])
      setUser(u)
      setOrders(o)
      setCart(c)

      if (u) {
        setAdminNotes(u.adminNotes || '')
        setUserStatus(u.status || 'active')
      }

      if (c && c.items.length > 0) {
        const prods: Array<{ product: Product; quantity: number }> = []
        for (const it of c.items) {
          const p = await ProductRepository.getProductById(it.productId)
          if (p) prods.push({ product: p, quantity: it.quantity })
        }
        setCartProducts(prods)
      }

      setLoading(false)
    }
    load()
  }, [uid])

  const handleSaveCustomerCRM = async () => {
    if (!user) return
    setSaving(true)
    const updatedUser: UserProfile = {
      ...user,
      adminNotes,
      status: userStatus,
      updatedAt: new Date().toISOString(),
    }
    await UserRepository.saveUser(updatedUser)
    await AuditLogRepository.addLog(
      'Customer Profile Updated',
      `Updated notes/status for patron ${user.name} (Status: ${userStatus})`,
      'Owner'
    )
    setUser(updatedUser)
    setSaving(false)
    setSavedMsg('Customer CRM notes & status saved!')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  if (loading) {
    return <div className="p-8 text-center text-xs text-taupe">Loading customer profile...</div>
  }

  if (!user) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="font-serif text-xl text-cocoa">Customer not found</p>
        <Link href="/admin/users" className="btn-secondary text-xs h-10 px-5">
          Back to Directory
        </Link>
      </div>
    )
  }

  const totalSpend = orders.reduce((sum, o) => sum + (o.finalTotal || 0), 0)
  const aov = orders.length > 0 ? Math.round(totalSpend / orders.length) : 0

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sand">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="p-2 rounded-xl bg-ivory border border-sand hover:text-burgundy"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl text-cocoa">Customer Profile</h1>
              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  userStatus === 'suspended'
                    ? 'bg-clay/15 text-clay'
                    : 'bg-botanical/15 text-botanical'
                }`}
              >
                {userStatus === 'suspended' ? 'Flagged / Suspended' : 'Active Patron'}
              </span>
            </div>
            <p className="text-xs text-taupe font-mono mt-0.5">UID: {user.uid}</p>
          </div>
        </div>

        {/* Lifetime Metrics Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 bg-ivory border border-sand rounded-2xl text-center shadow-xs">
            <span className="text-[10px] uppercase font-bold text-taupe block">Lifetime Value</span>
            <span className="font-serif text-base font-bold text-burgundy">₹{totalSpend}</span>
          </div>
          <div className="px-4 py-2 bg-ivory border border-sand rounded-2xl text-center shadow-xs">
            <span className="text-[10px] uppercase font-bold text-taupe block">Total Orders</span>
            <span className="font-serif text-base font-bold text-cocoa">{orders.length}</span>
          </div>
          <div className="px-4 py-2 bg-ivory border border-sand rounded-2xl text-center shadow-xs">
            <span className="text-[10px] uppercase font-bold text-taupe block">Avg Order Value</span>
            <span className="font-serif text-base font-bold text-copper">₹{aov}</span>
          </div>
        </div>
      </div>

      {savedMsg && (
        <div className="p-3 bg-botanical/15 border border-botanical/30 rounded-xl text-botanical text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* Customer Snapshot Box & CRM Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Customer Info (7 cols) */}
        <div className="lg:col-span-7 p-6 bg-ivory rounded-3xl border border-sand space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-porcelain border-2 border-burgundy flex-shrink-0 shadow">
              {user.photoURL ? (
                <Image src={user.photoURL} alt={user.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-taupe text-2xl font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="font-serif text-2xl text-cocoa font-medium">{user.name}</h2>
                <span
                  className={`text-[11px] font-bold px-3 py-1 rounded-full w-fit mx-auto sm:mx-0 ${
                    user.profileComplete
                      ? 'bg-botanical/15 text-botanical'
                      : 'bg-clay/15 text-clay'
                  }`}
                >
                  {user.profileComplete ? '✓ Profile Complete' : 'Profile Incomplete'}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-xs text-taupe">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-copper" /> {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-copper" /> {user.phone || 'No phone'}
                </span>
                {user.gender && <span>Gender: {user.gender}</span>}
                {user.age && <span>Age: {user.age} yrs</span>}
              </div>

              <div className="pt-2 text-[11px] text-taupe">
                <span>Customer since {new Date(user.createdAt).toLocaleDateString('en-IN')}</span>
                <span className="ml-3">• Marketing Consent: {user.marketingConsent ? 'Granted' : 'Not Granted'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Staff CRM Controls & Internal Notes (5 cols) */}
        <div className="lg:col-span-5 p-6 bg-ivory rounded-3xl border border-sand space-y-4">
          <h3 className="font-serif text-lg text-cocoa flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-copper" /> Staff CRM & Account Controls
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe block mb-1">
                Account Status
              </label>
              <select
                value={userStatus}
                onChange={(e) => setUserStatus(e.target.value as any)}
                className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs text-cocoa"
              >
                <option value="active">Active (Full Purchasing Privileges)</option>
                <option value="suspended">Flagged / Suspended (Restricted Orders)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe block mb-1">
                Internal Patron Notes
              </label>
              <textarea
                rows={3}
                placeholder="VIP patron notes, temple trust affiliations, packaging instructions..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full p-2.5 bg-porcelain border border-sand rounded-xl text-xs text-cocoa"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveCustomerCRM}
              disabled={saving}
              className="w-full btn-secondary h-9 text-xs font-semibold hover:border-gold hover:text-burgundy"
            >
              {saving ? 'Saving...' : 'Save Patron Notes & Status'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-sand pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'orders'
              ? 'bg-burgundy text-ivory'
              : 'text-taupe hover:text-cocoa bg-ivory border border-sand'
          }`}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('cart')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'cart'
              ? 'bg-burgundy text-ivory'
              : 'text-taupe hover:text-cocoa bg-ivory border border-sand'
          }`}
        >
          Active Cart ({cartProducts.length || cart?.items.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'addresses'
              ? 'bg-burgundy text-ivory'
              : 'text-taupe hover:text-cocoa bg-ivory border border-sand'
          }`}
        >
          Saved Addresses ({user.addresses?.length || 0})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="p-8 text-center text-xs text-taupe bg-ivory rounded-2xl border border-sand">
              No orders placed by this user yet.
            </p>
          ) : (
            orders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="p-4 bg-ivory rounded-2xl border border-sand hover:border-gold/60 flex items-center justify-between text-xs block group shadow-xs"
              >
                <div>
                  <span className="font-mono font-bold text-burgundy">#{o.orderNumber}</span>
                  <span className="text-taupe ml-2">
                    {new Date(o.createdAt).toLocaleDateString('en-IN')}
                  </span>
                  <p className="text-taupe mt-1">{o.items.length} items</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-cocoa block">₹{o.finalTotal}</span>
                  <span className="font-bold uppercase text-[10px] text-burgundy">{o.orderStatus}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === 'cart' && (
        <div className="bg-ivory p-6 rounded-3xl border border-sand space-y-3">
          {cartProducts.length === 0 ? (
            <p className="text-xs text-taupe text-center py-6">Customer cart is currently empty.</p>
          ) : (
            <div className="divide-y divide-sand">
              {cartProducts.map(({ product, quantity }, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-porcelain border border-sand flex-shrink-0">
                      <Image src={product.mainImage} alt={product.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-cocoa">{product.name}</p>
                      <p className="text-taupe font-mono">₹{product.price} each</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono block">Qty: {quantity}</span>
                    <span className="text-copper font-bold">₹{product.price * quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(user.addresses || []).map((a) => (
            <div key={a.id} className="p-5 bg-ivory rounded-2xl border border-sand text-xs space-y-1 shadow-xs">
              <span className="font-bold uppercase tracking-wider text-copper">{a.label}</span>
              <p className="font-bold text-cocoa">{a.fullName}</p>
              <p className="text-taupe">{a.line1}, {a.area}</p>
              <p className="text-taupe">{a.city}, {a.state} - {a.pin}</p>
              <p className="font-mono text-cocoa pt-1">Ph: {a.phone}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
