# Pruebas — Proyecto Aprendizaje OpenCode

App web full-stack para aprender OpenCode desde cero (Next.js + PostgreSQL + Prisma).

## Stack
- Next.js (Route Handlers REST, SSR/SSG) — sin Server Actions
- PostgreSQL + Prisma
- shadcn/ui + React Hook Form + Zod
- Better Auth + Brevo + Spaces S3
- Deploy: Railway + GitHub CI/CD

## Docs
- `docs/planificacion-app-web.md` — planificación Fase 1/2.

## Requisitos
- Node 20+ · Docker Desktop

## Setup
```bash
cp .env.example .env
docker compose up -d db
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---
*Debajo, README original de `create-next-app`.*

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
