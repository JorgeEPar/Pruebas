# Planificación App Web Full-Stack - Proyecto Aprendizaje OpenCode

**Fecha:** 2026-09-21
**Repo:** https://github.com/JorgeEPar/Pruebas
**Sesión local:** `D:\pruebas\Pruebas`
**Estado git:** primer push OK (`1bb38e5 chore: setup inicial`). Rama `main` sincronizada con `origin/main`.

> Copia versionada del doc central en `C:\Users\Jorge\.opencode\plan\planificacion-app-web.md`.

## 1. Decisión GitHub vs GitLab

**SÍ, Railway funciona nativo con GitHub (combinación recomendada).**
- Railway → GitHub App → auto-deploy en cada push a `main`.
- GitLab sin integración nativa. **Decisión: GitHub.**

## 2. Stack fijo (de `stack1.md`)

- **Full-Stack:** Next.js (React + Node monorepo). Backend SOLO Route Handlers REST, prohibido Server Actions.
- **Render:** SSR (SEO) + SSG (landings).
- **DB:** PostgreSQL + Prisma.
- **Frontend:** shadcn/ui + React Hook Form + Zod (schemas compartidos en `lib/validations/`).
- **Servicios:** Better Auth + Brevo (emails) + Spaces S3 (archivos, nunca en DB).
- **Deploy:** Railway + CI/CD en push a `main`.

## 3. Roadmap

### Fase 1 - Setup entorno OpenCode
- [x] Skills: `nextjs-15`, `typescript`, `tailwind-4`, `zod-4` (verificados 2026-09-21)
- [ ] MCPs: postgres, railway, github (pendiente `.opencode.json`)
- [ ] ESLint + Prettier (pendiente)
- [ ] Branches `main/develop/feature/*` (solo `main` existe)
- [ ] Pipeline push `main` → Railway (pendiente)

### Fase 2 - Construcción MVP
1. Proponer 3 ideas de negocio (auth + S3 + Brevo + CRUD Prisma).
2. Usuario elige 1.
3. Definir carpetas, modelo Prisma, rutas API/UI, componentes shadcn.
4. Implementar por milestones con validación.

## 4. Auditoría entorno (2026-09-21)

- Base OK: Node `v24.21.0`, npm `11.19.0`, git `2.44`, OpenCode `v2.0.12`.
- Docker `25.0.3` instalado, daemon apagado → abrir Docker Desktop.
- Repo sin `package.json` (app aún no creada).
- **Decisión DB local: Docker** con `docker-compose.yml` (PostgreSQL). Neon descartado.

## 5. Próximo paso

1. Abrir Docker Desktop.
2. Scaffold Next.js + TS + Tailwind + shadcn + Prisma + Zod + RHF.
3. Añadir `docker-compose.yml`, `.env.example`, ESLint/Prettier, `.opencode.json` con MCPs.
4. Proponer las 3 ideas de negocio.
