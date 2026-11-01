'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react'

export default function OwnerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Establish Server Admin Session
      const res = await fetch('/api/auth/owner-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        router.push('/admin')
      } else {
        setError(data.message || 'Invalid credentials. Please verify your email and password.')
      }
    } catch {
      setError('Unable to authenticate. Please check server connectivity.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-porcelain border border-sand rounded-3xl shadow-xl p-8 sm:p-10 space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="relative w-44 h-24 mx-auto rounded-2xl overflow-hidden border-2 border-gold/40 shadow-sm bg-black">
            <Image
              src="/images/logo/logo.png"
              alt="Ras Kan Logo"
              fill
              priority
              sizes="176px"
              className="object-contain p-1"
            />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-cocoa font-bold pt-2">Owner Portal</h1>
          <p className="text-xs text-taupe font-sans">
            Administrative Control Center for Ras Kan & Vaishnava Mart
          </p>
        </div>

        {/* Security Notice */}
        <div className="p-3.5 bg-cream/70 border border-sand rounded-xl text-xs space-y-1 text-taupe font-sans">
          <div className="flex items-center gap-1.5 font-bold text-burgundy uppercase tracking-wider text-[11px]">
            <ShieldCheck className="w-4 h-4 text-botanical" />
            <span>Authorized Management Access</span>
          </div>
          <p className="text-[11px] text-cocoa leading-relaxed">
            Please enter your administrator credentials to manage catalog, orders, and store operations.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-clay/15 border border-clay/30 rounded-xl text-clay text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
              Admin Email
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              placeholder="admin@vaishnavamart.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-ivory border border-sand rounded-xl text-xs text-cocoa focus:border-burgundy outline-none font-sans"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-10 bg-ivory border border-sand rounded-xl text-xs text-cocoa focus:border-burgundy outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-taupe hover:text-burgundy transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary h-12 text-xs uppercase tracking-widest font-bold justify-center rounded-xl mt-2 flex items-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Enter Owner Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
