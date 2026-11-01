import type { Metadata } from 'next'
import Script from 'next/script'
import { Cormorant_Garamond, Manrope, Rozha_One } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { CartProvider } from '@/lib/data/CartContext'
import { WishlistProvider } from '@/lib/data/WishlistContext'
import { StoreLayoutWrapper } from '@/components/store/StoreLayoutWrapper'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const rozhaOne = Rozha_One({
  subsets: ['devanagari', 'latin'],
  variable: '--font-devanagari',
  weight: ['400'],
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vaishnavamart.com'

export const metadata: Metadata = {
  title: {
    default: 'Vaishnava Mart | Pure Satvik, Jain & Vaishnav Food Products',
    template: '%s | Vaishnava Mart',
  },
  description:
    'Dedicated culinary purity for Jain, Vaishnav, and devout Satvik homes. 100% free from onion and garlic. Stone-ground whole spices, hand-roasted khakhras, fasting flours, and royal dry fruits.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  keywords: [
    'Vaishnava Mart',
    'Ras Kan',
    'Satvik Food',
    'No Onion No Garlic',
    'Jain Food Online',
    'Pure Vaishnav Grocery',
    'Bhog Ke Liye Masale',
    'Khakhra Online',
    'Fasting Food',
    'Ekadashi Staples',
    'Stone Ground Spices',
    'Ayurvedic Spices',
  ],
  authors: [{ name: 'Yashveer Singh Rajpoot', url: 'https://vaishnavamart.com/yashveer-singh-rajpoot' }],
  creator: 'Yashveer Labs',
  publisher: 'Vaishnava Mart',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
      { url: '/images/logo/logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/images/logo/logo.png',
  },
  openGraph: {
    title: 'Vaishnava Mart | Divine Satvik Purity',
    description:
      'Devotional Satvik and Jain food essentials prepared under dedicated zero-contamination standards. 100% allium-free.',
    url: siteUrl,
    siteName: 'Vaishnava Mart',
    images: [
      {
        url: '/images/logo/logo.png',
        width: 1200,
        height: 630,
        alt: 'Ras Kan - Vaishnava Mart Divine Purity',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vaishnava Mart | Divine Satvik Purity',
    description:
      'Pure Satvik and Jain food essentials prepared under dedicated zero-contamination standards. No onion, no garlic.',
    images: ['/images/logo/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Vaishnava Mart',
    alternateName: ['Ras Kan', 'VaishnavaMart'],
    url: siteUrl,
    logo: `${siteUrl}/images/logo/logo.png`,
    description:
      'Dedicated culinary purity for Jain, Vaishnav, and devout Satvik homes. 100% free from onion, garlic, and cross-contamination.',
    founder: {
      '@type': 'Person',
      name: 'Yashveer Singh Rajpoot',
      url: `${siteUrl}/yashveer-singh-rajpoot`,
    },
    parentOrganization: {
      '@type': 'Organization',
      name: 'Rajpoot Industries',
      url: `${siteUrl}/rajpoot-industries`,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+918595268400',
      contactType: 'customer support',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
    sameAs: [
      'https://instagram.com/vaishnavamart',
      'https://facebook.com/vaishnavamart',
    ],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Vaishnava Mart',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable} ${rozhaOne.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="bg-ivory text-cocoa antialiased selection:bg-gold/20 selection:text-burgundy">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <StoreLayoutWrapper>{children}</StoreLayoutWrapper>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
