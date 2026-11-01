import {
  Product,
  Category,
  PageContent,
  PageSection,
  PageVersion,
  SiteSettings,
  UserProfile,
  Order,
  Cart,
  AuditLog,
  AdminNotification,
  OrderStatus,
  PaymentState,
} from '@/types'
import {
  initialProducts,
  initialCategories,
  initialHomeSections,
  initialSiteSettings,
  initialUsers,
  initialOrders,
  initialCarts,
  initialAuditLogs,
  initialNotifications,
} from './mockData'
import {
  FirestoreProductService,
  FirestoreCategoryService,
  FirestorePageService,
  FirestoreOrderService,
  FirestoreUserService,
} from '@/lib/firebase/firestoreService'

// In-Memory Global Mock Store (Server & Client fallback)
let mockProductsStore: Product[] = [...initialProducts]
let mockCategoriesStore: Category[] = [...initialCategories]
let mockPagesStore: Record<string, PageContent> = {
  home: { ...initialHomeSections },
}
let mockPageVersionsStore: Record<string, PageVersion[]> = {
  home: [
    {
      id: 'ver-1',
      pageId: 'page-home',
      versionNumber: 1,
      sections: JSON.parse(JSON.stringify(initialHomeSections.publishedSections)),
      createdAt: '2026-10-06T18:00:00Z',
      publishedBy: 'System Launch',
    },
  ],
}
let mockSettingsStore: SiteSettings = { ...initialSiteSettings }
let mockUsersStore: UserProfile[] = [...initialUsers]
let mockOrdersStore: Order[] = [...initialOrders]
let mockCartsStore: Cart[] = [...initialCarts]
let mockAuditLogsStore: AuditLog[] = [...initialAuditLogs]
let mockNotificationsStore: AdminNotification[] = [...initialNotifications]

// LocalStorage Hydration Helper (Safe in Browser)
function syncFromStorage() {
  if (typeof window === 'undefined') return
  try {
    const p = localStorage.getItem('vm_products_v3')
    if (p) {
      mockProductsStore = JSON.parse(p)
      if (!mockProductsStore.some((pr) => pr.id === 'rk-kha-01' && pr.packOptions && pr.packOptions.length > 0)) {
        mockProductsStore = [...initialProducts]
        localStorage.setItem('vm_products_v3', JSON.stringify(mockProductsStore))
      }
    } else {
      mockProductsStore = [...initialProducts]
      localStorage.setItem('vm_products_v3', JSON.stringify(mockProductsStore))
    }
    const c = localStorage.getItem('vm_categories_v3')
    if (c) {
      mockCategoriesStore = JSON.parse(c)
    } else {
      mockCategoriesStore = [...initialCategories]
      localStorage.setItem('vm_categories_v3', JSON.stringify(mockCategoriesStore))
    }
    const pg = localStorage.getItem('vm_pages')
    if (pg) mockPagesStore = JSON.parse(pg)
    const s = localStorage.getItem('vm_settings')
    if (s) mockSettingsStore = JSON.parse(s)
    const u = localStorage.getItem('vm_users')
    if (u) mockUsersStore = JSON.parse(u)
    const o = localStorage.getItem('vm_orders')
    if (o) mockOrdersStore = JSON.parse(o)
    const crt = localStorage.getItem('vm_carts')
    if (crt) mockCartsStore = JSON.parse(crt)
    const l = localStorage.getItem('vm_logs')
    if (l) mockAuditLogsStore = JSON.parse(l)
    const n = localStorage.getItem('vm_notifications')
    if (n) mockNotificationsStore = JSON.parse(n)
  } catch {
    // Ignore storage parse issues
  }
}

