import { z } from "zod";

export const MAX_TEXT_LENGTH = 8000;
export const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

// Input del MVP: texto pegado, audio y/o imagen. Al menos uno requerido.
export const ideasInputSchema = z
  .object({
    text: z
      .string()
      .trim()
      .max(MAX_TEXT_LENGTH, `Máx ${MAX_TEXT_LENGTH} caracteres`)
      .optional()
      .default(""),
    hasAudio: z.boolean().optional().default(false),
    hasImage: z.boolean().optional().default(false),
  })
  .refine((v) => v.text.length >= 20 || v.hasAudio || v.hasImage, {
    message: "Pega un texto (mín 20 caracteres), sube un audio o una imagen",
  });

export type IdeasInput = z.infer<typeof ideasInputSchema>;

// Output estructurado que devuelve la IA (y consume la UI).
export const ideaSchema = z.object({
  hook: z.string().max(200).describe("Gancho de apertura, máx 15 palabras"),
  titulo: z.string().max(200).describe("Título de la idea"),
  puntos: z
    .array(z.string().max(1000))
    .min(3)
    .max(5)
    .describe("Copys listos, uno por slide del carrusel"),
  cta: z.string().max(300).describe("Llamado a la acción de cierre"),
});

// Versiones del mismo contenido adaptadas por red (1 llamada, no 4).
export const versionesSchema = z.object({
  linkedin: z.string().max(700).describe("Post profesional con 3-5 hashtags"),
  instagram: z.string().max(450).describe("Caption corta con emojis y hashtags"),
  tiktok: z.string().max(550).describe("Guion 30s: gancho, cuerpo y CTA"),
  x: z.string().max(280).describe("Post corto estilo X, sin hashtags de más"),
});

export type Versiones = z.infer<typeof versionesSchema>;

export const ideasOutputSchema = z.object({
  ideas: z.array(ideaSchema).min(3).max(7),
  resumen: z.string().max(2000).describe("Resumen del contenido en 2 líneas"),
  versiones: versionesSchema.describe("Adaptaciones por red social"),
});

// Schema estricto para guardar ediciones del usuario (PUT /api/generations).
// `versiones` es opcional por generaciones viejas que no lo tienen.
export const saveOutputSchema = z.object({
  resumen: z.string().max(2000),
  ideas: z.array(ideaSchema).min(1).max(7),
  versiones: versionesSchema.optional(),
});

export const saveGenerationSchema = z.object({
  id: z.string().cuid(),
  output: saveOutputSchema,
});

export type IdeasOutput = z.infer<typeof ideasOutputSchema>;
