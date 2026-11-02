'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { UserProfile } from '@/types'
import { UserRepository, OrderRepository } from '@/lib/data/repositories'
import { Search, User, ArrowRight, ShieldCheck } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [userOrdersCount, setUserOrdersCount] = useState<Record<string, number>>({})
  const [userSpend, setUserSpend] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      let allUsers: UserProfile[] = []
      let allOrders: any[] = []

      try {
        const queryParams = new URLSearchParams()
        if (searchTerm) queryParams.set('search', searchTerm)

        const [usersRes, ordersRes] = await Promise.all([
          fetch(`/api/admin/users?${queryParams.toString()}`),
          fetch(`/api/admin/orders`),
        ])

        if (usersRes.ok) {
          const usersJson = await usersRes.json()
          if (usersJson.success && Array.isArray(usersJson.users)) {
            allUsers = usersJson.users
          }
        }

        if (ordersRes.ok) {
          const ordersJson = await ordersRes.json()
          if (ordersJson.success && Array.isArray(ordersJson.orders)) {
            allOrders = ordersJson.orders
          }
        }
      } catch {
        // Fallback to local repository
      }

      if (allUsers.length === 0) {
        allUsers = await UserRepository.getAllUsers({ search: searchTerm || undefined })
      }
      if (allOrders.length === 0) {
        allOrders = await OrderRepository.getOrders()
      }

      const counts: Record<string, number> = {}
      const spend: Record<string, number> = {}

      allOrders.forEach((o) => {
        counts[o.userId] = (counts[o.userId] || 0) + 1
        spend[o.userId] = (spend[o.userId] || 0) + (o.finalTotal || 0)
      })

      setUsers(allUsers)
      setUserOrdersCount(counts)
      setUserSpend(spend)
      setLoading(false)
    }
    load()
  }, [searchTerm])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl text-cocoa">Customer Directory</h1>
        <p className="text-xs sm:text-sm text-taupe mt-1">
          Registered patrons with verified profiles and delivery histories.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-taupe absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by customer name, phone, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-sand rounded-2xl text-xs sm:text-sm outline-none focus:border-burgundy"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-taupe">Loading customer directory...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 bg-ivory rounded-3xl border border-sand p-8 space-y-2">
          <User className="w-10 h-10 mx-auto text-taupe opacity-40" />
          <p className="font-serif text-xl text-cocoa">No customers match this query</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Link
              key={u.uid}
              href={`/admin/users/${u.uid}`}
              className="p-5 bg-ivory rounded-2xl border border-sand hover:border-gold/60 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 block group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-porcelain border border-sand flex-shrink-0">
                  {u.photoURL ? (
                    <Image src={u.photoURL} alt={u.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-taupe font-bold">
                      {u.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-cocoa group-hover:text-burgundy transition-colors truncate">
                      {u.name}
                    </p>
                    {u.uid.startsWith('user-mock-') ? (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-sand/60 text-taupe">
                        Demo
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-botanical/15 text-botanical font-mono">
                        Live Patron
                      </span>
                    )}
                    {u.profileComplete && (
                      <span className="text-[10px] text-botanical font-semibold flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Complete
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-taupe">{u.email} • {u.phone}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-sand/70 text-xs text-taupe">
                <div className="text-left sm:text-right">
                  <span className="font-bold text-sm text-cocoa block">
                    {userOrdersCount[u.uid] || 0} Orders
                  </span>
                  <span className="text-[11px] text-burgundy font-semibold">
                    ₹{userSpend[u.uid] || 0} Total Spend
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
