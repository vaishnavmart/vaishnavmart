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
import { Product, Category, PageContent, Order, UserProfile } from '@/types'
import {
  initialProducts,
  initialCategories,
  initialHomeSections,
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
  async getAll(): Promise<Order[]> {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map((d) => d.data() as Order)
    } catch (err) {
      try {
        const snap = await getDocs(collection(db, 'orders'))
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
      const ref = doc(db, 'orders', order.id)
      await setDoc(ref, order, { merge: true })
      return order
    } catch (err) {
      console.warn('Firestore order save fallback:', err)
      return order
    }
  },
}

/* =====================================================================
   USERS / CUSTOMER PROFILES
===================================================================== */
export const FirestoreUserService = {
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
      const ref = doc(db, 'users', user.uid)
      await setDoc(ref, user, { merge: true })
      return user
    } catch (err) {
      console.warn('Firestore user save fallback:', err)
      return user
    }
  },
}
