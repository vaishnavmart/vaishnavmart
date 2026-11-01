# Security Policy

## Reporting Security Vulnerabilities

The Vaishnava Mart engineering team takes security and data integrity with the highest priority. If you discover a security vulnerability or sensitive information exposure, please report it responsibly.

**DO NOT file a public issue on GitHub.**

Instead, please send an encrypted or direct email to:
* **Security Contact:** [raskanfood@gmail.com](mailto:raskanfood@gmail.com)
* **Subject:** `[SECURITY] Potential Vulnerability Report - Vaishnava Mart`

### What to include in your report:
1. Detailed description of the vulnerability.
2. Steps to reproduce the issue (proof-of-concept scripts, HTTP requests, or screenshots).
3. The affected endpoints, files, or components.
4. An assessment of potential impact.

We will acknowledge receipt of your report within 24 hours, perform an investigation, and provide regular status updates until the vulnerability is remediated.

## Security Architecture & Practices

### Payment Security (Razorpay)
* **Server-side Execution:** All Razorpay orders are generated exclusively via secure server-side API routes (`/api/payments/create-order`).
* **Timing-Safe HMAC Verification:** All payment signatures and webhook signatures are validated server-side using constant-time cryptographic verification (`crypto.timingSafeEqual`) to prevent side-channel timing attacks.
* **Credentials Isolation:** Private keys (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) are never bundled into frontend assets or exposed to the client.

### Authentication & Sessions
* **Owner / Superadmin Sessions:** Authenticated through HTTP-only, secure, `SameSite=Lax` cookies.
* **Firebase Identity & Firestore:** Protected with security rules and allium-grade clean access controls.

### HTTP Security Headers
The application enforces strict security headers on all responses:
* `X-Frame-Options: SAMEORIGIN` (Clickjacking mitigation)
* `X-Content-Type-Options: nosniff` (MIME-type sniffing mitigation)
* `X-XSS-Protection: 1; mode=block`
* `Referrer-Policy: strict-origin-when-cross-origin`
* `Permissions-Policy: camera=(), microphone=(), geolocation=()`
