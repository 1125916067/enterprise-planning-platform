# Enterprise Planning Platform

An internal enterprise planning workspace powered by DeepSeek. The app helps teams turn product and business inputs into structured planning reports, follow-up analysis, and exportable planning artifacts for local review.

## Features

- Professional product input form for capturing business, market, product, budget, and timeline details.
- DeepSeek-generated planning report with conservative, growth, and risk perspectives.
- Right-side follow-up assistant for asking contextual questions about the current plan.
- Structured planning boards for cost, launch, recruitment, promotion, and task workstreams.
- Knowledge upload support for text, Markdown, CSV, Excel, Word, and PDF files.
- PDF, Word, and Excel exports for sharing generated reports and planning data.

## Local Setup

```bash
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
```

The API key is read only by server routes. Do not commit `.env.local` or any file containing a real DeepSeek key.

## Local Data

The app stores local runtime data in `.local-data/`. This directory is ignored by Git, along with `.env.local`, build outputs, logs, coverage, and dependency folders. Treat `.local-data/` as local developer state rather than source-controlled project content.

## Exports

- PDF export creates a portable report suitable for review, printing, and offline sharing.
- Word export creates an editable document version of the generated planning report.
- Excel export creates spreadsheet-friendly planning data for financial, launch, hiring, promotion, and task tracking workflows.

## Security Notes

- Rotate shared DeepSeek keys regularly, especially after demos, handoffs, or contractor access.
- Keep real API keys in `.env.local` or a deployment secret manager only.
- Review all generated business, legal, tax, and compliance suggestions with qualified stakeholders before making final decisions.
