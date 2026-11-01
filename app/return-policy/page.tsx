import { Metadata } from 'next'
import Link from 'next/link'
import { ShieldAlert, RefreshCw, PackageCheck, HeartHandshake, PhoneCall, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'No Return Policy | Vaishnava Mart Purity Guarantee',
  description:
    'Vaishnava Mart follows a strict No Return Policy on all edible pantry items to preserve sacred Satvik cleanroom integrity. Read our guidelines for damaged or transit issues.',
}

export default function ReturnPolicyPage() {
  return (
    <div className="bg-ivory min-h-screen py-12 sm:py-20 border-b border-sand">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-10 font-sans text-taupe leading-relaxed">
        {/* Header */}
        <div className="space-y-3 border-b border-sand pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-burgundy/10 text-burgundy text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Strict Food Hygiene & Satvik Sanctity</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-cocoa font-normal">
            No Return Policy
          </h1>
          <p className="text-xs text-copper font-medium">
            Effective Date: October 2026 • Applies to all Vaishnava Mart orders across India
          </p>
        </div>

        {/* Core Statement Banner */}
        <div className="p-6 bg-porcelain border-2 border-sand rounded-2xl shadow-sm space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-burgundy font-medium flex items-center gap-2.5">
            <span>Notice of No Return Policy</span>
          </h2>
          <p className="text-sm sm:text-base text-cocoa leading-relaxed">
            In accordance with stringent devotional purity vows and food safety standards, <strong>Vaishnava Mart products are strictly not eligible for returns once dispatched or delivered</strong>.
          </p>
          <p className="text-xs sm:text-sm text-taupe">
            Because our stone-ground spices, fasting flours, bilona ghee, and satvik premixes are prepared in dedicated allium-free cleanrooms, we do not accept items back into our facility. This policy guarantees that no item delivered to a devotee&apos;s kitchen has ever passed through another party&apos;s premises.
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8">
          <section className="space-y-3">
            <h3 className="font-serif text-xl text-cocoa flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-burgundy text-ivory text-xs flex items-center justify-center font-bold font-mono">1</span>
              <span>Why We Maintain a Zero-Return Environment</span>
            </h3>
            <p className="text-sm">
              Devotional Satvik food demands uncompromising ritual cleanliness (*shaucham*). Accepting returned food packets risks cross-contamination with non-satvik ingredients, atmospheric moisture, or unvetted handling. Our no-return commitment is your guarantee of pristine freshness.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-serif text-xl text-cocoa flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-burgundy text-ivory text-xs flex items-center justify-center font-bold font-mono">2</span>
              <span>Damaged, Defective, Incorrect, or Tampered Deliveries</span>
            </h3>
            <p className="text-sm">
              While general change-of-mind returns are not permitted, we fully protect your purchase against transit faults:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-cocoa">
              <li>
                <strong>Transit Damage:</strong> If the jar, bottle, or tamper-evident seal is broken or compromised during courier transit.
              </li>
              <li>
                <strong>Incorrect Item:</strong> If you receive a product different from your placed order.
              </li>
              <li>
                <strong>Quality Defect or Packaging Leak:</strong> Any manufacturing anomaly verified by our customer care team.
              </li>
            </ul>
            <p className="text-sm pt-1">
              In any of the above situations, we will promptly provide a <strong>free replacement</strong> or a <strong>full refund</strong> to your original payment method. Customers are never left with damaged or incorrect goods.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="font-serif text-xl text-cocoa flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-burgundy text-ivory text-xs flex items-center justify-center font-bold font-mono">3</span>
              <span>How to Claim a Replacement or Remedy</span>
            </h3>
            <p className="text-sm">
              Please contact us within <strong>48 hours</strong> of parcel delivery with your order ID and clear photos or unboxing video of the affected package:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-porcelain rounded-xl border border-sand">
                <div className="flex items-center gap-2 text-burgundy font-semibold text-sm mb-1">
                  <PhoneCall className="w-4 h-4" />
                  <span>WhatsApp Care</span>
                </div>
                <p className="text-xs text-taupe">+91 85952 68400 (Mon–Sat, 9 AM – 7 PM)</p>
              </div>
              <div className="p-4 bg-porcelain rounded-xl border border-sand">
                <div className="flex items-center gap-2 text-burgundy font-semibold text-sm mb-1">
                  <Mail className="w-4 h-4" />
                  <span>Email Care</span>
                </div>
                <p className="text-xs text-taupe">nimaitrade55@gmail.com</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-serif text-xl text-cocoa flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-burgundy text-ivory text-xs flex items-center justify-center font-bold font-mono">4</span>
              <span>Refund Timelines</span>
            </h3>
            <p className="text-sm">
              Once an issue is verified by our team, refunds are initiated immediately and credited to the original payment method (bank account, UPI, or card) within <strong>5 to 7 business days</strong>.
            </p>
          </section>
        </div>

        {/* Footer note */}
        <div className="pt-6 border-t border-sand text-xs text-taupe flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Subject to client confirmation of final legal policy wording before commercial distribution.
          </p>
          <Link href="/shop" className="btn-secondary text-xs h-9 px-4">
            Return to Shop
          </Link>
        </div>
      </div>
    </div>
  )
}