function syncToStorage() {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('vm_products_v3', JSON.stringify(mockProductsStore))
    localStorage.setItem('vm_categories_v3', JSON.stringify(mockCategoriesStore))
    localStorage.setItem('vm_pages', JSON.stringify(mockPagesStore))
    localStorage.setItem('vm_settings', JSON.stringify(mockSettingsStore))
    localStorage.setItem('vm_users', JSON.stringify(mockUsersStore))
    localStorage.setItem('vm_orders', JSON.stringify(mockOrdersStore))
    localStorage.setItem('vm_carts', JSON.stringify(mockCartsStore))
    localStorage.setItem('vm_logs', JSON.stringify(mockAuditLogsStore))
    localStorage.setItem('vm_notifications', JSON.stringify(mockNotificationsStore))
  } catch {
    // Ignore storage write issues
  }
}

// Ensure client sync
if (typeof window !== 'undefined') {
  syncFromStorage()
}

/* =====================================================================
   PRODUCT REPOSITORY
===================================================================== */
export const ProductRepository = {
  async getAllProducts(options?: { status?: string; categoryId?: string; includeDemo?: boolean }): Promise<Product[]> {
    syncFromStorage()
    if (process.env.NEXT_PUBLIC_DATA_MODE === 'firebase') {
      try {
        const liveProducts = await FirestoreProductService.getAll()
        if (liveProducts && liveProducts.length > 0) {
          mockProductsStore = liveProducts
        }
      } catch (err) {
        console.warn('Firestore getAllProducts notice:', err)
      }
    }
    let list = [...mockProductsStore]
    if (options?.status) {
      list = list.filter((p) => p.status === options.status)
    }
    if (options?.categoryId) {
      list = list.filter((p) => p.categoryIds.includes(options.categoryId!))
    }
    if (options?.includeDemo === false) {
      list = list.filter((p) => !p.isDemo)
    }
    return list
  },

  async getProductById(id: string): Promise<Product | null> {
    syncFromStorage()
    if (id === 'rk-kha-08') return mockProductsStore.find((p) => p.id === 'rk-kha-06-50g' || p.id === 'rk-kha-08') || null
    if (id === 'rk-kha-09') return mockProductsStore.find((p) => p.id === 'rk-kha-07-50g' || p.id === 'rk-kha-09') || null
    let found = mockProductsStore.find((p) => p.id === id) || null
    if (!found && process.env.NEXT_PUBLIC_DATA_MODE === 'firebase') {
      try {
        found = await FirestoreProductService.getById(id)
      } catch {
        // fallback
      }
    }
    return found
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    syncFromStorage()
    const clean = slug.toLowerCase()
    let found = (
      mockProductsStore.find((p) => p.slug.toLowerCase() === clean) ||
      mockProductsStore.find(
        (p) =>
          p.slug.toLowerCase().replace(/-200g$/, '') === clean ||
          p.slug.toLowerCase().replace(/-50g$/, '') === clean
      ) ||
      mockProductsStore.find((p) => p.id.toLowerCase() === clean) ||
      null
    )
    if (!found && process.env.NEXT_PUBLIC_DATA_MODE === 'firebase') {
      try {
        found = await FirestoreProductService.getBySlug(slug)
      } catch {
        // fallback
      }
    }
    return found
  },

  async saveProduct(product: Product): Promise<Product> {
    syncFromStorage()
    let saved: Product
    const index = mockProductsStore.findIndex((p) => p.id === product.id)
    if (index >= 0) {
      saved = { ...product, updatedAt: new Date().toISOString() }
      mockProductsStore[index] = saved
      await AuditLogRepository.addLog('Product Edited', `Updated product: ${product.name}`, 'Owner')
    } else {
      saved = { ...product, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      mockProductsStore.unshift(saved)
      await AuditLogRepository.addLog('Product Added', `Added product: ${product.name}`, 'Owner')
    }
    syncToStorage()

    // Sync to Firebase Firestore asynchronously
    FirestoreProductService.save(saved).catch((err) => {
      console.warn('Firebase product save notice:', err)
    })

    return saved
  },

  async deleteProduct(id: string, soft = true): Promise<void> {
    syncFromStorage()
    const prod = mockProductsStore.find((p) => p.id === id)
    if (soft) {
      if (prod) {
        prod.status = 'hidden'
        FirestoreProductService.save(prod).catch(() => {})
      }
    } else {
      mockProductsStore = mockProductsStore.filter((p) => p.id !== id)
      FirestoreProductService.remove(id).catch(() => {})
    }
    if (prod) {
      await AuditLogRepository.addLog('Product Deleted', `Removed product: ${prod.name}`, 'Owner')
    }
    syncToStorage()
  },

  async clearDemoProducts(): Promise<number> {
    syncFromStorage()
    const countBefore = mockProductsStore.length
    mockProductsStore = mockProductsStore.filter((p) => !p.isDemo)
    syncToStorage()
    await AuditLogRepository.addLog('Demo Products Cleared', 'All placeholder demo items removed', 'Owner')
    return countBefore - mockProductsStore.length
  },

  async getTopProducts(ids?: string[]): Promise<Product[]> {
    syncFromStorage()
    if (ids && ids.length > 0) {
      return mockProductsStore.filter((p) => ids.includes(p.id) && p.status === 'active')
    }
    return mockProductsStore.filter((p) => p.status === 'active').slice(0, 2)
  },

  async getMostOrdered(limit = 4, fallbackIds?: string[]): Promise<Product[]> {
    syncFromStorage()
    // Compute frequency from orders
    const counts: Record<string, number> = {}
    mockOrdersStore.forEach((o) => {
      o.items.forEach((item) => {
        counts[item.productId] = (counts[item.productId] || 0) + item.quantity
      })
    })

    const sortedByOrders = mockProductsStore
      .filter((p) => p.status === 'active')
      .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))

    if (sortedByOrders.length >= limit) {
      return sortedByOrders.slice(0, limit)
    }

    if (fallbackIds && fallbackIds.length > 0) {
      return mockProductsStore.filter((p) => fallbackIds.includes(p.id))
    }

    return mockProductsStore.filter((p) => p.status === 'active').slice(0, limit)
  },

  async getFeaturedProducts(limit = 6, ids?: string[]): Promise<Product[]> {
    syncFromStorage()
    if (ids && ids.length > 0) {
      const selected = mockProductsStore.filter((p) => ids.includes(p.id) && p.status === 'active')
      if (selected.length > 0) return selected.slice(0, limit)
    }
    return mockProductsStore.filter((p) => p.status === 'active').slice(0, limit)
  },

  async getSimilarProducts(ids: string[]): Promise<Product[]> {
    syncFromStorage()
    return mockProductsStore.filter((p) => ids.includes(p.id) && p.status === 'active')
  },
}

