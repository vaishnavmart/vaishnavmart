import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
} from 'firebase/firestore'
import { db, auth } from './config'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Product, Category, PageContent, Order, UserProfile, Coupon, SiteSettings } from '@/types'
import {
  initialProducts,
  initialCategories,
  initialHomeSections,
  initialCoupons,
  initialSiteSettings,
} from '@/lib/data/mockData'

const ADMIN_EMAILS = [
  'raskanfood@gmail.com',
  'raskanwork@gmail.com',
  'yashveerlabs@gmail.com',
  'yashveersinghrajpoot@gmail.com',
  'jasneetkakkar2016@gmail.com',
  'ravigoodyear@gmail.com',
  'owner@vaishnavamart.local',
]

let adminAuthPromise: Promise<any> | null = null

export async function ensureAdminAuth() {
  if (auth.currentUser && auth.currentUser.email && ADMIN_EMAILS.includes(auth.currentUser.email.toLowerCase())) {
    return auth.currentUser
  }
  if (adminAuthPromise) return adminAuthPromise

  adminAuthPromise = (async () => {
    try {
      const email = process.env.DEV_ADMIN_EMAIL || 'raskanfood@gmail.com'
      const password = process.env.DEV_ADMIN_PASSWORD || 'RasKan@2026#Vaishnav'
      const cred = await signInWithEmailAndPassword(auth, email, password)
      return cred.user
    } catch (err) {
      console.warn('[FirestoreService] ensureAdminAuth notice:', err)
      return null
    } finally {
      adminAuthPromise = null
    }
  })()

  return adminAuthPromise
}

/* =====================================================================
   PRODUCTS (Read/Write text to Firestore, image URLs stay on GitHub)
===================================================================== */
export const FirestoreProductService = {
  async getAll(): Promise<Product[]> {
    try {
      const snap = await getDocs(collection(db, 'products'))
      if (snap.empty) {
        // First run: Seed products to Firestore if empty
        return []
      }
      return snap.docs.map((d) => d.data() as Product)
    } catch (err) {
      console.warn('Firestore products fetch fallback:', err)
      return []
    }
  },

  async getById(id: string): Promise<Product | null> {
    try {
      const ref = doc(db, 'products', id)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        return snap.data() as Product
      }
      return null
    } catch (err) {
      console.warn('Firestore product getById fallback:', err)
      return null
    }
  },

  async getBySlug(slug: string): Promise<Product | null> {
    try {
      const q = query(collection(db, 'products'), where('slug', '==', slug), limit(1))
      const snap = await getDocs(q)
      if (!snap.empty) {
        return snap.docs[0].data() as Product
      }
      return null
    } catch (err) {
      console.warn('Firestore product getBySlug fallback:', err)
      return null
    }
  },

  async save(product: Product): Promise<Product> {
    try {
      await ensureAdminAuth()
      const ref = doc(db, 'products', product.id)
      await setDoc(ref, product, { merge: true })
      return product
    } catch (err) {
      console.error('[FirestoreService] product save error:', err)
      return product
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await ensureAdminAuth()
      const ref = doc(db, 'products', id)
      await deleteDoc(ref)
    } catch (err) {
      console.error('[FirestoreService] product remove error:', err)
    }
  },

  // Batch seed all initial products to Firestore
  async seedAll(products: Product[]): Promise<number> {
    await ensureAdminAuth()
    let count = 0
    for (const p of products) {
      try {
        await setDoc(doc(db, 'products', p.id), p, { merge: true })
        count++
      } catch (err) {
        console.warn(`[FirestoreService] Failed seeding product ${p.id}:`, err)
      }
    }
    return count
  },
}

