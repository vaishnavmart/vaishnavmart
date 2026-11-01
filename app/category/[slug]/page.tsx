import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CategoryRepository, ProductRepository } from '@/lib/data/repositories'
import { ProductCard } from '@/components/store/ProductCard'
import { ChevronRight, ShieldCheck } from 'lucide-react'

interface Props {
  params: { slug: string }
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vaishnavamart.com'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await CategoryRepository.getCategoryBySlug(params.slug)
  if (!category) return { title: 'Category Not Found' }

  return {
    title: category.seoTitle || `${category.name} | Vaishnava Mart`,
    description:
      category.seoDescription ||
      `Shop pure Satvik, onion-free, garlic-free ${category.name} at Vaishnava Mart. Dedicated preparation for devout homes.`,
    alternates: {
      canonical: `/category/${category.slug}`,
    },
    openGraph: {
      title: `${category.name} | Vaishnava Mart`,
      description: category.description,
      url: `${siteUrl}/category/${category.slug}`,
    },
  }
}

export default async function CategoryPage({ params }: Props) {
  const category = await CategoryRepository.getCategoryBySlug(params.slug)
  if (!category) notFound()

  const allProducts = await ProductRepository.getAllProducts({
    status: 'active',
    categoryId: category.id,
  })

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
        name: category.name,
        item: `${siteUrl}/category/${category.slug}`,
      },
    ],
  }

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description,
    url: `${siteUrl}/category/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: allProducts.map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${siteUrl}/${p.slug}`,
        name: p.name,
      })),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <div className="bg-ivory min-h-screen py-8 sm:py-12 border-b border-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-taupe mb-6">
            <Link href="/" className="hover:text-burgundy transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/shop" className="hover:text-burgundy transition-colors">
              Shop
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-burgundy font-medium">{category.name}</span>
          </nav>

          {/* Category Header */}
          <div className="pb-8 mb-8 border-b border-sand">
            <div className="max-w-3xl">
              <span className="text-xs uppercase tracking-widest text-copper font-semibold">
                Pantry Collection
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl text-cocoa mt-2 font-normal">
                {category.name}
              </h1>
              <p className="text-sm sm:text-base text-taupe mt-3 leading-relaxed font-sans">
                {category.description}
              </p>
            </div>

            {/* Quick Assurance Tags */}
            <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-taupe font-medium">
              <div className="flex items-center gap-1.5 bg-porcelain px-3 py-1.5 rounded-full border border-sand">
                <ShieldCheck className="w-4 h-4 text-botanical" />
                <span>Zero Allium Cross-Contamination</span>
              </div>
              <div className="flex items-center gap-1.5 bg-porcelain px-3 py-1.5 rounded-full border border-sand">
                <span className="w-2 h-2 rounded-full bg-gold" />
                <span>Bhōg Kē Liyē Standards</span>
              </div>
              <div className="flex items-center gap-1.5 bg-porcelain px-3 py-1.5 rounded-full border border-sand">
                <span className="font-mono text-copper font-bold">{allProducts.length}</span>
                <span>Handcrafted Items</span>
              </div>
            </div>
          </div>

          {/* Product Grid - 3 per row on desktop */}
          {allProducts.length === 0 ? (
            <div className="bg-porcelain border border-sand p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto my-12">
              <p className="font-serif text-xl text-cocoa">Fresh Batch Simmering</p>
              <p className="text-xs text-taupe">
                Products in this category are being prepared under temple kitchen supervision. Please check back shortly.
              </p>
              <Link href="/shop" className="btn-primary text-xs inline-flex justify-center">
                Explore Full Pantry
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
