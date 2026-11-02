'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react'
import { auth, googleProvider } from '@/lib/firebase/config'
import { signInWithPopup } from 'firebase/auth'

export default function OwnerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
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

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      if (!user.email) {
        throw new Error('No email found associated with this Google account.')
      }

      const idToken = await user.getIdToken()

      const res = await fetch('/api/auth/owner-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          authType: 'google',
          idToken,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        router.push('/admin')
      } else {
        setError(data.message || `Account "${user.email}" is not authorized as a Superadmin.`)
      }
    } catch (err: any) {
      console.warn('Superadmin Google auth notice:', err)
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Failed to authenticate with Google.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-porcelain border border-sand rounded-3xl shadow-xl p-8 sm:p-10 space-y-6">
        {/* Brand Header */}
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
          <h1 className="font-serif text-2xl sm:text-3xl text-cocoa font-bold pt-2">
            Superadmin Portal
          </h1>
          <p className="text-xs text-taupe font-sans">
            Store Command & Operations Center for Ras Kan & Vaishnava Mart
          </p>
        </div>

        {/* Security Notice */}
        <div className="p-3.5 bg-cream/70 border border-sand rounded-xl text-xs space-y-1 text-taupe font-sans">
          <div className="flex items-center gap-1.5 font-bold text-burgundy uppercase tracking-wider text-[11px]">
            <ShieldCheck className="w-4 h-4 text-botanical" />
            <span>Authorized Management Access</span>
          </div>
          <p className="text-[11px] text-cocoa leading-relaxed">
            Access is restricted to authorized project administrators. Sign in with your registered Google account or owner credentials.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-clay/15 border border-clay/30 rounded-xl text-clay text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Method 1: One-Click Google Authentication */}
        <div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-sand rounded-xl text-xs font-semibold text-cocoa hover:bg-cream/40 transition-colors shadow-xs disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {googleLoading ? 'Authenticating with Google...' : 'Sign in with Google (Superadmin)'}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-sand w-full" />
          <span className="bg-porcelain px-3 text-[10px] font-bold uppercase tracking-wider text-taupe whitespace-nowrap">
            or sign in with password
          </span>
          <div className="border-t border-sand w-full" />
        </div>

        {/* Method 2: Email & Password */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-taupe block mb-1">
              Admin Email
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              placeholder="raskanwork@gmail.com"
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
            disabled={loading || googleLoading}
            className="w-full btn-primary h-12 text-xs uppercase tracking-widest font-bold justify-center rounded-xl mt-2 flex items-center gap-2 shadow-sm"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Enter Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="text-xs text-taupe hover:text-burgundy transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Vaishnava Mart Store</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
