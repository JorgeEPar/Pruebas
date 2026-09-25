# MVP "De contenido a ideas" — Guía de uso

Genera ideas de contenido listas para carrusel a partir de un texto pegado,
un audio o una imagen, usando Gemini Flash (gratis).

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
3. Pegá un texto (mín 20, máx 8000 caracteres), subí un audio
   (cualquier formato `audio/*`, máx 15 MB) o una imagen
   (PNG/JPG/WEBP, máx 10 MB, ej. flyer o captura).
4. Click en **Generar ideas**.
5. Resultado: resumen + 3 a 7 ideas, cada una con hook, título,
   3-5 puntos de copy (uno por slide) y CTA.
6. **Versiones por red**: el mismo contenido adaptado a LinkedIn,
   Instagram, TikTok y X, cada uno con botón **Copiar**.
7. Cada generación consume 1 uso del código (`maxUses`, default 50).
   Con **Salir** cerrás el acceso (borra la cookie).

## Contenido programado (digest diario por email)

1. Entrá a `/ideas/programado` (requiere invite).
2. Agregá temas de interés (máx 20). El sistema rota evitando repetir.
3. Guardá la programación: hora (Argentina), email destino, activo/pausado.
4. Cada día a esa hora el cron genera el digest y lo envía.
   **Driver de email** (`EMAIL_DRIVER` en `.env`):
   - `smtp` (default local): Mailpit en Docker, ver en
     http://localhost:8025. Sin cuentas ni keys.
   - `brevo`: producción, 300 gratis/día. Key en
     https://app.brevo.com/settings/keys/api-keys.
   - Alternativa futura: Resend (100/día, mejor DX Next.js).
5. Cupo: `dailyLimit`/día por código (default 1).
6. **Enviar ahora** ejecuta el digest manualmente (descuenta igual).

Cron local de prueba:
```bash
# manual (usa ?hour=N para forzar la hora sin esperar)
curl "http://localhost:3000/api/cron/dispatch?secret=TU_CRON_SECRET&hour=8"
```
En producción: Trigger.dev schedule `0 8 * * *` → ese endpoint.

## Carrusel listo para publicar

Cada generación incluye una sección **Carrusel**: portada (gancho +
resumen) + un slide 1080×1080 por idea + cierre (CTA), renderizado con
Satori + sharp, con miniaturas y botón **Descargar PDF**.
En las tarjetas: subir/bajar/quitar slides (se guardan solos) y
regenerar individual.
Render determinista sin costo IA: no descuenta usos.
Detalle técnico: Satori va en `serverExternalPackages` (su wasm rompe
empaquetado por Turbopack) y el JSX usa `display` explícito + texto
en `<span>` (exigencia de Satori).

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
- Acceso por código de invitación; el historial persiste por código.
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
