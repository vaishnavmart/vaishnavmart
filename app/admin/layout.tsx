'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Edit,
  Package,
  Users,
  ShoppingCart,
  PlusCircle,
  MoreHorizontal,
  LogOut,
  Boxes,
  BarChart3,
  Settings,
  History,
  Menu,
  X,
  Bell,
} from 'lucide-react'
import { NotificationRepository } from '@/lib/data/repositories'
import { AdminNotification } from '@/types'
import { auth } from '@/lib/firebase/config'
import { onAuthStateChanged } from 'firebase/auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [moreExpanded, setMoreExpanded] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  // Verify auth session
  useEffect(() => {
    let isMounted = true

    const verifySession = async () => {
      try {
        const res = await fetch('/api/auth/owner-login')
        const data = await res.json()
        if (data.isAuthenticated) {
          return
        }

        // Fallback: check if active Firebase user is an authorized admin
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser?.email) {
            try {
              const exchangeRes = await fetch('/api/auth/owner-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: fbUser.email, authType: 'google' }),
              })
              const exchangeData = await exchangeRes.json()
              if (exchangeRes.ok && exchangeData.success) {
                return
              }
            } catch {
              // Fall through to redirect
            }
          }
          if (isMounted) {
            router.push('/owner-login')
          }
        })

        return () => unsubscribe()
      } catch {
        if (isMounted) {
          router.push('/owner-login')
        }
      }
    }

    verifySession()
    NotificationRepository.getNotifications().then(setNotifications)

    return () => {
      isMounted = false
    }
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/owner-login', { method: 'DELETE' })
    router.push('/owner-login')
  }

  const primaryLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/edit', label: 'Edit', icon: Edit },
    { href: '/admin/orders', label: 'Orders', icon: Package },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/cart-users', label: 'Cart Users', icon: ShoppingCart },
    { href: '/admin/add', label: 'Add', icon: PlusCircle },
  ]

  const moreLinks = [
    { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
    { href: '/admin/audit-log', label: 'Audit Log', icon: History },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-porcelain flex font-sans text-cocoa">
      {/* DESKTOP SIDEBAR (250px - 280px) */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-ivory border-r border-sand flex-col justify-between p-6 fixed inset-y-0 z-30">
        <div className="space-y-6">
          {/* Logo */}
          <div className="pb-4 border-b border-sand">
            <Link href="/admin" className="block relative w-44 h-14 rounded-xl overflow-hidden bg-black border border-gold/40 shadow-xs">
              <Image
                src="/images/logo/logo.png"
                alt="Ras Kan - True Vaishnav Standards"
                fill
                priority
                sizes="176px"
                className="object-contain p-1"
              />
            </Link>
            <span className="text-[10px] font-bold uppercase tracking-widest text-burgundy block mt-2">
              Super Admin Control
            </span>
          </div>

          {/* EXACTLY 5 PRIMARY ACTIONS + DASHBOARD */}
          <nav className="space-y-1.5">
            {primaryLinks.map((link) => {
              const IconComp = link.icon
              const isActive = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-burgundy text-ivory shadow-md'
                      : 'text-cocoa hover:bg-cream/50'
                  }`}
                >
                  <IconComp className={`w-5 h-5 ${isActive ? 'text-gold' : 'text-taupe'}`} />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* MORE EXPANDABLE MENU */}
          <div className="pt-2 border-t border-sand">
            <button
              onClick={() => setMoreExpanded(!moreExpanded)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold text-taupe uppercase tracking-wider hover:bg-cream/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MoreHorizontal className="w-4 h-4" />
                <span>More Tools</span>
              </div>
              <span className="text-xs">{moreExpanded ? '▲' : '▼'}</span>
            </button>

            {moreExpanded && (
              <div className="mt-1 space-y-1 pl-2">
                {moreLinks.map((m) => {
                  const IconComp = m.icon
                  const isActive = pathname.startsWith(m.href)
                  return (
                    <Link
                      key={m.href}
                      href={m.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-cream text-burgundy font-bold'
                          : 'text-cocoa hover:bg-cream/40'
                      }`}
                    >
                      <IconComp className="w-4 h-4 text-taupe" />
                      <span>{m.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom User & Logout */}
        <div className="pt-4 border-t border-sand space-y-3">
          <div className="text-xs text-taupe px-2">
            <p className="font-semibold text-cocoa">Owner Console</p>
            <p className="text-[11px] font-mono text-copper">owner@vaishnavamart.local</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full btn-secondary h-10 px-3 text-xs justify-center rounded-xl text-clay border-clay/30 hover:bg-clay/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN WORKSPACE */}
      <div className="flex-1 lg:pl-64 xl:pl-72 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 bg-ivory border-b border-sand sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 -ml-2 text-cocoa hover:text-burgundy"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-xs font-semibold text-taupe hidden sm:inline">
              Vaishnava Mart Owner Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* View public site link */}
            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold text-burgundy hover:underline px-3 py-1.5 bg-cream/70 rounded-lg"
            >
              View Public Website ↗
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-cocoa hover:text-burgundy rounded-full hover:bg-cream/40 relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-clay" />
                )}
              </button>

              {/* Notification Flyout */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-porcelain border border-sand rounded-2xl shadow-xl p-4 space-y-3 z-30">
                  <div className="flex items-center justify-between pb-2 border-b border-sand">
                    <span className="font-semibold text-xs text-cocoa">Owner Notifications</span>
                    <span className="text-[10px] text-taupe">{unreadCount} unread</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                          n.read ? 'bg-ivory border-sand/60 text-taupe' : 'bg-cream/40 border-gold/40 text-cocoa'
                        }`}
                      >
                        <p className="font-bold">{n.title}</p>
                        <p className="text-[11px]">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* MOBILE DRAWER */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-cocoa/50 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 w-72 h-full bg-ivory shadow-2xl flex flex-col justify-between p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-sand">
                <div className="relative w-36 h-12 rounded-lg overflow-hidden bg-black border border-gold/40 shadow-xs">
                  <Image src="/images/logo/logo.png" alt="Ras Kan" fill className="object-contain p-0.5" />
                </div>
                <button onClick={() => setMobileDrawerOpen(false)} className="p-1 text-taupe">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {primaryLinks.map((link) => {
                  const IconComp = link.icon
                  const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                        isActive ? 'bg-burgundy text-ivory' : 'text-cocoa'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="pt-2 border-t border-sand space-y-1">
                <p className="text-[10px] uppercase font-bold text-taupe tracking-wider px-2 mb-1">More</p>
                {moreLinks.map((m) => (
                  <Link
                    key={m.href}
                    href={m.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="block px-3 py-2 text-xs font-medium text-cocoa"
                  >
                    {m.label}
                  </Link>
                ))}
              </div>
            </div>

            <button onClick={handleLogout} className="btn-secondary h-10 text-xs justify-center">
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
