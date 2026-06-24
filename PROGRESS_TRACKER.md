# LUMEN — Production-Readiness Fix · Progress Tracker

> Source: LUMEN_ProductionFix_Prompts.md (Claude's 8-phase plan)
> Repo: /Users/ravan/Documents/perf
> Legend: `[ ]` pending · `[~]` in progress · `[x]` done · `[!]` blocked (needs your action)

---

## Phase 0 — Emergency Secret Cleanup  (YOU do this — manual)

- [x] P0.1 Rotate Razorpay key secret in dashboard  ✓ done (old secret gone from .env, new keys in place)
- [x] P0.2 `git rm --cached apps/backend/.env`  ✓ untracked
- [x] P0.3 Add `.env` + `.env.*` + `!.env.example` to root `.gitignore`  ✓ done
- [x] P0.4 Scrub git history: `git filter-repo --path apps/backend/.env --invert-paths` + force-push  ✓ done (local + remote verified clean)
- [!] P0.5 YOU: Set `VITE_API_URL` in Vercel/hosting env (currently missing → checkout falls back to `localhost:3000`)
- [x] P0.6 Superadmin password `Admin@1999` will be REMOVED in Phase 1.2 (line deleted, not changed)

---

## Phase 1 — In-Repo Security Fixes

### 1.1 Backend security (apps/backend/src/index.ts)
- [x] P1.1.1 Timing-safe HMAC compare via `crypto.timingSafeEqual` (currently `===` at index.ts:63)  ✓
- [x] P1.1.2 Validate `amount`: finite, >0, ≤500000 (currently unvalidated, ×100 at index.ts:28-35)  ✓
- [x] P1.1.3 Add `helmet`  ✓
- [x] P1.1.4 Add `express-rate-limit` on `/api/create-order` (20 req / 15 min)  ✓
- [x] P1.1.5 Explicit CORS allowlist from `FRONTEND_URL` (currently `cors()` open)  ✓
- [x] P1.1.6 Error-handling middleware (console.error + 500 JSON)  ✓
- [x] P1.1.7 Add `helmet`, `express-rate-limit`, `cors` to dependencies  ✓

### 1.2 Admin: remove hardcoded credentials (apps/admin/src/App.tsx)
- [x] P1.2.1 Remove hardcoded superadmin block at App.tsx:59 (`phone === '7972272861' && password === 'Admin@1999'`)  ✓ REMOVED
- [x] P1.2.2 Replace `localStorage.getItem('adminAuth') === 'true'` (App.tsx:25-27) with session object + expiry check (`isSessionValid()`)  ✓ 8h session + 60s expiry interval
- [x] P1.2.3 Password input `type="password"` (App.tsx:846, currently `type="text"`)  ✓ Admin.tsx:818, 838 + EditAdminModal:88
- [x] P1.2.4 Remove all `localStorage.getItem('adminAuth')` usages → `isSessionValid()`  ✓

### 1.3 Admin: hash passwords with bcrypt
- [x] P1.3.1 Install `bcryptjs` + `@types/bcryptjs` (apps/admin)  ✓
- [x] P1.3.2 Login comparison: fetch by phone, `bcrypt.compare` against `password_hash` (App.tsx:69)  ✓
- [x] P1.3.3 New admin insert: `bcrypt.hash(pw, 12)` → `password_hash` (Admin.tsx:247-251)  ✓
- [x] P1.3.4 Edit admin password: hash before update (EditAdminModal.tsx:46)  ✓ (optional field)
- [x] P1.3.5 Migration `supabase/migrations/001_hash_passwords.sql` (add `password_hash` column, migrate existing)  ✓
- [!] P1.3.6 YOU: hash existing admin passwords in DB (run migration 001 in Supabase SQL editor)

### 1.4 CI pipeline (.github/workflows/deploy.yml)
- [x] P1.4.1 Bump to `actions/checkout@v4` + `setup-node@v4`  ✓
- [x] P1.4.2 Matrix strategy across `frontend`, `admin`, `backend`  ✓
- [x] P1.4.3 Add `npx tsc --noEmit` step per app  ✓
- [x] P1.4.4 Add `npm run lint --if-present` step per app  ✓
- [x] P1.4.5 Add test job (graceful skip if none)  ✓
- [x] P1.4.6 Deploy step remains commented (until Phase 0 done)  ✓
- [x] P1.4.7 Add `.nvmrc` with `20`  ✓
- [x] P1.4.8 Add root `package.json` `lint`/`typecheck`/`test` scripts delegating per-workspace  ✓

---

## Phase 2 — Backend Hardening

- [x] P2.1 Install `zod`, `pino`, `pino-http` (apps/backend)  ✓
- [x] P2.2 Create `apps/backend/src/schemas.ts` (`CreateOrderSchema`, `VerifyPaymentSchema` with full `orderData`)  ✓
- [x] P2.3 Apply Zod validation middleware on both endpoints  ✓
- [x] P2.4 Replace `console.*` with pino logger  ✓ (structured JSON logs)
- [x] P2.5 Add `GET /health` returning `{status, ts}`  ✓
- [x] P2.6 Create `apps/backend/Dockerfile` (node:20-alpine, non-root user, healthcheck)  ✓
- [x] P2.7 Create `apps/backend/.env.example`  ✓ (done in Phase 3)
- [x] P2.8 Add `lint`, `test`, `typecheck` scripts to `apps/backend/package.json`  ✓
- [x] P2.9 Add ESLint config to `apps/backend`  ✓ (eslint.config.mjs)

---

## Phase 3 — Env + Config Hygiene

### 3.1 Env validation
- [x] P3.1.1 `apps/frontend/src/lib/env.ts` (Zod schema: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_FIREBASE_*, VITE_API_URL, VITE_RAZORPAY_KEY_ID)  ✓
- [x] P3.1.2 Import `./lib/env` as first import in `apps/frontend/src/main.tsx`  ✓
- [x] P3.1.3 Replace raw `import.meta.env.VITE_*` in frontend `supabase.ts`, `firebase.ts`, `CheckoutWizard.tsx` (lines 237, 268), `App.tsx:37` → `env.*`  ✓
- [x] P3.1.4 `apps/frontend/.env.example`  ✓
- [x] P3.1.5 `apps/admin/src/lib/env.ts` (schema minus RAZORPAY/API_URL)  ✓
- [x] P3.1.6 `apps/admin/.env.example`  ✓

### 3.2 Remove committed artifacts
- [x] P3.2.1 `git rm -r --cached apps/admin/dist apps/frontend/dist apps/backend/dist`  ✓ (none tracked)
- [x] P3.2.2 `git rm --cached apps/*/package-lock.json` (keep root)  ✓ admin + frontend
- [x] P3.2.3 `git rm --cached **/.DS_Store`  ✓ (none tracked)
- [x] P3.2.4 Confirm `dist/`, `.DS_Store`, `.env`, `.env.*`, `!.env.example` in root `.gitignore`  ✓

---

## Phase 4 — Data Integrity (MOST CRITICAL)

### 4.1 Move order creation to backend
- [x] P4.1.1 Install `@supabase/supabase-js` (apps/backend)  ✓
- [x] P4.1.2 Create `getSupabaseAdmin()` lazy client (server-only) in backend  ✓
- [x] P4.1.3 Update `VerifyPaymentSchema` to include full `orderData` payload  ✓
- [x] P4.1.4 `/api/verify-payment`: after signature verify, INSERT order via `getSupabaseAdmin()` → return `{success, orderId}`  ✓
- [x] P4.1.5 On order write failure: return 500 with `razorpay_payment_id` (do NOT return success)  ✓
- [x] P4.1.6 Remove client-side Supabase order insert in `CheckoutWizard.tsx:281-287`  ✓ (prepaid + COD)
- [x] P4.1.7 Frontend uses the returned `orderId` + `fetchOrders()` to refresh  ✓
- [x] P4.1.8 Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` to backend `.env.example`  ✓
- [x] P4.1.9 New `/api/create-cod-order` endpoint for COD orders (server-side persistence)  ✓
- [x] P4.1.10 Remove `createOrder` from `useOrderStore` (dead code — backend persists now)  ✓

### 4.2 Fix race conditions with Supabase RPCs
- [x] P4.2.1 Migration `002_increment_rpcs.sql`: `increment_visitor()`, `increment_coupon_uses(code)`  ✓
- [x] P4.2.2 `useSiteStore.incrementVisitor` → `supabase.rpc('increment_visitor')` (frontend + admin, with fallback)  ✓
- [x] P4.2.3 Coupon increment moved to backend (in verify-payment + create-cod-order handlers)  ✓

---

## Phase 5 — Correctness Fixes

- [x] P5.1 Remove fake ratings: `useProductStore.ts:35-36` → `rating ?? null`, `reviewsCount ?? 0` (frontend + admin)  ✓
- [x] P5.2 Hide rating UI in `ProductCard` when `rating === null`  ✓
- [x] P5.3 Fix Contact form: `Contact.tsx:25` → submit to Supabase `contact_messages` + status UI  ✓
- [x] P5.4 Migration `003_contact_messages.sql` (table + RLS: anon insert only)  ✓
- [x] P5.5 Replace `resetProducts` "Hack to delete all" (`useProductStore.ts:96-112`) with RPC `reset_products(jsonb)`  ✓ (with fallback)
- [x] P5.6 Migration `004_reset_products_rpc.sql`  ✓
- [x] P5.7 Strip dead storefront code from `apps/admin`  ✓ (already only routes to Admin, dead pages not imported)

---

## Phase 6 — Shared Package + Supabase Types

- [x] P6.1 Create `packages/shared/package.json` (`@lumen/shared`)  ✓
- [x] P6.2 Create `packages/shared/tsconfig.json`  ✓
- [x] P6.3 `packages/shared/src/index.ts` barrel export  ✓ (types for now; lib/data move deferred to avoid import churn)
- [x] P6.5 Add `@lumen/shared: "*"` dep to both apps' `package.json`  ✓
- [x] P6.6 Supabase types stub → `packages/shared/src/types/db.ts`  ✓ (regenerate with `supabase gen types`)
- [x] P6.9 Migration `005_rls_policies.sql`: RLS on products, orders, profiles, admin_users (no anon), coupons, site_settings, contact_messages  ✓
- [!] P6.10 YOU: apply RLS migration in Supabase SQL editor + move admin login to backend
- [~] P6.4/P6.7/P6.8 Move shared lib/data + replace `any` — deferred (larger refactor, current code works)

---

## Phase 7 — Tests + Monitoring

### 7.1 Backend tests (Vitest)
- [ ] P7.1.1 Install `vitest`, `supertest`, `@types/supertest` (apps/backend)
- [ ] P7.1.2 Split Express app into `app.ts` (testable) + `index.ts` (listen)
- [ ] P7.1.3 Tests: `/api/create-order` valid amount, zero, negative, non-numeric, over-max
- [ ] P7.1.4 Tests: `/api/verify-payment` valid sig, invalid sig, missing orderData
- [ ] P7.1.5 Add `test`, `test:watch`, `test:coverage` scripts

### 7.2 Frontend store tests (Vitest)
- [ ] P7.2.1 Install `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `@vitest/coverage-v8` (apps/frontend)
- [ ] P7.2.2 Vite test config (environment: jsdom, globals, setupFiles)
- [ ] P7.2.3 `setup.ts` (mock `@lumen/shared`)
- [ ] P7.2.4 `useCartStore` tests: add, duplicate qty, stock limit, remove, total, clear
- [ ] P7.2.5 `useCouponStore` tests: valid, expired, usage limit, min order

### 7.3 Sentry monitoring
- [ ] P7.3.1 Install `@sentry/react` (frontend + admin)
- [ ] P7.3.2 Init Sentry in `main.tsx` (DSN from env, prod-only, replay integration, PII scrub)
- [ ] P7.3.3 `ErrorBoundary` via `Sentry.withErrorBoundary` with fallback UI
- [ ] P7.3.4 Wrap `App` in `ErrorBoundary`
- [ ] P7.3.5 Add `VITE_SENTRY_DSN` to `.env.example` (both apps)
- [ ] P7.3.6 Wrap payment flow in `Sentry.startSpan` (CheckoutWizard)

---

## Phase 8 — Frontend Polish (Light English Theme)

### Design system tokens
- [ ] P8.0.1 Install `@fontsource/dm-sans`, `@fontsource/cormorant-garamond`, `@fontsource/dm-mono`
- [ ] P8.0.2 Import fonts in `main.tsx`
- [ ] P8.0.3 Replace CSS vars in `index.css` with light English palette (`--colour-bg: #F8F6F2`, oxford `#1E3A5F`, copper `#B87333`, sage `#3A6B52`, claret `#9B2335`, etc.)
- [ ] P8.0.4 Add typography (Cormorant Garamond display, DM Sans body), spacing/radius/shadow tokens
- [ ] P8.0.5 Replace hardcoded dark colours / `#C9A84C` gold across components

### 8.2 Payment error handling + idempotency
- [ ] P8.2.1 `paymentState` machine: idle | initiating | processing | success | failed
- [ ] P8.2.2 Razorpay `modal.ondismiss` → reset to idle + user message
- [ ] P8.2.3 `rzp.on('payment.failed')` → set failed + error description
- [ ] P8.2.4 Disable Pay button when not idle; `aria-busy`; dynamic label
- [ ] P8.2.5 Firebase `browserLocalPersistence` to survive reload mid-checkout

### 8.3 Accessibility + security headers + SEO
- [ ] P8.3.1 Install `focus-trap-react`
- [ ] P8.3.2 Wrap AuthModal, CartDrawer, PopupModal in `FocusTrap` + `role="dialog"` + `aria-modal`
- [ ] P8.3.3 Esc-to-close on all modals
- [ ] P8.3.4 `apps/frontend/vercel.json` security headers (X-Frame, CSP, Referrer-Policy, Permissions-Policy)
- [ ] P8.3.5 Install `react-helmet-async` + wrap app in `HelmetProvider`
- [ ] P8.3.6 Per-page SEO: Home, ProductDetail (title, desc, og, canonical, product:price)
- [ ] P8.3.7 Product images: `loading="lazy"`, `decoding="async"`, width/height (eager for hero)

### 8.4 Gallery store → Supabase Storage
- [ ] P8.4.1 Rewrite `useGalleryStore.uploadMedia` → upload to `lumen-media` bucket, store public URL (not base64)
- [ ] P8.4.2 `deleteMedia` → remove from Storage + state
- [ ] P8.4.3 Migration `006_storage_bucket.sql` (bucket + RLS: admin upload, public read)
- [ ] P8.4.4 One-time migration script `scratch/migrate_gallery.ts` (base64 → Storage)

---

## Final Launch Checklist

### Security (all must be ✅)
- [ ] Razorpay key rotated, old revoked
- [ ] `apps/backend/.env` purged from git history
- [ ] All `.env` in `.gitignore`
- [ ] Admin hardcoded credentials removed
- [ ] Admin passwords hashed (bcrypt, rounds 12)
- [ ] localStorage auth replaced with session + expiry
- [ ] `type="password"` on all password inputs
- [ ] Supabase RLS enabled on ALL tables
- [ ] `admin_users` inaccessible from anon key
- [ ] HMAC uses `crypto.timingSafeEqual`
- [ ] Helmet + rate limiting on backend
- [ ] `VITE_API_URL` set in prod env
- [ ] Security headers in `vercel.json`

### Data Integrity (all must be ✅)
- [ ] Orders written by backend (service role), not frontend (anon)
- [ ] `increment_visitor` + `increment_coupon_uses` use Supabase RPCs
- [ ] Product reset uses transactional RPC
- [ ] Payment failure: error message shown, spinner cleared
- [ ] Pay button disabled after first click

### Correctness (all must be ✅)
- [ ] Contact form submits to `contact_messages`
- [ ] Fake ratings removed (null until real data)
- [ ] Dead admin code removed from frontend bundle
- [ ] `VITE_API_URL` validated at startup (Zod)

### Quality (all must be ✅)
- [ ] Supabase types generated, `any` replaced
- [ ] Backend tests passing (create-order, verify-payment)
- [ ] Frontend cart store tests passing
- [ ] Sentry init in prod builds only
- [ ] CI runs typecheck + lint + build
- [ ] All modals: focus trap, Esc-to-close, aria-modal
- [ ] Product images: lazy + dimensions

### Readiness score targets
| App      | Current | Target |
|----------|---------|--------|
| frontend | ~60%    | ≥ 90%  |
| admin    | ~30%    | ≥ 85%  |
| backend  | ~20%    | ≥ 85%  |
| shared   | 0%      | 100%   |

---

## Notes / Decisions Log

(empty — record decisions, blockers, and deviations here as work progresses)