/* =====================================================================
   CATEGORIES
===================================================================== */
export const FirestoreCategoryService = {
  async getAll(): Promise<Category[]> {
    try {
      const snap = await getDocs(collection(db, 'categories'))
      if (snap.empty) return []
      return snap.docs.map((d) => d.data() as Category)
    } catch (err) {
      console.warn('Firestore categories fetch fallback:', err)
      return []
    }
  },

  async save(category: Category): Promise<Category> {
    try {
      await ensureAdminAuth()
      const ref = doc(db, 'categories', category.id)
      await setDoc(ref, category, { merge: true })
      return category
    } catch (err) {
      console.error('[FirestoreService] category save error:', err)
      return category
    }
  },

  async seedAll(categories: Category[]): Promise<number> {
    await ensureAdminAuth()
    let count = 0
    for (const c of categories) {
      try {
        await setDoc(doc(db, 'categories', c.id), c, { merge: true })
        count++
      } catch (err) {
        console.warn(`[FirestoreService] Failed seeding category ${c.id}:`, err)
      }
    }
    return count
  },
}

/* =====================================================================
   WEBSITE SECTIONS / PAGES (Superadmin Homepage Customizer)
===================================================================== */
export const FirestorePageService = {
  async getPage(slug: string): Promise<PageContent | null> {
    try {
      const ref = doc(db, 'pages', slug)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        return snap.data() as PageContent
      }
      return null
    } catch (err) {
      console.warn('Firestore page getPage fallback:', err)
      return null
    }
  },

  async savePage(page: PageContent): Promise<PageContent> {
    try {
      await ensureAdminAuth()
      const ref = doc(db, 'pages', page.slug)
      await setDoc(ref, page, { merge: true })
      return page
    } catch (err) {
      console.error('[FirestoreService] page save error:', err)
      return page
    }
  },
}

/* =====================================================================
   CUSTOMER ORDERS
===================================================================== */
export const FirestoreOrderService = {
  async getAll(maxCount = 100): Promise<Order[]> {
    try {
      await ensureAdminAuth()
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(maxCount))
      const snap = await getDocs(q)
      return snap.docs.map((d) => d.data() as Order)
    } catch (err) {
      try {
        await ensureAdminAuth()
        const q2 = query(collection(db, 'orders'), limit(maxCount))
        const snap = await getDocs(q2)
        const orders = snap.docs.map((d) => d.data() as Order)
        return orders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      } catch (innerErr) {
        console.warn('[FirestoreService] orders fetch fallback:', innerErr)
        return []
      }
    }
  },

  async getById(id: string): Promise<Order | null> {
    if (!id) return null
    try {
      await ensureAdminAuth()
      // 1. Direct document ID lookup
      const ref = doc(db, 'orders', id)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        return snap.data() as Order
      }

      // 2. Query by orderNumber field (e.g. VM-123456)
      const q = query(collection(db, 'orders'), where('orderNumber', '==', id))
      const querySnap = await getDocs(q)
      if (!querySnap.empty) {
        return querySnap.docs[0].data() as Order
      }

      return null
    } catch (err) {
      console.warn('[FirestoreService] order getById fallback:', err)
      return null
    }
  },

  async save(order: Order): Promise<Order> {
    try {
      await ensureAdminAuth()
      const cleanOrder = JSON.parse(JSON.stringify(order))
      const ref = doc(db, 'orders', cleanOrder.id)
      await setDoc(ref, cleanOrder, { merge: true })
      return cleanOrder
    } catch (err) {
      console.error('[FirestoreService] order save error:', err)
      throw err
    }
  },
}

/* =====================================================================
   USERS / CUSTOMER PROFILES
===================================================================== */
export const FirestoreUserService = {
  async getAll(maxCount = 100): Promise<UserProfile[]> {
    try {
      await ensureAdminAuth()
      const q = query(collection(db, 'users'), limit(maxCount))
      const snap = await getDocs(q)
      const users = snap.docs.map((d) => d.data() as UserProfile)
      return users.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
    } catch (err) {
      console.warn('[FirestoreService] users fetch fallback:', err)
      return []
    }
  },

  async getById(uid: string): Promise<UserProfile | null> {
    try {
      await ensureAdminAuth()
      const ref = doc(db, 'users', uid)
      const snap = await getDoc(ref)
      return snap.exists() ? (snap.data() as UserProfile) : null
    } catch (err) {
      console.warn('[FirestoreService] user getById fallback:', err)
      return null
    }
  },

  async save(user: UserProfile): Promise<UserProfile> {
    try {
      await ensureAdminAuth()
      const cleanUser = JSON.parse(JSON.stringify(user))
      const ref = doc(db, 'users', cleanUser.uid)
      await setDoc(ref, cleanUser, { merge: true })
      return cleanUser
    } catch (err) {
      console.warn('[FirestoreService] user save fallback:', err)
      return user
    }
  },
}