/* =====================================================================
   CATEGORY REPOSITORY
===================================================================== */
export const CategoryRepository = {
  async getAllCategories(): Promise<Category[]> {
    syncFromStorage()
    return [...mockCategoriesStore].sort((a, b) => a.sortOrder - b.sortOrder)
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    syncFromStorage()
    // Alias mapping for smooth URL backwards-compatibility
    const aliasMap: Record<string, string> = {
      'masalas': 'blend-masala-seasoning',
      'dry-fruits': 'dry-fruits-mix-trails',
      'ekadashi-foods': 'dry-fruits-mix-trails',
      'jain-foods': 'blend-masala-seasoning',
      'vaishnav-foods': 'blend-masala-seasoning',
      'premixes': 'ready-to-eat-premix',
    }
    const resolvedSlug = aliasMap[slug] || slug
    return mockCategoriesStore.find((c) => c.slug === resolvedSlug || c.slug === slug) || null
  },

  async saveCategory(category: Category): Promise<Category> {
    syncFromStorage()
    const index = mockCategoriesStore.findIndex((c) => c.id === category.id)
    if (index >= 0) {
      mockCategoriesStore[index] = category
      await AuditLogRepository.addLog('Category Updated', `Updated category: ${category.name}`, 'Owner')
    } else {
      mockCategoriesStore.push(category)
      await AuditLogRepository.addLog('Category Added', `Added category: ${category.name}`, 'Owner')
    }
    syncToStorage()

    FirestoreCategoryService.save(category).catch((err) => {
      console.warn('Firebase category save notice:', err)
    })

    return category
  },

  async deleteCategory(id: string): Promise<void> {
    syncFromStorage()
    mockCategoriesStore = mockCategoriesStore.filter((c) => c.id !== id)
    syncToStorage()
    await AuditLogRepository.addLog('Category Deleted', `Deleted category ID: ${id}`, 'Owner')
  },
}

