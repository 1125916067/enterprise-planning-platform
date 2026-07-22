# Enterprise Planning Platform

An internal enterprise planning workspace powered by DeepSeek. The app helps teams turn product and business inputs into structured planning reports, follow-up analysis, and exportable planning artifacts for local review.

## Features

- Professional product input form for capturing business, market, product, budget, and timeline details.
- DeepSeek-generated planning report with conservative, growth, and risk perspectives.
- Right-side follow-up assistant for asking contextual questions about the current plan.
- Structured planning boards for cost, launch, recruitment, promotion, and task workstreams.
- Knowledge upload support for text, Markdown, CSV, `.xlsx` Excel, Word, and PDF files. Legacy `.xls` files should be saved as `.xlsx` before upload.
- PDF, Word, and Excel exports for sharing generated reports and planning data.
- Server-side token billing with a 500-token trial, QR-code recharge submission, and admin approval for 10000-token packs.
- Email verification login/registration with an admin user dashboard for user status, roles, and token balances.

## Local Setup

Use Node.js 20.19 or newer. Node.js 22.12 or newer is also supported by the Vite/Vitest toolchain used in this project.

```bash
git clone <your-repo-url>
cd enterprise-planning-platform
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Configure `.env.local` with the DeepSeek server-side credentials and model settings:

```bash
DEEPSEEK_API_KEY=your_deepseek_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
ADMIN_TOKEN=choose_a_private_admin_token
ADMIN_EMAIL=admin@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM="Enterprise Planning <noreply@example.com>"
```

The API key is read only by server routes. Do not commit `.env.local` or any file containing a real DeepSeek key.

`ADMIN_EMAIL` becomes an administrator when that email signs in. If SMTP settings are missing, verification codes are not emailed; local development codes can be read from `.local-data/email-codes.json`.

## Local Data

The app stores local runtime data in `.local-data/`. This directory is ignored by Git, along with `.env.local`, build outputs, logs, coverage, and dependency folders. Treat `.local-data/` as local developer state rather than source-controlled project content.

Local auth data is stored in:

- `.local-data/users.json`
- `.local-data/sessions.json`
- `.local-data/email-codes.json`

## Token Billing

- New visitors receive 500 trial tokens through a server-issued `planning_user_id` cookie.
- Report generation and follow-up chat are checked against the server-side token balance before DeepSeek is called.
- Successful AI calls deduct an estimated token cost from `.local-data/billing.json`.
- The bundled payment flow uses a WeChat QR collection image plus payment proof submission. Because a personal collection QR code has no reliable server callback, payment requests remain pending until an admin approves them.
- Approve a payment request by calling `POST /api/admin/payment-requests/{id}` with JSON such as `{ "action": "approve", "adminToken": "your_admin_token" }`. Approval grants 10000 tokens for the 5 CNY pack.

For fully automatic recharge, replace the manual payment request approval with an official payment provider such as WeChat Pay Merchant API. The provider callback must verify signatures, order id, amount, and duplicate notifications before adding tokens.

## Admin Dashboard

Sign in with the email configured in `ADMIN_EMAIL`, then open `/admin`. Admin users can view registered users, update user status, change roles, and set token balances.

## Exports

- PDF export creates a portable report suitable for review, printing, and offline sharing.
- Word export creates an editable document version of the generated planning report.
- Excel export creates spreadsheet-friendly planning data for financial, launch, hiring, promotion, and task tracking workflows.

## Security Notes

- Rotate shared DeepSeek keys regularly, especially after demos, handoffs, or contractor access.
- Keep real API keys in `.env.local` or a deployment secret manager only.
- Review all generated business, legal, tax, and compliance suggestions with qualified stakeholders before making final decisions.