/* =====================================================================
   AUDIT LOGS (Immutable Owner Trail)
===================================================================== */
export const FirestoreAuditLogService = {
  async getAll(maxCount = 50): Promise<any[]> {
    try {
      await ensureAdminAuth()
      const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(maxCount))
      const snap = await getDocs(q)
      return snap.docs.map((d) => d.data())
    } catch (err) {
      console.warn('[FirestoreService] auditLogs fetch fallback:', err)
      return []
    }
  },

  async save(log: any): Promise<void> {
    try {
      await ensureAdminAuth()
      const ref = doc(db, 'auditLogs', log.id)
      await setDoc(ref, log, { merge: true })
    } catch (err) {
      console.error('[FirestoreService] auditLog save error:', err)
    }
  },
}

/* =====================================================================
   SITE SETTINGS (FSSAI, Address, Business Identity)
===================================================================== */
export const FirestoreSettingsService = {
  async getSettings(): Promise<SiteSettings | null> {
    try {
      const ref = doc(db, 'settings', 'general')
      const snap = await getDoc(ref)
      if (snap.exists()) {
        return snap.data() as SiteSettings
      }
      return null
    } catch (err) {
      console.warn('[FirestoreService] getSettings fallback:', err)
      return null
    }
  },

  async saveSettings(settings: Partial<SiteSettings>): Promise<void> {
    try {
      await ensureAdminAuth()
      const ref = doc(db, 'settings', 'general')
      await setDoc(ref, { ...settings, updatedAt: new Date().toISOString() }, { merge: true })
    } catch (err) {
      console.error('[FirestoreService] saveSettings error:', err)
    }
  },
}

/* =====================================================================
   COUPONS & PROMOTIONS (Active Sacred Offers)
===================================================================== */
export const FirestoreCouponService = {
  async getAll(): Promise<Coupon[]> {
    try {
      const snap = await getDocs(collection(db, 'coupons'))
      if (snap.empty) {
        return []
      }
      return snap.docs.map((d) => d.data() as Coupon)
    } catch (err) {
      console.warn('Firestore coupons fetch fallback:', err)
      return []
    }
  },

  async getByCode(code: string): Promise<Coupon | null> {
    try {
      const cleanCode = code.trim().toUpperCase()
      const q = query(collection(db, 'coupons'), where('code', '==', cleanCode), limit(1))
      const snap = await getDocs(q)
      if (!snap.empty) {
        return snap.docs[0].data() as Coupon
      }
      return null
    } catch (err) {
      console.warn('Firestore coupon getByCode fallback:', err)
      return null
    }
  },

  async save(coupon: Coupon): Promise<Coupon> {
    try {
      await ensureAdminAuth()
      const clean = JSON.parse(JSON.stringify(coupon))
      const ref = doc(db, 'coupons', clean.id)
      await setDoc(ref, clean, { merge: true })
      return clean
    } catch (err) {
      console.error('[FirestoreService] coupon save error:', err)
      return coupon
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await ensureAdminAuth()
      const ref = doc(db, 'coupons', id)
      await deleteDoc(ref)
    } catch (err) {
      console.error('[FirestoreService] coupon remove error:', err)
    }
  },

  async incrementUsage(id: string): Promise<void> {
    try {
      await ensureAdminAuth()
      const ref = doc(db, 'coupons', id)
      await updateDoc(ref, {
        timesUsed: increment(1),
        updatedAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error('[FirestoreService] coupon incrementUsage error:', err)
    }
  },
}
