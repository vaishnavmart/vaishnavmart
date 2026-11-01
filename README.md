<div align="center">

# 🌿 Vaishnava Mart (रस Kan)
### Enterprise Satvik, Jain & Vaishnav Food Commerce Platform

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 18](https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Live-0C2340?style=for-the-badge&logo=razorpay)](https://razorpay.com/)
[![Firebase](https://img.shields.io/badge/Firebase-v13-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<p align="center">
  <b>100% Free From Onion & Garlic • Dedicated Allium-Free Cleanrooms • Bhōg Kē Liyē Standards</b>
</p>

[Live Production](https://vaishnavamart.com) • [Explore Catalog](https://vaishnavamart.com/shop) • [Our Standards](https://vaishnavamart.com/our-standard) • [Owner Portal](https://vaishnavamart.com/owner-login)

---

</div>

## 📖 Executive Summary

**Vaishnava Mart** (powered by **रस Kan**) is an enterprise-grade e-commerce application and bespoke Content Management System engineered specifically for devout **Vaishnav, Jain, and Satvik** households across India. 

Designed with the aesthetic restraint, architectural rigor, and performance precision reminiscent of Google, Anthropic, and Apple, the platform guarantees that every single item—from cold-ground whole spices and hand-roasted whole wheat khakhras to royal saffron dry fruits and instant soup premixes—is prepared in strict compliance with Vedic culinary purity (*Shaucham*).

---

## 🏛 Architecture Overview

```
                                  +---------------------------------------+
                                  |         DNS Layer (GoDaddy)           |
                                  |    vaishnavamart.com -> Vercel Edge   |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |        Vercel Global Edge CDN         |
                                  |  - Automated SSL/TLS Certificates     |
                                  |  - Static Prerender (SSG) & ISR       |
                                  |  - Brotli Compression & Security Hdr  |
                                  +-------------------+-------------------+
                                                      |
                               +----------------------+----------------------+
                               |                                             |
                               v                                             v
               +-------------------------------+             +-------------------------------+
               |   Storefront (Next.js 14)     |             |  Superadmin CMS Control Hub   |
               | - Responsive App Router (RSC) |             | - Real-Time Inventory Control |
               | - SEO (JSON-LD, OpenGraph)    |             | - Order Dispatch Lifecycle    |
               | - Size Selector Engine        |             | - Cart Abandonment Recovery   |
               | - Micro-Interactions (Motion) |             | - Visual Page Block Builder   |
               +---------------+---------------+             +---------------+---------------+
                               |                                             |
                               +----------------------+----------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |       Next.js Server API Routes       |
                                  | - /api/payments/create-order          |
                                  | - /api/payments/verify-payment (HMAC) |
                                  | - /api/payments/webhook (Idempotent)  |
                                  | - /api/auth/owner-login (HTTP-only)   |
                                  +-------+-----------------------+-------+
                                          |                       |
                 +------------------------+                       +------------------------+
                 |                                                                         |
                 v                                                                         v
+----------------------------------+                                     +----------------------------------+
|       Razorpay Payment Core      |                                     |        Firebase Cloud Suite      |
| - Live UPI (GPay, PhonePe, Paytm)|                                     | - Project: raskan-id             |
| - Credit / Debit Cards / NetBank |                                     | - Firebase Authentication        |
| - Timing-Safe Signature Check    |                                     | - Cloud Firestore (Spark Tier)   |
| - Automated Webhook Receipts     |                                     | - In-Memory High-Speed Fallback  |
+----------------------------------+                                     +----------------------------------+
```

---

## ✨ Key Features & Engineering Highlights

### 1. Dedicated Satvik Purity Engine
* **Allium-Free Integrity:** Zero onion, zero garlic, zero animal derivatives, and zero cross-contamination.
* **Bhōg Kē Liyē Standards:** Compliant for offering to the Divine before consumption.
* **Interactive Khakhra Variant Engine:** Reactive buying options (`200g` standard packs and `50g` pocket travel packs) on both catalog cards and product pages with instant price, discount, and net weight recalculation.

### 2. Multi-Tier Secure Payment Architecture
* **Live Razorpay Integration:** Seamless modal checkout supporting UPI, Google Pay, PhonePe, Cards, NetBanking, and Digital Wallets.
* **Cryptographic Verification:** Server-side HMAC SHA-256 signature verification utilizing constant-time comparison (`crypto.timingSafeEqual`) to eliminate timing attacks.
* **Webhook Event Handler (`/api/payments/webhook`):** Fully idempotent webhook receiver that auto-captures and confirms orders even if the customer navigates away during payment.
* **Cash on Delivery (COD):** Native fallback option with physical verification at doorstep.

### 3. SEO & Technical Discoverability
* **Dynamic XML Sitemap (`/sitemap.xml`):** Automatically indexes static pages, active products, categories, and location hubs.
* **Automated Robots Directive (`/robots.txt`):** Protects private administrative endpoints while permitting public indexing.
* **Structured Data (JSON-LD):**
  * `Organization` Schema (Vaishnava Mart & Ras Kan brand graph)
  * `WebSite` Schema with SearchAction
  * `Product` Schema with offers, SKU, pricing in INR, availability, and aggregate reviews
  * `BreadcrumbList` & `CollectionPage` schemas across categories
* **Social Previews:** Complete OpenGraph and Twitter/X large image cards.

### 4. Enterprise Administrative Control Center (`/admin`)
* **Secured Owner Portal (`/owner-login`):** HTTP-only session cookie protection with strict server-side authentication.
* **Live Operational Metrics:** Real-time revenue, order tracking, inventory depletion alerts, and customer registries.
* **Abandoned Cart Recovery (`/admin/cart-users`):** Directly view items left in carts with one-click WhatsApp concierge connection.

---

## 🛠 Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | Hybrid static and server-rendered architecture with React Server Components |
| **Language** | TypeScript 5.6 | Strict type-safety across models, repositories, and UI props |
| **Styling** | Tailwind CSS 3.4 | Custom luxury devotional design system (Burgundy, Gold, Ivory, Porcelain) |
| **Animations** | Framer Motion 11 | Smooth micro-interactions, modal dialogs, and drawer animations |
| **Typography** | Google Fonts | Cormorant Garamond (Editorial Serif), Manrope (Sans), Rozha One (Devanagari) |
| **Payments** | Razorpay Node SDK 2.9 | Enterprise payment gateway with server-side order generation and webhook processing |
| **Database** | Firebase Firestore 13 | Cloud Firestore document storage under Spark plan with offline repository caching |
| **Auth** | Firebase Auth + Cookies | Google Sign-In for customers, HTTP-only secure cookie sessions for Superadmin |
| **Icons & Visuals**| Lucide React & Three.js | Lightweight SVG iconography and 3D Satvik Mudra medallion rendering |

---

## 🚀 Quick Start & Local Development

### 1. Prerequisites
* **Node.js:** v20.x or higher
* **npm:** v10.x or higher
* **Git**

### 2. Clone Repository
```bash
git clone https://github.com/vaishnavmart/vaishnavmart.git
cd vaishnavmart
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy the configuration template:
```bash
cp .env.example .env.local
```
Fill in your credentials in `.env.local` (see [Environment Variables Reference](#-environment-variables-reference)).

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables Reference

| Variable | Scope | Required | Description |
| :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_SITE_URL` | Client & Server | Yes | Canonical site origin (`https://vaishnavamart.com`) |
| `NEXT_PUBLIC_DATA_MODE` | Client & Server | Yes | `firebase` for production or `mock` for local offline demo |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client & Server | Yes | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client | Yes | Firebase Authentication domain (`raskan-id.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client & Server | Yes | Firebase project identifier (`raskan-id`) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| Client | Yes | Firebase storage bucket (`raskan-id.firebasestorage.app`) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client | Yes | Firebase Web App ID |
| `PAYMENT_PROVIDER` | Server | Yes | `razorpay` for live payments or `mock` for testing |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client & Server | Yes | Razorpay Public Key (`rzp_live_...` or `rzp_test_...`) |
| `RAZORPAY_KEY_SECRET` | Server-Only | Yes | Razorpay Secret Key (Never expose to browser) |
| `RAZORPAY_WEBHOOK_SECRET` | Server-Only | Optional| Secret configured in Razorpay Dashboard for webhook signature verification |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Client & Server | Yes | 10-digit WhatsApp support number (`8595268400`) |
| `DEV_ADMIN_EMAIL` | Server-Only | Yes | Administrator login email |
| `DEV_ADMIN_PASSWORD` | Server-Only | Yes | Administrator password for owner portal |

---

## 💳 Razorpay Live Integration Guide

1. **Obtain API Keys:**
   * Log into your **[Razorpay Dashboard](https://dashboard.razorpay.com/)**.
   * Navigate to **Settings** → **API Keys** → **Generate Live Key**.
   * Copy the **Key ID** (`rzp_live_...`) and **Key Secret**.
2. **Configure Webhook:**
   * In Razorpay Dashboard, go to **Settings** → **Webhooks** → **Add New Webhook**.
   * **Webhook URL:** `https://vaishnavamart.com/api/payments/webhook`
   * **Secret:** Choose a strong secret and set it as `RAZORPAY_WEBHOOK_SECRET` in your environment.
   * **Active Events:**
     * `order.paid`
     * `payment.captured`
     * `payment.failed`

---

## 🌐 Vercel & GoDaddy Production Deployment

### Step 1: Deploy to Vercel
1. Import the repository `https://github.com/vaishnavmart/vaishnavmart` into Vercel.
2. Select framework **Next.js**.
3. Under **Environment Variables**, add all keys listed in the [Reference Table](#-environment-variables-reference).
4. Click **Deploy**.

### Step 2: Configure GoDaddy Custom Domain
1. In GoDaddy DNS Management for `vaishnavamart.com`, add the following DNS records:
   * **Type A Record:**
     * **Name / Host:** `@`
     * **Value:** `76.76.21.21`
     * **TTL:** `600 seconds` (or Default)
   * **Type CNAME Record:**
     * **Name / Host:** `www`
     * **Value:** `cname.vercel-dns.com`
     * **TTL:** `600 seconds`
2. In your Vercel Project Dashboard, navigate to **Settings** → **Domains**:
   * Add `vaishnavamart.com` (configured as primary).
   * Add `www.vaishnavamart.com` (redirects to `vaishnavamart.com`).
3. Vercel will automatically verify DNS propagation and issue a complimentary SSL/TLS Certificate.

---

## 🧪 Quality Assurance & Verification

```bash
# Run ESLint validation
npm run lint

# Compile production build
npm run build
```

Both commands pass with **0 errors and 0 warnings**.

---

## 👥 Authors & Stewardship

* **Founder & Lead Architect:** Yashveer Singh Rajpoot
* **Engineering & Technology:** [Yashveer Labs](https://vaishnavamart.com/yashveer-labs)
* **Parent Enterprise:** [Rajpoot Industries](https://vaishnavamart.com/rajpoot-industries)
* **Official Brand:** [रस Kan - True Vaishnav Standards](https://vaishnavamart.com)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