/* =====================================================================
   PAGE & CMS REPOSITORY
===================================================================== */
export const PageRepository = {
  async getPage(slug = 'home'): Promise<PageContent> {
    syncFromStorage()
    if (process.env.NEXT_PUBLIC_DATA_MODE === 'firebase') {
      try {
        const livePage = await FirestorePageService.getPage(slug)
        if (livePage && ((livePage.publishedSections && livePage.publishedSections.length > 0) || (livePage.draftSections && livePage.draftSections.length > 0))) {
          mockPagesStore[slug] = livePage
          return livePage
        }
      } catch (err) {
        console.warn(`Firestore page getPage(${slug}) notice:`, err)
      }
    }
    if (!mockPagesStore[slug]) {
      mockPagesStore[slug] = {
        id: `page-${slug}`,
        slug,
        title: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Page`,
        draftSections: [],
        publishedSections: [],
        updatedAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      }
    }
    return mockPagesStore[slug]
  },

  async saveDraftSections(slug: string, sections: PageSection[]): Promise<void> {
    syncFromStorage()
    const page = await this.getPage(slug)
    page.draftSections = sections
    page.updatedAt = new Date().toISOString()
    mockPagesStore[slug] = page
    syncToStorage()

    FirestorePageService.savePage(page).catch((err) => {
      console.warn('Firebase page draft save notice:', err)
    })
  },

  async publishPage(slug: string): Promise<void> {
    syncFromStorage()
    const page = await this.getPage(slug)
    page.publishedSections = JSON.parse(JSON.stringify(page.draftSections))
    page.publishedAt = new Date().toISOString()
    page.updatedAt = new Date().toISOString()
    mockPagesStore[slug] = page

    // Create a new version in version history
    if (!mockPageVersionsStore[slug]) mockPageVersionsStore[slug] = []
    const versionNum = mockPageVersionsStore[slug].length + 1
    mockPageVersionsStore[slug].push({
      id: `ver-${slug}-${versionNum}`,
      pageId: page.id,
      versionNumber: versionNum,
      sections: JSON.parse(JSON.stringify(page.publishedSections)),
      createdAt: new Date().toISOString(),
      publishedBy: 'Owner',
    })

    await AuditLogRepository.addLog('Homepage Published', `Published version ${versionNum} with ${page.publishedSections.length} sections`, 'Owner')
    syncToStorage()

    // Sync published page to Firebase Firestore
    FirestorePageService.savePage(page).catch((err) => {
      console.warn('Firebase page publish notice:', err)
    })
  },

  async getVersions(slug: string): Promise<PageVersion[]> {
    syncFromStorage()
    return mockPageVersionsStore[slug] || []
  },

  async restoreVersion(slug: string, versionNumber: number): Promise<void> {
    syncFromStorage()
    const versions = mockPageVersionsStore[slug] || []
    const target = versions.find((v) => v.versionNumber === versionNumber)
    if (target) {
      const page = await this.getPage(slug)
      page.draftSections = JSON.parse(JSON.stringify(target.sections))
      page.updatedAt = new Date().toISOString()
      mockPagesStore[slug] = page
      syncToStorage()
      await AuditLogRepository.addLog('Page Restored', `Restored draft from version ${versionNumber}`, 'Owner')
    }
  },
}

/* =====================================================================
   ORDER REPOSITORY
===================================================================== */
export const OrderRepository = {
  async getOrders(filter?: { status?: string; userId?: string; search?: string }): Promise<Order[]> {
    syncFromStorage()
    let list = [...mockOrdersStore]
    if (filter?.status && filter.status !== 'all') {
      list = list.filter((o) => o.orderStatus === filter.status)
    }
    if (filter?.userId) {
      list = list.filter((o) => o.userId === filter.userId)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerSnapshot.name.toLowerCase().includes(q) ||
          o.customerSnapshot.phone.includes(q) ||
          o.customerSnapshot.email.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  async getOrderById(id: string): Promise<Order | null> {
    syncFromStorage()
    return mockOrdersStore.find((o) => o.id === id || o.orderNumber === id) || null
  },

  async createOrder(order: Order): Promise<Order> {
    syncFromStorage()
    mockOrdersStore.unshift(order)
    // Reduce product inventory
    order.items.forEach((item) => {
      const prod = mockProductsStore.find((p) => p.id === item.productId)
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity)
      }
    })
    // Add notification
    await NotificationRepository.addNotification({
      type: 'order',
      title: 'New Order Received',
      message: `Order #${order.orderNumber} placed by ${order.customerSnapshot.name} for ₹${order.finalTotal}`,
      read: false,
      link: `/admin/orders/${order.id}`,
    })
    syncToStorage()

    // Sync order to Firestore
    FirestoreOrderService.save(order).catch((err) => {
      console.warn('Firebase order save notice:', err)
    })

    return order
  },

  async updateOrderStatus(id: string, status: OrderStatus, paymentState?: PaymentState): Promise<Order | null> {
    syncFromStorage()
    const order = mockOrdersStore.find((o) => o.id === id)
    if (order) {
      order.orderStatus = status
      if (paymentState) order.paymentState = paymentState
      order.updatedAt = new Date().toISOString()
      syncToStorage()
      await AuditLogRepository.addLog('Order Status Changed', `Order #${order.orderNumber} changed to ${status}`, 'Owner')
      return order
    }
    return null
  },
}

