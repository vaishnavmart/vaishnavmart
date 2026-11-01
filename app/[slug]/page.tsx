import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductRepository } from '@/lib/data/repositories'
import { ProductDetailClient } from '@/components/store/ProductDetailClient'

const RESERVED_SLUGS = new Set([
  'shop',
  'category',
  'about',
  'our-standard',
  'services',
  'contact',
  'locations',
  'recipes',
  'cart',
  'checkout',
  'account',
  'order-success',
  'owner-login',
  'admin',
  'privacy-policy',
  'terms',
  'shipping-policy',
  'return-policy',
  'refund-policy',
  'api',
  'blog',
  'social',
  'vaishnav-calendar',
  'yashveer-labs',
  'rajpoot-industries',
  'yashveer-singh-rajpoot',
  'sitemap.xml',
  'robots.txt',
])

interface Props {
  params: { slug: string }
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vaishnavamart.com'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (RESERVED_SLUGS.has(params.slug)) {
    return { title: 'Vaishnava Mart' }
  }

  const product = await ProductRepository.getProductBySlug(params.slug)
  if (!product) return { title: 'Product Not Found | Vaishnava Mart' }

  const fullImageUrl = product.mainImage.startsWith('http')
    ? product.mainImage
    : `${siteUrl}${product.mainImage}`

  return {
    title: product.seo?.metaTitle || `${product.name} (No Onion No Garlic) | Vaishnava Mart`,
    description: product.seo?.metaDescription || product.description.slice(0, 160),
    alternates: {
      canonical: `/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      url: `${siteUrl}/${product.slug}`,
      images: [
        {
          url: fullImageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description.slice(0, 160),
      images: [fullImageUrl],
    },
  }
}

export default async function DynamicProductPage({ params }: Props) {
  // Respect system reserved routes
  if (RESERVED_SLUGS.has(params.slug)) {
    notFound()
  }

  const product = await ProductRepository.getProductBySlug(params.slug)
  if (!product) {
    notFound()
  }

  // Fetch similar products
  const similarProducts = await ProductRepository.getSimilarProducts(
    product.similarProductIds || []
  )

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map((img) => (img.startsWith('http') ? img : `${siteUrl}${img}`)),
    description: product.description,
    sku: product.sku || `VM-${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'Ras Kan',
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/${product.slug}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Vaishnava Mart',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '136',
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: `${siteUrl}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${siteUrl}/${product.slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetailClient product={product} similarProducts={similarProducts} />
    </>
  )
}
