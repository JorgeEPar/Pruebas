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

1. Abrí http://localhost:3000/ideas.
2. Pegá un texto (mín 20, máx 8000 caracteres) **y/o** subí un audio
   (cualquier formato `audio/*`, máx 15 MB).
3. Click en **Generar ideas**.
4. Resultado: resumen + 3 a 7 ideas, cada una con hook, título,
   3-5 puntos de copy (uno por slide) y CTA.

## Límites del MVP

- 10 generaciones por minuto por IP (rate limit en memoria).
- Sin login ni persistencia: el resultado vive solo en pantalla.
- Cuota gratis de Gemini: ~10-15 req/min y cientos/miles por día
  (ver límites vigentes en AI Studio). Si se agota → error `429`
  con mensaje legible.
- El audio se envía a Google para procesarlo (free tier: el contenido
  puede usarse para mejorar sus productos — avisarlo en términos
  cuando haya usuarios reales).

## Errores comunes

| Error | Causa | Solución |
|---|---|---|
| `503` falta GEMINI_API_KEY | `.env` sin key | Crear key y reiniciar `npm run dev` |
| `429` | Rate limit local o cuota Gemini | Esperar y reintentar |
| `502` key inválida | Key mal copiada | Revisar `.env` (sin comillas extra) |
| `400` | Texto muy corto o archivo no-audio | Ajustar input |
