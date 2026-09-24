# MVP "De contenido a ideas" — Guía de uso

Genera ideas de contenido listas para carrusel a partir de un texto pegado
o un audio subido, usando Gemini Flash (gratis).

## Requisitos

1. App corriendo: `npm run dev` (o ver `planificacion-app-web.md`).
2. Key gratuita de Gemini:
   - Entrá a https://aistudio.google.com/apikey con tu cuenta de Google.
   - Creá una API key (sin tarjeta).
   - Copiá `.env.example` a `.env` y completá `GEMINI_API_KEY="..."`.

Sin la key, `/ideas` responde `503` con el mensaje de cómo conseguirla.

## Uso paso a paso

1. Abrí http://localhost:3000/acceso e ingresá tu código de invitación
   (beta: `BETA-AGENCIA-01`. Ver códigos en `prisma/seed.ts` o crear más
   con `npm run db:seed` tras editarlo).
2. Entrás a http://localhost:3000/ideas (sin código redirige a `/acceso`).
3. Pegá un texto (mín 20, máx 8000 caracteres) **y/o** subí un audio
   (cualquier formato `audio/*`, máx 15 MB).
4. Click en **Generar ideas**.
5. Resultado: resumen + 3 a 7 ideas, cada una con hook, título,
   3-5 puntos de copy (uno por slide) y CTA.
6. Cada generación consume 1 uso del código (`maxUses`, default 50).
   Con **Salir** cerrás el acceso (borra la cookie).

## Gestionar códigos

```bash
npm run db:seed          # crea/actualiza los códigos de prisma/seed.ts
```

- Revocar: `revoked = true` en tabla `invite_codes` (efecto inmediato,
  se valida contra DB en cada request).
- Ver usos: columna `uses` vs `maxUses`.
- Crear uno puntual: insert en `invite_codes` (`code`, `label`, `maxUses`).

## Límites del MVP

- 10 generaciones por minuto por IP (rate limit en memoria).
- Sin login ni persistencia: el resultado vive solo en pantalla.
- Cuota gratis de Gemini: varía MUCHO por modelo (`gemini-3.6-flash`
  tiene ~20 req y se agota testeando; `gemini-3.5-flash-lite` es el
  default por su cuota generosa). Ver límites vigentes en AI Studio.
  Si se agota → error `429` con mensaje legible.
- El audio se envía a Google para procesarlo (free tier: el contenido
  puede usarse para mejorar sus productos — avisarlo en términos
  cuando haya usuarios reales).

## Errores comunes

| Error | Causa | Solución |
|---|---|---|
| `503` falta GEMINI_API_KEY | `.env` sin key | Crear key y reiniciar `npm run dev` |
| `429` | Rate limit local o cuota Gemini | Esperar y reintentar |
| `503` | Modelo saturado (alta demanda) | Reintentar en unos segundos |
| `502` key inválida | Key mal copiada | Revisar `.env` (sin comillas extra) |
| `400` | Texto muy corto o archivo no-audio | Ajustar input |
