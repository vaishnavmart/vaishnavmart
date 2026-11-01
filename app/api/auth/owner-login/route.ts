import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const inputEmail = (email || '').trim().toLowerCase()
    const inputPassword = (password || '').trim()

    const validEmails = [
      (process.env.DEV_ADMIN_EMAIL || '').trim().toLowerCase(),
      'raskanfood@gmail.com',
      'owner@vaishnavamart.local',
      'yashveerlabs@gmail.com',
      'yashveersinghrajpoot@gmail.com',
    ].filter(Boolean)

    const validPasswords = [
      (process.env.DEV_ADMIN_PASSWORD || '').trim(),
      'RasKan@Pure786#Vaishnav',
      'vaishnav123',
    ].filter(Boolean)

    const isEmailValid = validEmails.includes(inputEmail)
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

    console.warn(`[Admin Auth] Failed login attempt for email: "${inputEmail}"`)

    return NextResponse.json(
      { success: false, message: 'Invalid credentials. Please verify your email and password.' },
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
