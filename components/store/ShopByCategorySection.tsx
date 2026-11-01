'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Category } from '@/types'
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

interface ShopByCategorySectionProps {
  categories: Category[]
  heading?: string
  subheading?: string
}

export const ShopByCategorySection: React.FC<ShopByCategorySectionProps> = ({
  categories,
  heading = 'Shop by Category',
  subheading = 'EXPLORE OUR SATVIK PANTRY',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  // Visible categories
  const visibleCategories = categories.filter((c) => c.visible !== false)

  const checkScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)

    // Calculate approximate active page for dot indicators
    if (clientWidth > 0) {
      const page = Math.round(scrollLeft / (clientWidth * 0.75))
      setActiveIndex(Math.min(page, Math.max(0, visibleCategories.length - 1)))
    }
  }, [visibleCategories.length])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.75
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  const scrollToCategory = (index: number) => {
    if (!scrollContainerRef.current) return
    const cards = scrollContainerRef.current.children
    if (cards[index]) {
      ;(cards[index] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      })
    }
  }

  if (visibleCategories.length === 0) return null

  return (
    <section
      aria-label="Shop by Category"
      className="py-12 sm:py-16 bg-[#F4EFE6] border-b border-sand/70 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="text-[11px] sm:text-xs uppercase tracking-widest text-copper font-semibold">
                {subheading}
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl text-cocoa font-bold tracking-tight">
              {heading}
            </h2>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="text-xs sm:text-sm font-semibold text-burgundy hover:text-burgundy-dark transition-colors inline-flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            {/* Desktop scroll arrows */}
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className={`w-9 h-9 rounded-full border border-sand bg-porcelain flex items-center justify-center transition-all ${
                  canScrollLeft
                    ? 'text-cocoa hover:text-burgundy hover:border-gold hover:shadow-sm'
                    : 'text-taupe/40 cursor-not-allowed border-sand/40'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className={`w-9 h-9 rounded-full border border-sand bg-porcelain flex items-center justify-center transition-all ${
                  canScrollRight
                    ? 'text-cocoa hover:text-burgundy hover:border-gold hover:shadow-sm'
                    : 'text-taupe/40 cursor-not-allowed border-sand/40'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Carousel / Horizontal Scroll */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {visibleCategories.map((cat, idx) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex-shrink-0 w-[68vw] sm:w-[280px] md:w-[270px] lg:w-[228px] snap-start bg-porcelain border border-sand/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-gold/60 transition-all duration-300 flex flex-col"
            >
              {/* Category Image Box */}
              <div className="relative aspect-square w-full bg-[#EFE9DF] overflow-hidden p-3 flex items-center justify-center">
                {/* Circular Framing Container (inspired by the reference aesthetic) */}
                <div className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden border border-sand/60 bg-cream/30 shadow-inner">
                  <Image
                    src={cat.image || '/images/generated/story-origin.jpg'}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Subtle warm devotional vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-cocoa/20 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />
                </div>

                {/* Micro Category Index Pill */}
                <span className="absolute top-4 left-4 bg-porcelain/90 backdrop-blur-xs text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md text-copper border border-sand/60 shadow-xs">
                  0{idx + 1}
                </span>
              </div>

              {/* Category Label Box */}
              <div className="p-4 text-center border-t border-sand/60 flex-1 flex flex-col justify-between bg-porcelain">
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-cocoa group-hover:text-burgundy transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-taupe mt-1 line-clamp-1 font-sans">
                    {cat.description || 'Dedicated 100% Satvik & Allium Free'}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-sand/40 flex items-center justify-center gap-1 text-[11px] font-semibold text-burgundy group-hover:text-copper transition-colors">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile Pagination Dots Indicator (Matching the reference's dot tracker) */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 mt-5">
          {visibleCategories.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToCategory(idx)}
              aria-label={`Go to category ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === idx
                  ? 'w-6 bg-burgundy'
                  : 'w-2 bg-sand hover:bg-taupe'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
