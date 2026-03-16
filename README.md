# SymptomAnalyzer

A medical diagnostic assessment tool for healthcare professionals.

## What It Does

Users score patients across configurable categories (symptom severity, functional impact, duration, frequency, associated factors) using 1–10 sliders. The system runs scores through **OpenAI GPT-4o** and returns a structured risk assessment with explanations and recommendations.

## Features

- 🩺 AI-powered diagnostic analysis (GPT-4o)
- 📊 Configurable assessment categories
- 🔒 Freemium model (2 free/month → paid unlimited)
- 💳 Subscription payments via Paystack
- 📧 Email notifications via SendGrid
- 📱 React Native mobile app (Expo)
- 🌐 Web app (React + Vite)

## Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo / React Native |
| Web Frontend | React + Vite + Shadcn/UI + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| AI | OpenAI GPT-4o |
| Payments | Paystack |
| Email | SendGrid |

## Setup

```bash
cp .env.example .env
# Fill in your environment variables

npm install
npx drizzle-kit migrate
npm run dev
```

## Environment Variables

See `.env.example` for all required variables.

## Documentation

- [Architecture Map](docs/architecture_map.md)
- [Rebuild Guide](docs/rebuild_guide.md)
