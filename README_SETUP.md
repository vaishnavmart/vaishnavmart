# Vaishnava Mart (रस Kan) - Setup & Environment Configuration Guide

This guide explains how to run the project in development mode and how to configure live production services (**Firebase**, **Razorpay**, **Vercel**, and **GoDaddy DNS**).

---

## 1. Quick Start in Development Mode

The project is built with dual data modes (`mock` and `firebase`). In `mock` mode, the complete storefront, cart, checkout, mock payment, order placement, customer account, and Super Admin CMS operate seamlessly with **zero external credentials required**.

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open in your browser
http://localhost:3000
```

---

## 2. Superadmin Owner Portal Access

To access the Super Admin Dashboard:
1. Navigate directly to `/owner-login` or click the subtle lock icon in the footer.
2. Log in using the administrator credentials configured in your environment (`DEV_ADMIN_EMAIL` and `DEV_ADMIN_PASSWORD`).
3. You will be authenticated and redirected into `/admin`.

---

## 3. Environment Variables Overview (`.env.local`)

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | Public | Canonical URL (`https://vaishnavamart.com`) |
| `NEXT_PUBLIC_DATA_MODE` | Public | Data provider mode (`firebase` or `mock`) |
| `PAYMENT_PROVIDER` | Private | Payment engine (`razorpay` or `mock`) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public | Live/Test Razorpay Public Key ID |
| `RAZORPAY_KEY_SECRET` | Private | Live/Test Razorpay Private Secret (Server only) |
| `RAZORPAY_WEBHOOK_SECRET` | Private | Razorpay Webhook Secret for HMAC verification |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public | Firebase Project Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public | `raskan-id.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public | `raskan-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| Public | `raskan-id.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public | Firebase Web App Identifier |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Public | Business WhatsApp support number (`8595268400`) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public | Customer support email (`raskanfood@gmail.com`) |
| `DEV_ADMIN_EMAIL` | Private | Owner portal administrator email |
| `DEV_ADMIN_PASSWORD` | Private | Owner portal administrator password |

---

## 4. Documentation Directory

* [Technical Architecture](docs/architecture.md)
* [Firebase Setup Guide](docs/firebase-setup.md)
* [Razorpay Payment Gateway Setup](docs/payment-setup.md)
* [ImageKit Setup](docs/imagekit-setup.md)
