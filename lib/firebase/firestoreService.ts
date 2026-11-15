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
} from 'firebase/firestore'
import { db } from './config'
import { Product, Category, PageContent, Order, UserProfile, Coupon } from '@/types'
import {
  initialProducts,
  initialCategories,
  initialHomeSections,
  initialCoupons,
} from '@/lib/data/mockData'

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
      const ref = doc(db, 'products', product.id)
      await setDoc(ref, product, { merge: true })
      return product
    } catch (err) {
      console.warn('Firestore product save fallback:', err)
      return product
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const ref = doc(db, 'products', id)
      await deleteDoc(ref)
    } catch (err) {
      console.warn('Firestore product remove fallback:', err)
    }
  },

  // Batch seed all initial products to Firestore
  async seedAll(products: Product[]): Promise<number> {
    let count = 0
    for (const p of products) {
      try {
        await setDoc(doc(db, 'products', p.id), p, { merge: true })
        count++
      } catch (err) {
        console.warn(`Failed seeding product ${p.id}:`, err)
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
      const ref = doc(db, 'categories', category.id)
      await setDoc(ref, category, { merge: true })
      return category
    } catch (err) {
      console.warn('Firestore category save fallback:', err)
      return category
    }
  },

  async seedAll(categories: Category[]): Promise<number> {
    let count = 0
    for (const c of categories) {
      try {
        await setDoc(doc(db, 'categories', c.id), c, { merge: true })
        count++
      } catch (err) {
        console.warn(`Failed seeding category ${c.id}:`, err)
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
      const ref = doc(db, 'pages', page.slug)
      await setDoc(ref, page, { merge: true })
      return page
    } catch (err) {
      console.warn('Firestore page savePage fallback:', err)
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
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(maxCount))
      const snap = await getDocs(q)
      return snap.docs.map((d) => d.data() as Order)
    } catch (err) {
      try {
        const q2 = query(collection(db, 'orders'), limit(maxCount))
        const snap = await getDocs(q2)
        return snap.docs.map((d) => d.data() as Order)
      } catch (innerErr) {
        console.warn('Firestore orders fetch fallback:', innerErr)
        return []
      }
    }
  },

  async getById(id: string): Promise<Order | null> {
    if (!id) return null
    try {
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
      console.warn('Firestore order getById fallback:', err)
      return null
    }
  },

  async save(order: Order): Promise<Order> {
    try {
      const cleanOrder = JSON.parse(JSON.stringify(order))
      const ref = doc(db, 'orders', cleanOrder.id)
      await setDoc(ref, cleanOrder, { merge: true })
      return cleanOrder
    } catch (err) {
      console.error('Firestore order save error:', err)
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
      const q = query(collection(db, 'users'), limit(maxCount))
      const snap = await getDocs(q)
      const users = snap.docs.map((d) => d.data() as UserProfile)
      return users.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
    } catch (err) {
      console.warn('Firestore users fetch fallback:', err)
      return []
    }
  },

  async getById(uid: string): Promise<UserProfile | null> {
    try {
      const ref = doc(db, 'users', uid)
      const snap = await getDoc(ref)
      return snap.exists() ? (snap.data() as UserProfile) : null
    } catch (err) {
      console.warn('Firestore user getById fallback:', err)
      return null
    }
  },

  async save(user: UserProfile): Promise<UserProfile> {
    try {
      const cleanUser = JSON.parse(JSON.stringify(user))
      const ref = doc(db, 'users', cleanUser.uid)
      await setDoc(ref, cleanUser, { merge: true })
      return cleanUser
    } catch (err) {
      console.warn('Firestore user save fallback:', err)
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
      const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(maxCount))
      const snap = await getDocs(q)
      return snap.docs.map((d) => d.data())
    } catch (err) {
      console.warn('Firestore auditLogs fetch fallback:', err)
      return []
    }
  },

  async save(log: any): Promise<void> {
    try {
      const ref = doc(db, 'auditLogs', log.id)
      await setDoc(ref, log, { merge: true })
    } catch (err) {
      console.warn('Firestore auditLog save fallback:', err)
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
      const clean = JSON.parse(JSON.stringify(coupon))
      const ref = doc(db, 'coupons', clean.id)
      await setDoc(ref, clean, { merge: true })
      return clean
    } catch (err) {
      console.warn('Firestore coupon save fallback:', err)
      return coupon
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const ref = doc(db, 'coupons', id)
      await deleteDoc(ref)
    } catch (err) {
      console.warn('Firestore coupon remove fallback:', err)
    }
  },
}
