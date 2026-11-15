import Link from 'next/link'
import { PlusCircle, Tag, Layout, ArrowRight, FileSpreadsheet, Percent } from 'lucide-react'

export default function AdminAddIndexPage() {
  const addOptions = [
    {
      title: 'Add Product',
      desc: 'Launch a new stone-ground masala, dry fruit tin, or Ekadashi specialty with our 9-step guided creator.',
      icon: PlusCircle,
      href: '/admin/add/product',
      badge: '9-Step Wizard',
    },
    {
      title: 'Bulk CSV Importer',
      desc: 'Import 10 to 100+ stone-ground spices, fasting flours, and pantry items from a spreadsheet in seconds.',
      icon: FileSpreadsheet,
      href: '/admin/add/bulk-csv',
      badge: 'Batch Spreadsheet',
    },
    {
      title: 'Add Category',
      desc: 'Create a new pantry collection for fasting staples, sweets, or festive seasonal lines.',
      icon: Tag,
      href: '/admin/add/category',
      badge: 'Collection',
    },
    {
      title: 'Promo Coupon',
      desc: 'Launch a festival discount code (like EKADASHI10 or VRAT50) with cart minimums and expiry rules.',
      icon: Percent,
      href: '/admin/coupons',
      badge: 'Discounts',
    },
    {
      title: 'Add Section',
      desc: 'Introduce a new story block, hero showcase, or testimonial strip to any page.',
      icon: Layout,
      href: '/admin/add/section',
      badge: 'Page Builder',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl text-cocoa">Add to Vaishnava Mart</h1>
        <p className="text-xs sm:text-sm text-taupe mt-1">
          Choose what you would like to create. Keep it simple and guided.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {addOptions.map((opt) => {
          const IconComp = opt.icon
          return (
            <Link
              key={opt.title}
              href={opt.href}
              className="group p-8 bg-ivory rounded-3xl border border-sand hover:border-burgundy shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6 hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-4 rounded-2xl bg-porcelain border border-sand text-burgundy group-hover:scale-105 transition-transform">
                    <IconComp className="w-8 h-8 text-burgundy" />
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-cream text-cocoa">
                    {opt.badge}
                  </span>
                </div>

                <div>
                  <h2 className="font-serif text-2xl text-cocoa font-medium group-hover:text-burgundy transition-colors">
                    {opt.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-taupe leading-relaxed font-sans mt-2">
                    {opt.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-sand/70 flex items-center justify-between text-xs font-bold text-burgundy">
                <span>Start Creating</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
