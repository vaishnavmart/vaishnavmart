'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Edit3,
  Package,
  Users,
  ShoppingCart,
  PlusCircle,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react'
import {
  OrderRepository,
  UserRepository,
  CartRepository,
  ProductRepository,
} from '@/lib/data/repositories'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    ordersToday: 0,
    revenueToday: 0,
    newOrders: 0,
    unfinishedCarts: 0,
    lowStock: 0,
  })

  useEffect(() => {
    async function loadStats() {
      let orders: any[] = []
      try {
        const res = await fetch('/api/admin/orders')
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.orders)) {
            orders = json.orders
          }
        }
      } catch {
        // Fallback
      }

      if (orders.length === 0) {
        orders = await OrderRepository.getOrders()
      }

      const [cartUsers, products] = await Promise.all([
        CartRepository.getCartUsers(),
        ProductRepository.getAllProducts(),
      ])

      const todayStr = new Date().toISOString().slice(0, 10)
      const ordersToday = orders.filter((o) => (o.createdAt || '').startsWith(todayStr))
      const revenueToday = ordersToday.reduce((sum, o) => sum + (o.finalTotal || 0), 0)
      const newOrders = orders.filter((o) => o.orderStatus === 'new' || o.orderStatus === 'confirmed')
      const lowStock = products.filter((p) => p.stock <= p.lowStockThreshold)

      setStats({
        ordersToday: ordersToday.length || orders.length,
        revenueToday: revenueToday || orders.reduce((sum, o) => sum + (o.finalTotal || 0), 0),
        newOrders: newOrders.length,
        unfinishedCarts: cartUsers.length,
        lowStock: lowStock.length,
      })
    }
    loadStats()
  }, [])

  const primaryCards = [
    {
      title: 'EDIT',
      subtitle: 'Change anything already on the website',
      icon: Edit3,
      href: '/admin/edit',
      badge: 'Website CMS',
      color: 'border-copper/40 hover:border-burgundy',
    },
    {
      title: 'ORDERS',
      subtitle: 'See and manage customer orders',
      icon: Package,
      href: '/admin/orders',
      badge: `${stats.newOrders} Active`,
      color: 'border-burgundy/40 hover:border-burgundy',
    },
    {
      title: 'USERS',
      subtitle: 'See your customers',
      icon: Users,
      href: '/admin/users',
      badge: 'Customer Directory',
      color: 'border-gold/40 hover:border-burgundy',
    },
    {
      title: 'CART USERS',
      subtitle: 'See customers who have not completed their purchase',
      icon: ShoppingCart,
      href: '/admin/cart-users',
      badge: `${stats.unfinishedCarts} Follow Ups`,
      color: 'border-copper/40 hover:border-burgundy',
    },
    {
      title: 'ADD',
      subtitle: 'Add products, categories or website sections',
      icon: PlusCircle,
      href: '/admin/add',
      badge: 'Quick Creator',
      color: 'border-botanical/40 hover:border-botanical',
    },
  ]

  return (
    <div className="space-y-10">
      {/* Top Welcome */}
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl text-cocoa">Owner Overview</h1>
        <p className="text-xs sm:text-sm text-taupe mt-1">
          Simple, uncompromised control of Vaishnava Mart.
        </p>
      </div>

      {/* Top 5 Simple Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-ivory rounded-2xl border border-sand">
          <span className="text-[11px] font-bold uppercase tracking-wider text-taupe block">Orders</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-cocoa mt-2">{stats.ordersToday}</p>
          <span className="text-[10px] text-taupe mt-1 block">Completed / Pending</span>
        </div>

        <div className="p-4 sm:p-5 bg-ivory rounded-2xl border border-sand">
          <span className="text-[11px] font-bold uppercase tracking-wider text-taupe block">Revenue</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-burgundy mt-2">₹{stats.revenueToday}</p>
          <span className="text-[10px] text-botanical font-medium mt-1 block">Live Sales</span>
        </div>

        <div className="p-4 sm:p-5 bg-ivory rounded-2xl border border-sand">
          <span className="text-[11px] font-bold uppercase tracking-wider text-taupe block">New Orders</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-copper mt-2">{stats.newOrders}</p>
          <span className="text-[10px] text-copper mt-1 block">Needs Packing</span>
        </div>

        <div className="p-4 sm:p-5 bg-ivory rounded-2xl border border-sand">
          <span className="text-[11px] font-bold uppercase tracking-wider text-taupe block">Unfinished Carts</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-cocoa mt-2">{stats.unfinishedCarts}</p>
          <span className="text-[10px] text-taupe mt-1 block">Incomplete Purchases</span>
        </div>

        <div className="p-4 sm:p-5 bg-ivory rounded-2xl border border-sand col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-taupe block">Low Stock</span>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-clay mt-2">{stats.lowStock}</p>
          <span className="text-[10px] text-clay mt-1 block">Items below minimum</span>
        </div>
      </div>

      {/* EXACTLY FIVE VERY LARGE PRIMARY ACTION CARDS */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-taupe">Primary Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {primaryCards.map((card) => {
            const IconComp = card.icon
            return (
              <Link
                key={card.title}
                href={card.href}
                className={`group p-8 bg-ivory rounded-3xl border-2 ${card.color} shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-4 rounded-2xl bg-porcelain border border-sand text-burgundy group-hover:scale-110 transition-transform shadow-sm">
                      <IconComp className="w-8 h-8 text-burgundy" />
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-cream border border-sand text-cocoa">
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-3xl text-cocoa font-normal tracking-wide group-hover:text-burgundy transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-taupe leading-relaxed font-sans mt-2">
                      {card.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-sand/70 flex items-center justify-between text-xs font-bold text-burgundy">
                  <span>Open {card.title}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
