# Contributing to Vaishnava Mart

Thank you for your interest in contributing to **Vaishnava Mart**! We are committed to engineering a world-class devotional e-commerce experience adhering to the highest standards of code quality, security, and visual elegance.

---

## Code of Conduct

All contributors, maintainers, and community members are expected to uphold respectful, inclusive, and professional communication at all times.

---

## Development Workflow

### 1. Prerequisites
* **Node.js:** v20.x or higher
* **npm:** v10.x or higher
* **Git**

### 2. Fork & Clone
```bash
git clone https://github.com/vaishnavmart/vaishnavmart.git
cd vaishnavmart
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your local or test credentials.

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Quality Standards

Before submitting a Pull Request, verify:
1. **ESLint:** Run `npm run lint` — must pass with **0 warnings and 0 errors**.
2. **TypeScript:** All types must be strictly typed without `any` bypasses where avoidable.
3. **Build:** Run `npm run build` — must compile all routes with clean production chunks.
4. **No Secrets:** Never commit `.env`, `.env.local`, API keys, or private secrets.

---

## Pull Request Guidelines

1. Create a feature branch with descriptive naming:
   ```bash
   git checkout -b feat/payment-receipt-enhancement
   ```
2. Commit with conventional commit messages:
   * `feat: ...` for new features
   * `fix: ...` for bug fixes
   * `style: ...` for UI/styling refinements
   * `docs: ...` for documentation updates
   * `perf: ...` for performance optimizations
3. Push to your branch and open a Pull Request against `main`.
4. Provide a clear summary and screenshots if UI changes were made.
