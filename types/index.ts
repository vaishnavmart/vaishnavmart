export type ProductStatus = 'draft' | 'active' | 'hidden'

export interface ProductFeature {
  id: string
  name: string
  explanation?: string
  visualType: 'icon' | 'emoji' | 'image'
  iconValue?: string // e.g. icon name or emoji or image url
  bgColor?: string
  bgImage?: string
  sortOrder: number
}

export interface ProductSEO {
  metaTitle: string
  metaDescription: string
  slug: string
  ogImage?: string
  canonicalUrl?: string
  noIndex?: boolean
}

export interface ProductPackOption {
  id: string
  name: string
  weight: number
  unit: string
  mrp: number
  price: number
  discountPercent?: number
  productId?: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string // 200 - 500 words
  images: string[] // Exactly 4 slots
  mainImage: string
  mrp: number
  price: number
  discountPercent?: number
  stock: number
  lowStockThreshold: number
  sku?: string
  weight: number
  unit: string // 'g', 'kg', 'ml', 'pcs'
  categoryIds: string[]
  features: ProductFeature[]
  similarProductIds: string[]
  status: ProductStatus
  seo: ProductSEO
  packOptions?: ProductPackOption[]
  ingredients?: string
  usage?: string
  storage?: string
  nutrition?: string
  purityInfo?: string
  shippingInfo?: string
  batchNumber?: string
  mfgDate?: string
  expiryDate?: string
  isDemo?: boolean
  isCombo?: boolean
  comboItemNames?: string[]
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  image?: string
  seoTitle?: string
  seoDescription?: string
  visible: boolean
  sortOrder: number
  productIds?: string[]
}

export interface Address {
  id: string
  label: 'Home' | 'Work' | 'Other'
  fullName: string
  phone: string
  line1: string
  area: string
  landmark?: string
  city: string
  state: string
  pin: string
  isDefault?: boolean
}

export interface UserProfile {
  uid: string
  name: string
  email: string
  phone: string
  secondaryPhone?: string
  gender?: 'Male' | 'Female' | 'Prefer not to say'
  age?: number
  photoURL?: string
  addresses: Address[]
  defaultAddressId?: string
  profileComplete: boolean
  marketingConsent: boolean
  status?: 'active' | 'suspended'
  adminNotes?: string
  createdAt: string
  updatedAt: string
  lastActiveAt: string
}

export interface CartItem {
  productId: string
  quantity: number
  selectedVariant?: string
}

export interface Cart {
  userId: string
  items: CartItem[]
  updatedAt: string
  lastActivityAt: string
}

export type PaymentState = 'pending' | 'paid' | 'failed' | 'refunded'
export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export interface OrderItemSnapshot {
  productId: string
  productNameSnapshot: string
  imageSnapshot: string
  priceSnapshot: number
  mrpSnapshot?: number
  quantity: number
  variantSnapshot?: string
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  customerSnapshot: {
    name: string
    email: string
    phone: string
    secondaryPhone?: string
    photoURL?: string
  }
  deliveryAddressSnapshot: Address
  items: OrderItemSnapshot[]
  subtotal: number
  discount: number
  couponCode?: string
  shipping: number
  finalTotal: number
  paymentState: PaymentState
  paymentMethod: 'mock' | 'razorpay' | 'cod'
  paymentId?: string
  refundId?: string
  refundAmount?: number
  orderStatus: OrderStatus
  notes?: string
  trackingNumber?: string
  courierPartner?: string
  trackingUrl?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

export type LayoutType = 'layout_1' | 'layout_2' | 'layout_3'

export interface PageSection {
  id: string
  type:
    | 'hero'
    | 'trust_ribbon'
    | 'shop_by_category'
    | 'top_products'
    | 'brand_story'
    | 'most_ordered'
    | 'founder_story'
    | 'featured_products'
    | 'purity_story'
    | 'collaboration_cta'
    | 'combo_showcase'
    | 'custom'
  order: number
  visible: boolean
  layout: LayoutType
  heading: string
  subheading?: string
  body?: string
  image?: string
  background: {
    type: 'color' | 'image'
    value: string
  }
  button?: {
    visible: boolean
    text: string
    url: string
  }
  styleSettings: {
    textAlign: 'left' | 'center'
    headingAlign: 'left' | 'center'
    imagePosition: 'left' | 'right'
  }
  selectedProductIds?: string[]
}

export interface PageContent {
  id: string
  slug: string
  title: string
  draftSections: PageSection[]
  publishedSections: PageSection[]
  updatedAt: string
  publishedAt: string
}

export interface PageVersion {
  id: string
  pageId: string
  versionNumber: number
  sections: PageSection[]
  createdAt: string
  publishedBy: string
}

export interface SiteSettings {
  businessName: string
  logoUrl: string
  whatsapp: string
  email: string
  phone: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  socialLinks: {
    instagram?: string
    facebook?: string
    youtube?: string
  }
  announcementBar: {
    enabled: boolean
    text: string
    link?: string
  }
  shippingText: string
  fssaiNumber?: string
  festivalMode?: {
    enabled: boolean
    name: string
    bannerText: string
  }
  defaultSeoTitle: string
  defaultSeoDescription: string
}

export interface AuditLog {
  id: string
  action: string
  details: string
  actor: string
  timestamp: string
}

export interface AdminNotification {
  id: string
  type: 'order' | 'inventory' | 'payment' | 'cms' | 'review'
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

export interface LocationArea {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  coordinates: { lat: number; lng: number }
  serviceAreas: string[]
  deliveryTiming: string
  minOrder: number
  faqs: { question: string; answer: string }[]
}

export type DiscountType = 'percentage' | 'flat'

export interface Coupon {
  id: string
  code: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount?: number
  startDate?: string
  expiryDate?: string
  usageLimit?: number
  timesUsed: number
  active: boolean
  description?: string
  createdAt: string
  updatedAt: string
}
