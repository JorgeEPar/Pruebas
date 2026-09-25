# MVP "De contenido a ideas" — Documentación técnica

## Arquitectura

```
UI (/ideas, client) ──multipart/form-data──▶ POST /api/ideas (Route Handler)
  text (≤8000) + audio opcional (≤15 MB)        │
    │                                           ▼
    │                                    Zod valida input
    │                                    rate limit (memoria, 10/min/IP)
    │                                           ▼
    │                                    generateObject (AI SDK v7)
    │                                    model = getTextModel()
    │                                    schema Zod → JSON garantizado
    │                                           ▼
    ◀─────────────── IdeasOutput (resumen + 3-7 ideas) ─────────
```

Sin Server Actions (regla del stack): todo el backend son Route Handlers.

## Archivos

| Archivo | Rol |
|---|---|
| `src/app/ideas/page.tsx` | UI: textarea + upload + tarjetas de resultado |
| `src/app/ideas/layout.tsx` | Gate server-side: redirige a `/acceso` sin código válido |
| `src/app/acceso/page.tsx` | UI de ingreso del código |
| `src/app/api/acceso/route.ts` | POST valida + setea cookie httpOnly · DELETE la borra |
| `src/app/api/ideas/route.ts` | Handler: valida, limita, llama a la IA, persiste `Generation`, mapea errores |
| `src/app/api/ideas/regenerar/route.ts` | POST: regenera 1 slide y lo persiste (descuenta 1 uso) |
| `src/app/api/generations/route.ts` | GET historial/detalle + PUT guardar ediciones (solo propio código) |
| `src/lib/invite.ts` | `validateInvite()` contra DB (`server-only` implícito) |
| `src/lib/validations/ideas.ts` | Schemas Zod de input y output (contrato front/back) |
| `src/lib/ai/provider.ts` | Abstracción del provider (`server-only`: no se filtra al cliente) |
| `src/lib/rate-limit.ts` | Rate limit en memoria (mover a Redis al escalar) |
| `prisma/seed.ts` | Códigos iniciales (`npm run db:seed`) |

## Cambiar de modelo o provider

1. Solo modelo Gemini: `AI_MODEL="gemini-2.0-flash"` en `.env`.
2. Otro provider (Claude/OpenAI): instalar `@ai-sdk/anthropic` u
   `@ai-sdk/openai` y cambiar `getTextModel()` en
   `src/lib/ai/provider.ts`. Las rutas y la UI no se tocan.

## Seguridad aplicada

- Key solo en servidor (`server-only` + env sin prefijo `NEXT_PUBLIC_`).
- Validación Zod en backend aunque el front ya valide.
- Límites de tamaño/tipo de archivo antes de enviar a la IA.
- Rate limit por IP; errores 429/502 legibles en vez de 500 genérico.
- No se loguea el contenido del usuario (ver `console.error` solo con el objeto error).
- Hardening (revisión 2026-09-25): cuota atómica por transacción
  (`updateMany` condicional → 403 si se agota en concurrencia);
  rate limit en `/api/acceso` (5/min anti brute-force) y por código
  (no por IP spoofeable) con purga del Map; allowlist de MIME +
  re-decodificación con sharp (SVG y spoofeados → 400);
  PUT validado con Zod estricto; `/api/notes` con invite + `take: 50`;
  material entre `<material>` (ignorar instrucciones internas);
  cookie de salida con `path` explícito; `health` con `dynamic`.

## Deuda conocida / próximos pasos

1. Persistir generaciones (tabla `Generation` en Prisma) + auth (Better Auth).
2. Jobs async (Trigger.dev) cuando el pipeline incluya render de PDF.
3. Render de carrusel: Satori + sharp → PDF (NO Puppeteer en free tiers).
4. Uploads a S3 Spaces en vez de procesar en memoria.
5. Cuotas por usuario (tabla `Usage`: tokens/llamadas) antes de monetizar.
6. Rate limit en Redis + tests (vitest) del handler.