/* =====================================================================
   USER REPOSITORY
===================================================================== */
export const UserRepository = {
  async getAllUsers(filter?: { search?: string }): Promise<UserProfile[]> {
    syncFromStorage()
    let list = [...mockUsersStore]
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q))
    }
    return list
  },

  async getUserById(uid: string): Promise<UserProfile | null> {
    syncFromStorage()
    return mockUsersStore.find((u) => u.uid === uid) || null
  },

  async saveUser(user: UserProfile): Promise<UserProfile> {
    syncFromStorage()
    const idx = mockUsersStore.findIndex((u) => u.uid === user.uid)
    if (idx >= 0) {
      mockUsersStore[idx] = { ...user, updatedAt: new Date().toISOString() }
    } else {
      mockUsersStore.push(user)
    }
    syncToStorage()
    return user
  },
}

/* =====================================================================
   CART REPOSITORY
===================================================================== */
export const CartRepository = {
  async getCart(userId: string): Promise<Cart | null> {
    syncFromStorage()
    return mockCartsStore.find((c) => c.userId === userId) || null
  },

  async saveCart(cart: Cart): Promise<void> {
    syncFromStorage()
    const idx = mockCartsStore.findIndex((c) => c.userId === cart.userId)
    if (idx >= 0) {
      mockCartsStore[idx] = cart
    } else {
      mockCartsStore.push(cart)
    }
    syncToStorage()
  },

  async clearCart(userId: string): Promise<void> {
    syncFromStorage()
    mockCartsStore = mockCartsStore.filter((c) => c.userId !== userId)
    syncToStorage()
  },

  async getCartUsers(): Promise<Array<{ user: UserProfile; cart: Cart; totalValue: number }>> {
    syncFromStorage()
    const results: Array<{ user: UserProfile; cart: Cart; totalValue: number }> = []

    for (const cart of mockCartsStore) {
      if (!cart.items || cart.items.length === 0) continue
      const user = mockUsersStore.find((u) => u.uid === cart.userId)
      if (user) {
        let totalValue = 0
        cart.items.forEach((item) => {
          const prod = mockProductsStore.find((p) => p.id === item.productId)
          if (prod) totalValue += prod.price * item.quantity
        })
        results.push({ user, cart, totalValue })
      }
    }
    return results
  },
}

