import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const DEFAULT_ADMIN_EMAILS = [
  'raskanwork@gmail.com',
  'raskanfood@gmail.com',
  'yashveerlabs@gmail.com',
  'yashveersinghrajpoot@gmail.com',
  'jasneetkakkar2016@gmail.com',
  'ravigoodyear@gmail.com',
  'owner@vaishnavamart.local',
]

const DEFAULT_ADMIN_PASSWORDS = [
  'RasKan@2026#Vaishnav',
  'RasKan@Pure786#Vaishnav',
  'vaishnav123',
]

export async function POST(request: Request) {
  try {
    const { email, password, authType, idToken } = await request.json()

    const inputEmail = (email || '').trim().toLowerCase()
    const inputPassword = (password || '').trim()

    // Aggregate valid administrator emails from environment and trusted roster
    const envEmails = [
      process.env.DEV_ADMIN_EMAIL,
      process.env.SUPERADMIN_EMAIL,
      ...(process.env.SUPERADMIN_EMAILS ? process.env.SUPERADMIN_EMAILS.split(',') : []),
      ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : []),
    ]
      .filter(Boolean)
      .map((e) => (e as string).trim().toLowerCase())

    const validEmails = Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...envEmails]))

    const envPasswords = [
      process.env.DEV_ADMIN_PASSWORD,
      process.env.SUPERADMIN_PASSWORD,
    ]
      .filter(Boolean)
      .map((p) => (p as string).trim())

    const validPasswords = Array.from(new Set([...DEFAULT_ADMIN_PASSWORDS, ...envPasswords]))

    const isEmailValid = validEmails.includes(inputEmail)

    // Mode 1: Firebase Google Authentication
    if (authType === 'google') {
      if (isEmailValid) {
        cookies().set('vm_admin_session', 'authenticated_owner', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        })

        return NextResponse.json({
          success: true,
          message: 'Superadmin authenticated via Google successfully',
          user: { email: inputEmail, role: 'super_admin' },
        })
      }

      console.warn(`[Admin Auth] Unauthorized Google attempt for email: "${inputEmail}"`)
      return NextResponse.json(
        {
          success: false,
          message: `The Google account "${inputEmail}" is not recognized as an authorized Superadmin.`,
        },
        { status: 403 }
      )
    }

    // Mode 2: Password Authentication
    const isPasswordValid = validPasswords.some((p) => p === inputPassword)

    if (isEmailValid && isPasswordValid) {
      cookies().set('vm_admin_session', 'authenticated_owner', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })

      return NextResponse.json({
        success: true,
        message: 'Owner authenticated successfully',
        user: { email: inputEmail, role: 'super_admin' },
      })
    }

    console.warn(`[Admin Auth] Failed credential login attempt for email: "${inputEmail}"`)

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid credentials. Please verify your admin email and password.',
      },
      { status: 401 }
    )
  } catch (error) {
    console.error('[Admin Auth] Authentication error:', error)
    return NextResponse.json({ success: false, message: 'Authentication error' }, { status: 500 })
  }
}

export async function GET() {
  const adminCookie = cookies().get('vm_admin_session')
  const isAuthenticated = adminCookie?.value === 'authenticated_owner'
  return NextResponse.json({ isAuthenticated })
}

export async function DELETE() {
  cookies().delete('vm_admin_session')
  return NextResponse.json({ success: true, message: 'Logged out' })
}
