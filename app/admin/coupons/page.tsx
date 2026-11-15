'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Coupon, DiscountType } from '@/types'
import {
  Tag,
  Plus,
  Copy,
  Check,
  Trash2,
  Calendar,
  AlertTriangle,
  Sparkles,
  Percent,
  Coins,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Search,
  Filter,
} from 'lucide-react'

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Filter / Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'inactive'>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [formCode, setFormCode] = useState('')
  const [formType, setFormType] = useState<DiscountType>('percentage')
  const [formValue, setFormValue] = useState('10')
  const [formMinOrder, setFormMinOrder] = useState('499')
  const [formMaxDiscount, setFormMaxDiscount] = useState('150')
  const [formExpiry, setFormExpiry] = useState('')
  const [formUsageLimit, setFormUsageLimit] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [formDescription, setFormDescription] = useState('')
  const [savingCoupon, setSavingCoupon] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const loadCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons')
      const json = await res.json()
      if (json.success && Array.isArray(json.coupons)) {
        setCoupons(json.coupons)
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    showToast(`Coupon code "${code}" copied to clipboard!`)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const openCreateModal = () => {
    setEditingCoupon(null)
    setFormCode('')
    setFormType('percentage')
    setFormValue('10')
    setFormMinOrder('499')
    setFormMaxDiscount('150')
    setFormExpiry('')
    setFormUsageLimit('')
    setFormActive(true)
    setFormDescription('')
    setIsModalOpen(true)
  }

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormCode(coupon.code)
    setFormType(coupon.discountType)
    setFormValue(String(coupon.discountValue))
    setFormMinOrder(String(coupon.minOrderAmount))
    setFormMaxDiscount(coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : '')
    setFormExpiry(coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : '')
    setFormUsageLimit(coupon.usageLimit ? String(coupon.usageLimit) : '')
    setFormActive(coupon.active)
    setFormDescription(coupon.description || '')
    setIsModalOpen(true)
  }

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCode.trim()) {
      showToast('Please enter a coupon code.', 'error')
      return
    }

    setSavingCoupon(true)
    try {
      const payload: Partial<Coupon> = {
        id: editingCoupon ? editingCoupon.id : undefined,
        code: formCode.trim().toUpperCase(),
        discountType: formType,
        discountValue: Number(formValue),
        minOrderAmount: Number(formMinOrder) || 0,
        maxDiscountAmount: formMaxDiscount ? Number(formMaxDiscount) : undefined,
        expiryDate: formExpiry ? new Date(formExpiry).toISOString() : undefined,
        usageLimit: formUsageLimit ? Number(formUsageLimit) : undefined,
        active: formActive,
        description: formDescription.trim(),
        timesUsed: editingCoupon ? editingCoupon.timesUsed : 0,
      }

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (res.ok && json.success) {
        showToast(`Promo coupon "${json.coupon.code}" saved successfully!`)
        setIsModalOpen(false)
        loadCoupons()
      } else {
        showToast(json.message || 'Failed to save coupon.', 'error')
      }
    } catch (err: any) {
      showToast(err?.message || 'Error communicating with server.', 'error')
    } finally {
      setSavingCoupon(false)
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    const updatedStatus = !coupon.active
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...coupon, active: updatedStatus }),
      })
      if (res.ok) {
        setCoupons(coupons.map((c) => (c.id === coupon.id ? { ...c, active: updatedStatus } : c)))
        showToast(`Coupon "${coupon.code}" is now ${updatedStatus ? 'ACTIVE' : 'INACTIVE'}.`)
      }
    } catch {
      showToast('Failed to toggle coupon status.', 'error')
    }
  }

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) return

    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCoupons(coupons.filter((c) => c.id !== id))
        showToast(`Coupon "${code}" was deleted.`)
      } else {
        showToast('Failed to delete coupon.', 'error')
      }
    } catch {
      showToast('Error deleting coupon.', 'error')
    }
  }

  // Filtered list
  const now = new Date()
  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    const isExpired = c.expiryDate && new Date(c.expiryDate) < now
    if (statusFilter === 'active') return c.active && !isExpired
    if (statusFilter === 'expired') return isExpired
    if (statusFilter === 'inactive') return !c.active
    return true
  })

  // Aggregate stats
  const activeCount = coupons.filter((c) => c.active && (!c.expiryDate || new Date(c.expiryDate) >= now)).length
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.timesUsed || 0), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sand">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-3xl sm:text-4xl text-cocoa">Coupons & Promotions</h1>
            <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-cream text-burgundy flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              Sacred Offers
            </span>
          </div>
          <p className="text-xs sm:text-sm text-taupe mt-1">
            Manage festival discounts, Ekadashi codes, and promotional rules. Validated server-side during checkout.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          type="button"
          className="btn-primary h-11 px-5 text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 shadow-xs transition-all ${
            notification.type === 'success'
              ? 'bg-botanical/15 border-botanical/30 text-botanical'
              : 'bg-clay/15 border-clay/30 text-clay'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-ivory rounded-2xl border border-sand flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-taupe block">Active Offers</span>
            <p className="font-serif text-3xl font-bold text-burgundy mt-1">{activeCount}</p>
            <span className="text-[10px] text-botanical font-medium mt-0.5 block">Ready for customer checkout</span>
          </div>
          <div className="p-3 bg-porcelain rounded-2xl border border-sand text-burgundy">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-ivory rounded-2xl border border-sand flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-taupe block">Total Redemptions</span>
            <p className="font-serif text-3xl font-bold text-cocoa mt-1">{totalRedemptions}</p>
            <span className="text-[10px] text-copper font-medium mt-0.5 block">Used across customer orders</span>
          </div>
          <div className="p-3 bg-porcelain rounded-2xl border border-sand text-copper">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-ivory rounded-2xl border border-sand flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-taupe block">Total Catalog Offers</span>
            <p className="font-serif text-3xl font-bold text-cocoa mt-1">{coupons.length}</p>
            <span className="text-[10px] text-taupe font-medium mt-0.5 block">Configured promotional rules</span>
          </div>
          <div className="p-3 bg-porcelain rounded-2xl border border-sand text-taupe">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-taupe absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coupon code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-sand rounded-xl text-xs text-cocoa placeholder:text-taupe focus:border-gold outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-ivory border border-sand rounded-2xl">
          {(['all', 'active', 'expired', 'inactive'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-burgundy text-ivory shadow-xs'
                  : 'text-cocoa hover:text-burgundy'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons List / Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-taupe font-serif">Loading promotional codes...</div>
      ) : filteredCoupons.length === 0 ? (
        <div className="p-12 bg-ivory rounded-3xl border border-sand text-center space-y-3">
          <Tag className="w-8 h-8 text-taupe mx-auto" />
          <p className="font-serif text-lg text-cocoa">No coupons found</p>
          <p className="text-xs text-taupe">Try adjusting your search or create a new coupon code.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCoupons.map((c) => {
            const isExpired = c.expiryDate && new Date(c.expiryDate) < now
            const isMaxUsed = c.usageLimit ? c.timesUsed >= c.usageLimit : false

            return (
              <div
                key={c.id}
                className={`p-6 bg-ivory rounded-3xl border transition-all flex flex-col justify-between space-y-5 ${
                  !c.active || isExpired
                    ? 'border-sand opacity-75'
                    : 'border-sand hover:border-burgundy shadow-sm hover:shadow-md'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar with Badge & Active Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isExpired ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-clay/15 text-clay">
                          Expired
                        </span>
                      ) : !c.active ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sand text-taupe">
                          Inactive
                        </span>
                      ) : isMaxUsed ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-copper/15 text-copper">
                          Limit Reached
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-botanical/15 text-botanical">
                          Active & Live
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        c.active
                          ? 'bg-cream text-botanical border-botanical/30 hover:bg-botanical/10'
                          : 'bg-porcelain text-taupe border-sand hover:bg-sand/30'
                      }`}
                      title={c.active ? 'Click to Deactivate' : 'Click to Activate'}
                    >
                      {c.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>

                  {/* Coupon Code & Copy */}
                  <div className="flex items-center justify-between p-3 bg-porcelain border border-sand/80 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-burgundy flex-shrink-0" />
                      <span className="font-mono font-bold text-base tracking-wider text-burgundy">
                        {c.code}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(c.code)}
                      className="p-1.5 rounded-lg hover:bg-sand/40 text-taupe hover:text-cocoa transition-colors"
                      title="Copy Code"
                    >
                      {copiedCode === c.code ? (
                        <Check className="w-4 h-4 text-botanical" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Offer Value Highlight */}
                  <div>
                    <p className="font-serif text-2xl font-bold text-cocoa">
                      {c.discountType === 'percentage'
                        ? `${c.discountValue}% OFF`
                        : `â‚¹${c.discountValue} FLAT OFF`}
                    </p>
                    <p className="text-xs text-taupe mt-1 leading-relaxed">
                      {c.description || 'Valid on all Satvik & Jain pantry staples.'}
                    </p>
                  </div>

                  {/* Criteria Tags */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center justify-between text-taupe">
                      <span>Min Order Cart:</span>
                      <span className="font-semibold text-cocoa">â‚¹{c.minOrderAmount}</span>
                    </div>

                    {c.maxDiscountAmount && c.discountType === 'percentage' && (
                      <div className="flex items-center justify-between text-taupe">
                        <span>Max Cap:</span>
                        <span className="font-semibold text-cocoa">â‚¹{c.maxDiscountAmount}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-taupe">
                      <span>Redemptions:</span>
                      <span className="font-semibold text-cocoa">
                        {c.timesUsed} {c.usageLimit ? `/ ${c.usageLimit} max` : 'used'}
                      </span>
                    </div>

                    {c.expiryDate && (
                      <div className="flex items-center justify-between text-taupe">
                        <span>Expires On:</span>
                        <span className="font-semibold text-cocoa">
                          {new Date(c.expiryDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-sand flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => openEditModal(c)}
                    className="text-xs font-semibold text-burgundy hover:underline"
                  >
                    Edit Offer Rules
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCoupon(c.id, c.code)}
                    className="p-1.5 rounded-lg text-taupe hover:text-clay hover:bg-clay/10 transition-colors"
                    title="Delete Coupon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-ivory rounded-3xl border border-sand w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-sand">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-burgundy" />
                <h2 className="font-serif text-2xl text-cocoa font-medium">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Promotional Coupon'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-taupe hover:text-cocoa hover:bg-sand/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-5">
              {/* Code */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-taupe block mb-1">
                  Coupon Code (e.g. EKADASHI10, VRAT50) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="EKADASHI10"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="w-full p-3 bg-porcelain border border-sand rounded-xl font-mono font-bold text-sm text-burgundy tracking-wider outline-none focus:border-gold"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-taupe block mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as DiscountType)}
                    className="w-full p-3 bg-porcelain border border-sand rounded-xl text-xs font-medium text-cocoa outline-none focus:border-gold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Rupee (â‚¹)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-taupe block mb-1">
                    {formType === 'percentage' ? 'Percentage Off (%) *' : 'Flat Off (â‚¹) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full p-3 bg-porcelain border border-sand rounded-xl text-sm font-bold text-cocoa outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-taupe block mb-1">
                    Min Order Subtotal (â‚¹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="499"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    className="w-full p-3 bg-porcelain border border-sand rounded-xl text-xs font-mono text-cocoa outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-taupe block mb-1">
                    Max Discount Cap (â‚¹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={formType === 'percentage' ? '150' : 'N/A'}
                    disabled={formType === 'flat'}
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    className="w-full p-3 bg-porcelain border border-sand rounded-xl text-xs font-mono text-cocoa outline-none focus:border-gold disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Expiry & Redemptions Limit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-taupe block mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formExpiry}
                    onChange={(e) => setFormExpiry(e.target.value)}
                    className="w-full p-3 bg-porcelain border border-sand rounded-xl text-xs text-cocoa outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-taupe block mb-1">
                    Usage Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    className="w-full p-3 bg-porcelain border border-sand rounded-xl text-xs font-mono text-cocoa outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* Public Description */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-taupe block mb-1">
                  Offer Tagline / Devotional Note
                </label>
                <input
                  type="text"
                  placeholder="10% off for Holy Ekadashi vrat groceries"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-3 bg-porcelain border border-sand rounded-xl text-xs text-cocoa outline-none focus:border-gold"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 p-3 bg-porcelain border border-sand rounded-xl">
                <input
                  type="checkbox"
                  id="formActiveCheck"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 accent-burgundy cursor-pointer"
                />
                <label htmlFor="formActiveCheck" className="text-xs font-semibold text-cocoa cursor-pointer">
                  Activate this coupon immediately for customer checkout
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary h-11 px-5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCoupon}
                  className="btn-primary h-11 px-6 text-xs font-semibold inline-flex items-center gap-2 shadow-sm"
                >
                  {savingCoupon ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