/* =====================================================================
   SETTINGS REPOSITORY
===================================================================== */
export const SettingsRepository = {
  async getSettings(): Promise<SiteSettings> {
    syncFromStorage()
    return { ...mockSettingsStore }
  },

  async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    syncFromStorage()
    mockSettingsStore = { ...mockSettingsStore, ...settings }
    syncToStorage()
    await AuditLogRepository.addLog('Settings Updated', 'Owner updated business settings', 'Owner')
    return mockSettingsStore
  },
}

/* =====================================================================
   AUDIT LOG REPOSITORY
===================================================================== */
export const AuditLogRepository = {
  async getLogs(): Promise<AuditLog[]> {
    syncFromStorage()
    return [...mockAuditLogsStore].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  },

  async addLog(action: string, details: string, actor: string): Promise<void> {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      details,
      actor,
      timestamp: new Date().toISOString(),
    }
    mockAuditLogsStore.unshift(log)
    if (mockAuditLogsStore.length > 100) mockAuditLogsStore.pop()
    syncToStorage()
  },
}

/* =====================================================================
   NOTIFICATION REPOSITORY
===================================================================== */
export const NotificationRepository = {
  async getNotifications(): Promise<AdminNotification[]> {
    syncFromStorage()
    return [...mockNotificationsStore]
  },

  async markAsRead(id: string): Promise<void> {
    syncFromStorage()
    const n = mockNotificationsStore.find((notif) => notif.id === id)
    if (n) n.read = true
    syncToStorage()
  },

  async addNotification(notif: Omit<AdminNotification, 'id' | 'createdAt'>): Promise<void> {
    const newNotif: AdminNotification = {
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...notif,
    }
    mockNotificationsStore.unshift(newNotif)
    syncToStorage()
  },
}

/* =====================================================================
   FIREBASE REAL-TIME SYNC REPOSITORY (Spark Free Tier)
===================================================================== */
export const FirebaseSyncRepository = {
  async syncAllToFirestore(): Promise<{ productsCount: number; categoriesCount: number; pageSuccess: boolean }> {
    syncFromStorage()
    const productsCount = await FirestoreProductService.seedAll(mockProductsStore)
    const categoriesCount = await FirestoreCategoryService.seedAll(mockCategoriesStore)
    const page = await PageRepository.getPage('home')
    await FirestorePageService.savePage(page)
    return { productsCount, categoriesCount, pageSuccess: true }
  },

  async hydrateLiveFromFirestore(): Promise<{ productsLoaded: number; categoriesLoaded: number }> {
    try {
      const [fbProducts, fbCategories, fbPage] = await Promise.all([
        FirestoreProductService.getAll(),
        FirestoreCategoryService.getAll(),
        FirestorePageService.getPage('home'),
      ])

      let pCount = 0
      let cCount = 0

      if (fbProducts && fbProducts.length > 0) {
        mockProductsStore = fbProducts
        pCount = fbProducts.length
      }
      if (fbCategories && fbCategories.length > 0) {
        mockCategoriesStore = fbCategories
        cCount = fbCategories.length
      }
      if (fbPage && fbPage.publishedSections && fbPage.publishedSections.length > 0) {
        mockPagesStore['home'] = fbPage
      }
      syncToStorage()
      return { productsLoaded: pCount, categoriesLoaded: cCount }
    } catch (err) {
      console.warn('Firebase hydration notice:', err)
      return { productsLoaded: 0, categoriesLoaded: 0 }
    }
  },
}
