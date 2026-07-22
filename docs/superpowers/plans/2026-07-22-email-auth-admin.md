# Email Auth and Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email verification login/registration, bind token billing to authenticated users, and provide an admin dashboard for viewing and editing user data.

**Architecture:** Store users, sessions, and email verification codes in `.local-data/*.json` following the current local JSON database pattern. Auth uses an HTTP-only session cookie. `ADMIN_EMAIL` determines the initial/admin account, and admin APIs verify the logged-in user role before exposing user management data.

**Tech Stack:** Next.js App Router route handlers, TypeScript, local JSON storage, React client components, Vitest.

---

### Task 1: Auth Store and Route Tests

**Files:**
- Create: `tests/auth/auth.test.ts`
- Modify: `tests/api/routes.test.ts`

- [ ] Write tests for requesting an email code, verifying the code, creating a user, setting a session cookie, and returning the current session user.
- [ ] Write tests that admin-only APIs reject non-admin sessions and allow an `ADMIN_EMAIL` user.
- [ ] Run `npm test -- tests/auth/auth.test.ts tests/api/routes.test.ts` and verify failures before implementation.

### Task 2: Auth Store and Email Code Delivery

**Files:**
- Create: `src/lib/auth/config.ts`
- Create: `src/lib/auth/store.ts`
- Create: `src/lib/auth/email.ts`
- Create: `src/lib/auth/http.ts`

- [ ] Implement user/session/code JSON stores.
- [ ] Implement six-digit verification codes with 10-minute expiry.
- [ ] Implement SMTP delivery when all SMTP env vars are present; otherwise store dev codes for local testing.

### Task 3: Auth API Routes

**Files:**
- Create: `src/app/api/auth/request-code/route.ts`
- Create: `src/app/api/auth/verify-code/route.ts`
- Create: `src/app/api/auth/me/route.ts`
- Create: `src/app/api/auth/logout/route.ts`

- [ ] Add register/login code request.
- [ ] Verify code, create user if needed, create session, set auth and billing cookies.
- [ ] Return current user and logout.

### Task 4: Bind Billing to Users

**Files:**
- Modify: `src/lib/billing/store.ts`
- Modify: `src/lib/billing/http.ts`
- Modify: `src/app/api/billing/status/route.ts`
- Modify: `src/app/api/report/route.ts`
- Modify: `src/app/api/chat/route.ts`

- [ ] Prefer authenticated user ID when present.
- [ ] Keep anonymous fallback for local testing but login becomes the primary path.

### Task 5: Login UI and Admin UI

**Files:**
- Create: `src/components/auth/AuthGate.tsx`
- Create: `src/components/auth/LoginPanel.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin/AdminDashboard.tsx`
- Modify: `src/app/page.tsx`

- [ ] Show login/register before the planning workspace.
- [ ] Show admin dashboard for role `admin`.
- [ ] Let admins view users, token balances, status, and role.

### Task 6: Admin APIs

**Files:**
- Create: `src/app/api/admin/users/route.ts`
- Modify: `src/app/api/admin/payment-requests/[id]/route.ts`

- [ ] List users with billing balances.
- [ ] Patch user status/role/token balance.
- [ ] Review payment requests using admin session role.

### Task 7: Documentation and Verification

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] Document `ADMIN_EMAIL`, SMTP env vars, and local dev code fallback.
- [ ] Run full verification and push.
