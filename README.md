# শিখাBD — AI শিক্ষক (EdTech MVP)

AI-powered learning platform for NCTB Class 9-10 students in Bangladesh. Covers Physics, Chemistry, Mathematics, and Higher Mathematics with Bangla AI tutoring.

## Features

- 🤖 **AI Q&A** — Ask any question in Bangla, get answers powered by NVIDIA NIM
- 🔍 **Smart Search** — Search across NCTB textbooks by chapter and topic
- 📚 **AI-Generated Lessons** — Structured lessons with examples and practice problems
- 📱 **PWA** — Works on mobile browser, installs like a native app on Android
- 🛡️ **Admin Dashboard** — Manage lessons, track analytics, monitor content gaps

## Tech Stack

| Layer | Technology | Free Tier |
|-------|-----------|----------|
| Frontend | React + TypeScript + Tailwind CSS | Vercel (unlimited) |
| Backend | Hono + tRPC | Cloudflare Workers |
| Database | Supabase PostgreSQL + pgvector | 500MB, 1GB bandwidth |
| AI | NVIDIA NIM (Nemotron-3-Super-120B) | 1,000-5,000 free credits |
| Auth | Supabase Auth | 50,000 MAU free |

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Roughyet/edtech-bd-mvp.git
cd edtech-bd-mvp
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your keys.

### 3. Database Setup

Run the SQL migration in Supabase SQL Editor.

### 4. Download & Process Books

```bash
pip install pdfplumber openai supabase-python
python scripts/download_books.py
python scripts/process_books.py
python scripts/upload_to_supabase.py
```

### 5. Development

```bash
npm run dev    # Start at http://localhost:3000
npm run build  # Production build
```

## Subjects (Class 9-10)

- ⚛️ পদার্থবিজ্ঞান (Physics)
- 🧪 রসায়ন (Chemistry)
- 📐 গণিত (Mathematics)
- ∫ উচ্চতর গণিত (Higher Mathematics)

## License

MIT
