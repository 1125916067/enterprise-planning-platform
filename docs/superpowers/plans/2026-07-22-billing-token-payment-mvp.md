# Billing Token Payment MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add server-side DeepSeek token metering, a 500-token free trial, and a QR-code recharge flow where 5 CNY payment submissions can be approved by an admin to grant 10000 tokens.

**Architecture:** Keep the DeepSeek key server-only in environment variables. Store local MVP billing data in `.local-data/billing.json`, identify users with an HTTP-only cookie, and gate `/api/report` plus `/api/chat` before and after DeepSeek calls. Use a manual QR proof submission flow now, with data structures that can later be connected to a real WeChat Pay merchant callback.

**Tech Stack:** Next.js App Router route handlers, TypeScript, local JSON storage, Vitest, React client components.

---

### Task 1: Billing Domain and API Tests

**Files:**
- Create: `tests/billing/billing.test.ts`
- Modify: `tests/api/routes.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that assert:
- a new billing account starts with 500 tokens;
- a pending payment request can be approved with `ADMIN_TOKEN`;
- approving a 5 CNY request grants 10000 tokens;
- `/api/report` and `/api/chat` reject requests when balance is insufficient.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/billing/billing.test.ts tests/api/routes.test.ts`
Expected: FAIL because billing modules and routes do not exist yet.

### Task 2: Billing Storage and Route Handlers

**Files:**
- Create: `src/lib/billing/config.ts`
- Create: `src/lib/billing/store.ts`
- Create: `src/lib/billing/tokens.ts`
- Create: `src/app/api/billing/status/route.ts`
- Create: `src/app/api/billing/payment-requests/route.ts`
- Create: `src/app/api/admin/payment-requests/[id]/route.ts`

- [ ] **Step 1: Implement local billing ledger**

Create helpers for accounts, charges, payment requests, token estimates, and admin approval.

- [ ] **Step 2: Run billing tests**

Run: `npm test -- tests/billing/billing.test.ts`
Expected: PASS.

### Task 3: Meter DeepSeek Calls

**Files:**
- Modify: `src/app/api/report/route.ts`
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/lib/ai/deepseek.ts`

- [ ] **Step 1: Gate before calling DeepSeek**

Estimate input tokens from prompt text and reject when the account balance is not enough.

- [ ] **Step 2: Charge after DeepSeek output**

Deduct estimated input and output tokens after successful DeepSeek generation. If a repair call is needed, include its text cost too.

- [ ] **Step 3: Run API tests**

Run: `npm test -- tests/api/routes.test.ts`
Expected: PASS.

### Task 4: Payment UI and QR Asset

**Files:**
- Create: `public/payments/wechat-pay.jpg`
- Create: `src/components/planning/BillingPanel.tsx`
- Modify: `src/components/planning/PlanningWorkspace.tsx`

- [ ] **Step 1: Add payment panel**

Show remaining token balance, 500-token trial notice, the WeChat QR image, and a form for payer name/contact/payment note.

- [ ] **Step 2: Run component tests**

Run: `npm test -- tests/components/planning-workspace.test.tsx`
Expected: PASS with coverage for billing UI and payment request submission.

### Task 5: Documentation, Verification, Push

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Document billing env vars**

Document `DEEPSEEK_API_KEY` as server-only and add `ADMIN_TOKEN` for approving payment requests.

- [ ] **Step 2: Full verification**

Run:
- `npm run typecheck`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm audit --audit-level=moderate --registry=https://registry.npmjs.org`
- `git grep -n -E "DEEPSEEK_API_KEY=sk-|Bearer sk-" HEAD`

Expected: all verification passes and no real key is committed.
