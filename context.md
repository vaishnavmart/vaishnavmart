# Vaishnava Mart (*रस Kan*) — Project Context & Engineering Ledger

**Last Updated:** November 17, 2026  
**Platform:** Vaishnava Mart (*रस Kan* / *Ras Kan Foods*)  
**Architecture:** Next.js 14.2 (App Router) + Google Cloud Firestore + Firebase Spark Tier + Vercel Production  
**Primary Repositories & Workspaces:**
- Primary Dev Workspace: `C:\Users\yashv\Desktop\Yashveer Singh\Projects\Vaishnavamart`
- Client Mirrored Workspace: `C:\Users\yashv\Desktop\Yashveer Singh Rajpoot\clients\vaishnavmart\vaishnavmart-main`
- GitHub Remote: [`https://github.com/vaishnavmart/vaishnavmart.git`](https://github.com/vaishnavmart/vaishnavmart.git) (`main` branch)
- Production URL: [`https://vaishnavmart-9axmjvhiy-vaishnavmart.vercel.app`](https://vaishnavmart-9axmjvhiy-vaishnavmart.vercel.app) / [`https://vaishnavamart.com`](https://vaishnavamart.com)

---

## 1. Project Overview

### What the Project Is
**Vaishnava Mart** (*रस Kan*) is a full-stack, enterprise-grade Direct-to-Consumer (D2C) ecommerce platform dedicated to pure Satvik, Jain, and Vaishnava heritage culinary goods and whole spice blends.

### Purpose & Brand Promise
- **Uncompromising Purity:** 100% allium-free (strict zero onion, zero garlic) manufactured in an isolated cleanroom facility.
- **Sacred Culinary Standards:** Suitable for temple Bhoga offerings, sacred Vaishnava rituals, Ekadashi observances, and conscious Jain households across India.
- **Traditional Processing:** Stone-ground at slow temperatures to retain volatile essential oils and rich aroma without artificial additives or preservatives.
- **Zero-Cost Production Readiness:** Purpose-built to run on the **Firebase Spark Free Plan** alongside **Vercel Serverless**, ensuring zero infrastructure hosting fees while supporting thousands of orders.

### Core Tech Stack
| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14.2 (App Router, Server Actions, TypeScript 5.9) | Full-stack server-rendered and static ecommerce engine |
| **Frontend UI** | Tailwind CSS 3.4, Framer Motion, Lucide React | Heritage Indian ivory/burgundy/gold aesthetic with responsive design |
| **Database** | Google Cloud Firestore (Project `raskan-id`) | Real-time NoSQL persistence for catalog, orders, coupons, users, CMS |
| **Authentication** | Firebase Auth (Google Sign-In & Email/Password) + Cookie Session | Dual-layer patron and superadmin authentication |
| **Payments** | Razorpay Gateway (UPI, Cards, NetBanking, COD) | Server-side order creation, HMAC signature verification, webhooks |
| **Fulfillment** | jsPDF, Shiprocket Tracking Integration | 4x6 delivery stickers, A4 pick/pack slips, GST/FSSAI invoices, Mandi procurement CSVs |
| **Notifications** | Vercel Serverless Outbound WhatsApp Dispatcher | Direct customer order confirmations via WhatsApp Business API |

---

## 2. Work Completed (Summary of Everything Done So Far)

### Phase 1: Discovery, Codebase Restructuring & Architecture Alignment
- Restructured all public assets and production code into clean, scalable Next.js directory hierarchies.
- Established strict TypeScript schemas and domain models in [`types/index.ts`](types/index.ts) for `Product`, `Category`, `Order`, `Coupon`, `UserProfile`, `SiteSettings`, and `AuditLog`.
- Cleaned up redundant dependencies and configured Next.js build optimization for 56 routes.

### Phase 2: Superadmin Panel Capabilities Overhaul
- **Inventory Control (`/admin/inventory`):**
  - Real-time stock counters, low-stock threshold triggers, lot/batch tracking, expiry tracking.
  - Built the **Mandi Wholesale Procurement CSV Exporter** to generate wholesale spice purchase manifests for agricultural mandi suppliers.
  - Integrated one-click **Product Duplication/Cloning** creating draft copies (`-copy-xxxx`) with adjusted SKUs.
- **Promotions & Coupons Management (`/admin/coupons`):**
  - Full CRUD interface for promotional discount codes: percentage-off, flat ₹-off, minimum order spend thresholds, maximum discount caps, usage limits, and active date ranges.
  - Server-side coupon verification endpoint (`/api/coupons/validate`) preventing client-side discount spoofing.
- **Orders Command Center (`/admin/orders` & `/admin/orders/[id]`):**
  - Real-time order filtering by status (`new`, `confirmed`, `processing`, `packed`, `shipped`, `delivered`, `cancelled`).
  - Batch generation of **4x6 inch thermal courier delivery stickers** (PDF) with barcodes and customer addresses.
  - Batch generation of **A4 warehouse morning pick & pack slips** (PDF) with item checklists and notes.
  - Direct order CSV export for accounting and logistics reconciliation.
  - Order details editing: logistics tracking numbers, Shiprocket partner selection, admin staff notes, and line-item quantity adjustments with automatic stock recalculation.
- **Visual CMS & Section Customizer (`/admin/edit` & `/admin/edit/[slug]`):**
  - Drag-and-drop / click-to-reorder homepage visual sections.
  - Banner image management, headline editors, and draft/publish version histories.
- **Catalog Bulk CSV Ingestion (`/admin/add/bulk-csv`):**
  - Ingestion tool for multi-row CSV catalog spreadsheets with column mapping and schema validation.
- **Storefront & Regulatory Settings (`/admin/settings`):**
  - FSSAI License number configuration, registered dispatch address, support helpline numbers, and announcement bar toggles.
- **Audit Logs Trail (`/admin/audit-log`):**
  - Immutable chronological audit trail recording product additions, price edits, restocks, and staff actions.

### Phase 3: Single Source of Truth & Database Transition
- Converted Cloud Firestore (`raskan-id`) into the true **single source of truth** for all catalog products and categories.
- Migrated legacy `initialProducts` mock array into a bootstrap seed and offline fail-safe mechanism, ensuring live Firestore documents always take 100% precedence.

### Phase 4: Server-Side REST API Infrastructure
Built a unified, type-safe REST API layer:
1. `GET /api/admin/products` & `POST /api/admin/products` & `DELETE /api/admin/products`
2. `GET /api/products` (Public catalog with status filtering)
3. `GET /api/admin/categories` & `POST /api/admin/categories`
4. `GET /api/categories` (Public categories)
5. `GET /api/admin/orders` & `PATCH /api/admin/orders` (Order status, logistics, line items)
6. `GET /api/admin/coupons` & `POST /api/admin/coupons` & `DELETE /api/admin/coupons`
7. `POST /api/coupons/validate` (Patron checkout coupon engine)
8. `POST /api/admin/notifications/whatsapp` (Serverless order notification dispatcher)
9. `POST /api/admin/payments/refund` (Direct Razorpay refund trigger)
10. `POST /api/orders` & `GET /api/orders` (Order creation and verification)
11. `POST /api/payments/create-order` & `POST /api/payments/verify-payment` & `POST /api/payments/webhook`

---

## 3. Bug Log (Bugs Encountered & How They Were Debugged/Resolved)

### BUG-01: Product Edit Revert on Page Refresh (CRITICAL)
- **Symptom:** When the Superadmin edited a product's price, stock, description, or title in `/admin/inventory` or `/admin/add/product`, the changes appeared to apply in the UI and success toasts were displayed. However, upon refreshing the page or switching tabs, **all changes reverted back to their original hardcoded values**.
- **Root Cause Analysis:**
  1. *Authentication Disconnect:* Superadmin authenticated via password login at `/owner-login`, which set an HTTP-only cookie (`vm_admin_session = authenticated_owner`). However, the client-side Firebase Auth SDK (`auth.currentUser`) remained unauthenticated (`null`).
  2. *Firestore Rule Rejection:* In `firestore.rules`, writing to `/products/{productId}` required `isAdmin()`, which demanded `request.auth != null && request.auth.token.email in [...]`. Because `request.auth` was null, Firestore rejected every write with `7 PERMISSION_DENIED: Missing or insufficient permissions`.
  3. *Silent Error Swallowing:* `FirestoreProductService.save()` caught the Firestore write error in a `try/catch` and silently returned the unpersisted product object with `console.warn`. The UI only updated `localStorage`.
  4. *Hydration Overwrite:* On page reload, `ProductRepository.getAllProducts()` queried Firestore (`FirestoreProductService.getAll()`). Because the previous write never reached Firestore, Firestore returned the unchanged documents. The repository merged these onto `initialProducts` and rewrote `localStorage`, permanently wiping the user's edits.
- **Resolution:**
  - Implemented `ensureAdminAuth()` in [`lib/firebase/firestoreService.ts`](lib/firebase/firestoreService.ts) to guarantee an authenticated Firebase Auth session (`raskanfood@gmail.com`) before every administrative write.
  - Updated [`app/owner-login/page.tsx`](app/owner-login/page.tsx) to call `signInWithEmailAndPassword(auth, email, password)` on the client upon successful cookie issuance.
  - Added session hydration in [`app/admin/layout.tsx`](app/admin/layout.tsx) to auto-restore client Firebase Auth when the admin cookie is active.
  - Updated `saveProduct`, `deleteProduct`, and `duplicateProduct` in [`lib/data/repositories.ts`](lib/data/repositories.ts) to `await` Firestore writes.
  - Verified persistence empirically via live script against Firestore project `raskan-id`.

### BUG-02: Missing Coupons Rule in `firestore.rules` (HIGH)
- **Symptom:** Admin coupon creation and deletion failed with permissions errors; coupon validations in checkout could not read from Firestore.
- **Root Cause:** Collection `/coupons/{couponId}` was completely absent from `firestore.rules`. Firestore defaults to deny for any unmentioned collection.
- **Resolution:** Added `match /coupons/{couponId} { allow read: if true; allow write: if isAdmin(); }` to `firestore.rules` and deployed rules live via `firebase deploy --only firestore:rules --config firebase.json --project raskan-id`.

### BUG-03: Razorpay Webhook Signature Mismatch on Empty Secret (HIGH)
- **Symptom:** Webhook order capture failed on Vercel preview environments when `RAZORPAY_WEBHOOK_SECRET` was not explicitly configured in environment variables.
- **Root Cause:** Webhook route threw a fatal 500 error when the specific webhook secret variable was absent.
- **Resolution:** Updated [`app/api/payments/webhook/route.ts`](app/api/payments/webhook/route.ts) to fall back safely to `RAZORPAY_KEY_SECRET` to compute the HMAC-SHA256 signature when `RAZORPAY_WEBHOOK_SECRET` is not set.

### BUG-04: Firestore Order Serialization Failure (MEDIUM)
- **Symptom:** `FirestoreOrderService.save` threw runtime errors when order payloads contained `undefined` optional fields.
- **Root Cause:** Cloud Firestore SDK throws an error if any object property has an `undefined` value.
- **Resolution:** Enabled `ignoreUndefinedProperties: true` during Firestore initialization in [`lib/firebase/config.ts`](lib/firebase/config.ts), and added `JSON.parse(JSON.stringify(order))` sanitizers in all service write methods.

### BUG-05: Payment Redirect 404 & Guest Order Lookup Disconnect (MEDIUM)
- **Symptom:** Patrons completing payment were occasionally redirected to a 404 page, or saw an empty order confirmation screen.
- **Root Cause:** Legacy redirect routes routed to `/order-confirmation` instead of canonical `/order-success`, and guest orders lacked authenticated user ID matching.
- **Resolution:** Unified success flow on `/order-success` and `/order-success/[orderId]`. Stored recent order payload in `localStorage` under `vm_last_order` for immediate hydration.

### BUG-06: PowerShell Wildcard Matching on Dynamic Routes (LOW)
- **Symptom:** Scripted PowerShell file copy operations failed when targeting dynamic Next.js routes containing square brackets (e.g. `[id]`, `[slug]`).
- **Root Cause:** PowerShell interprets square brackets as regex wildcard character classes.
- **Resolution:** Enforced the `-LiteralPath` parameter in all PowerShell file synchronization scripts.

### BUG-07: Hardcoded Baseline Mock Precedence & Zombie Records (MEDIUM)
- **Symptom:** Hard-deleted products or modified fields were resurrected when merging `{ ...existing, ...lp }` with `initialProducts`.
- **Root Cause:** `ProductRepository.getAllProducts()` populated a Map with mock objects first, and shallow-merged Firestore documents on top. Deletions in Firestore were not reflected because the mock object still existed.
- **Resolution:** Overhauled Map reconciliation in [`lib/data/repositories.ts`](lib/data/repositories.ts) so live Firestore documents overwrite mock templates directly (`productMap.set(lp.id, lp)`).

---

## 4. Change Log (Additions and Removals to Codebase)

### Additions (+)
1. **API Route Handlers:**
   - `app/api/admin/products/route.ts`: Server-side administrative product listing, creation, editing, and soft/hard deletion with cookie session security.
   - `app/api/products/route.ts`: Public catalog endpoint for active products with category filtering.
   - `app/api/admin/categories/route.ts`: Administrative category creation and listing.
   - `app/api/categories/route.ts`: Public categories list endpoint.
   - `app/api/admin/coupons/route.ts`: Administrative promotion creation and deletion.
   - `app/api/coupons/validate/route.ts`: Public checkout coupon validation with minimum order checks.
   - `app/api/admin/notifications/whatsapp/route.ts`: Outbound serverless WhatsApp order dispatcher.
   - `app/api/admin/payments/refund/route.ts`: Razorpay refund execution endpoint.
2. **Admin Pages & Components:**
   - `app/admin/coupons/page.tsx`: Promotional coupons management UI with real-time usage stats.
   - `app/admin/orders/[id]/page.tsx`: Detailed order management UI with line-item editor, courier logistics tracking, and refund triggers.
3. **Core Utilities & Services:**
   - `lib/utils/invoiceGenerator.ts`: PDF generation engine for 4x6 thermal delivery stickers, A4 morning warehouse packing slips, FSSAI tax invoices, and Mandi procurement CSV spreadsheets.
   - `ensureAdminAuth` in `lib/firebase/firestoreService.ts`: Dual-auth bridge guaranteeing active Firebase Auth before Firestore writes.

### Modifications / Enhancements (~)
1. **`firestore.rules`:**
   - Added rule definition for `/coupons/{couponId}` allowing public read and administrative write.
   - Verified least-privilege security across `products`, `categories`, `orders`, `users`, `carts`, `settings`, and `auditLogs`.
2. **`lib/firebase/firestoreService.ts`:**
   - Integrated `ensureAdminAuth()` into all write methods (`save`, `remove`, `seedAll`) across products, categories, coupons, orders, pages, and audit logs.
   - Replaced silent fallback warnings with detailed error reporting.
3. **`lib/data/repositories.ts`:**
   - Updated `ProductRepository` and `CategoryRepository` to make live Firestore data authoritative over mock defaults.
   - Converted all save, delete, and duplicate calls to asynchronously `await` Firestore writes before returning.
4. **`app/owner-login/page.tsx`:**
   - Connected `signInWithEmailAndPassword` to the client-side login form to keep Firebase Auth client SDK synchronized with server cookies.
5. **`app/admin/layout.tsx`:**
   - Added automatic Firebase Auth session restoration on admin panel mount and explicit sign-out on logout.
6. **`app/api/admin/orders/route.ts`:**
   - Added `PATCH` method supporting status updates, Shiprocket tracking numbers, logistics URLs, admin notes, and line-item changes.
7. **`app/admin/inventory/page.tsx`:**
   - Added Mandi procurement CSV export button and one-click product duplication.
8. **`app/admin/orders/page.tsx`:**
   - Added batch delivery sticker printing (PDF), batch packing slips printing (PDF), and full CSV export.

### Removals (-)
- Removed un-awaited Firestore asynchronous dispatches that were causing race conditions during router navigation.
- Removed legacy mock data precedence in repository hydration loops.
- Removed deprecated `/order-confirmation` references in favor of canonical `/order-success`.
- Removed reliance on unauthenticated client-side direct writes to Cloud Firestore.

---

## 5. Environment & Deployment Instructions

### Local Development Setup
1. Ensure Node.js `>=20.0.0` is installed.
2. Clone repository and install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env.local
   ```
4. Start local development server:
   ```bash
   npm run dev
   ```
5. Run verification suite:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

### Firebase Deployment
To deploy updated security rules and indexes directly to Firebase Spark project `raskan-id`:
```bash
firebase deploy --only firestore --config firebase.json --project raskan-id
```

### Production Deployment
All changes pushed to branch `main` on GitHub [`vaishnavmart/vaishnavmart`](https://github.com/vaishnavmart/vaishnavmart.git) trigger automated GitHub Actions CI (`Lint, Typecheck & Production Build`) and automatically deploy to **Vercel Production**.
