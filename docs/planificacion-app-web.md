# Planificación — Contenido IA para agencias/creadores

**Actualizado:** 2026-09-24
**Repo:** https://github.com/JorgeEPar/Pruebas (`main`, commits convencionales)
**Sesión local:** `D:\pruebas\Pruebas`
**Negocio elegido:** servicio de generación de contenido (texto/audio → ideas + copys por red) para agencias y creadores. Solo dev.

## 1. Stack real (lo instalado, no lo planeado)

- **Full-Stack:** Next.js 16 + React 19 + TS (Route Handlers, sin Server Actions) + Tailwind 4 + shadcn/ui + lucide-react.
- **Validación:** Zod compartida front/back (`src/lib/validations/`). Forms: React Hook Form.
- **DB:** PostgreSQL 16 en Docker + Prisma 6 (v6.19.3 fijado; npm trae la 8 RC por defecto).
- **IA:** AI SDK v7 + `@ai-sdk/google`. Modelo default `gemini-3.5-flash-lite` (el 2.5 retirado, el 3.6 free limitado a ~20 req). Abstracción en `src/lib/ai/provider.ts` (`server-only`, cambio de modelo por env).
- **Acceso:** códigos de invitación (`InviteCode`: usos, revocación) + cookie httpOnly. Sin Better Auth todavía (fase posterior: magic link + Google OAuth).
- **CI:** GitHub Actions lint + build en push/PR. Deploy pendiente (candidatos: Koyeb + Neon o Render; Railway sin free tier, descartado para pruebas).
- **Pendiente stack original:** Better Auth, Brevo, S3 Spaces, Redis/BullMQ o Trigger.dev (entran con contenido programado / carrusel PDF).

## 2. Decisiones tomadas

- GitHub sobre GitLab (Railway nativo, aunque Railway quedó descartado por falta de free tier).
- DB local en Docker (Neon cuando se despliegue).
- Satori + sharp para carrusel PDF (NO Puppeteer en free tiers).
- Magic link + Google OAuth en vez de password clásico (futuro).
- Lemon Squeezy sobre Stripe para monetizar (MoR, mejor para solo-dev LatAm).
- Ingesta legal: solo lo que el usuario sube/pega (no scrapear YouTube/LinkedIn).

## 3. Roadmap

### Hecho (verificado e2e, pusheado)
- [x] Scaffold + Postgres Docker + smoke test (`8cfe49f`, `4b76185`)
- [x] MVP ideas texto/audio → copy estructurado (`66d73f8`)
- [x] Fix hidratación fechas (`b6bfdeb`) + fix modelo/key Gemini (`3116ef7`)
- [x] Rediseño `/ideas` tabs + shadcn (`b1d7c7a`)
- [x] Gate invitaciones + cuotas (`90b8140`)
- [x] Milestone 1: historial + editor + regenerar slide (`9a7d996`)
- [x] Tema violeta + versiones por red con copiar (`b74ef7e`)
- [x] CI lint + build (`b4b18f2`)
- [x] Docs: `uso-mvp.md`, `tecnica-mvp.md` (esta planificación)

### Siguiente (orden acordado)
1. Imagen como input (gratis, mismo endpoint, `mediaType: image/*`).
2. Milestone 3: contenido programado + email (Brevo) → requiere Trigger.dev, tablas `Interest`/`Schedule`/`Delivery`, cuota diaria.
3. Milestone 2: carrusel PDF (Satori + sharp) + brand kits.
4. Auth real (Better Auth) + pagos (Lemon Squeezy) + deploy (Koyeb + Neon).

### Deuda conocida
- Vuln Dependabot high (`deepmerge-ts` vía Prisma dev): solo tooling, fix exige breaking change → diferir.
- Rate limit en memoria → Redis al escalar. Sin tests (vitest pendiente).
- `.opencode.json` con MCPs pendiente. Rama `develop` pendiente.
- Free tier Gemini por modelo varía mucho (documentado en `uso-mvp.md`).
