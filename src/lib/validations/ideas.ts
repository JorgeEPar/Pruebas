import { z } from "zod";

export const MAX_TEXT_LENGTH = 8000;
export const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15 MB

// Input del MVP: texto pegado y/o audio subido. Al menos uno requerido.
export const ideasInputSchema = z
  .object({
    text: z
      .string()
      .trim()
      .max(MAX_TEXT_LENGTH, `Máx ${MAX_TEXT_LENGTH} caracteres`)
      .optional()
      .default(""),
    hasAudio: z.boolean().optional().default(false),
  })
  .refine((v) => v.text.length >= 20 || v.hasAudio, {
    message: "Pega un texto (mín 20 caracteres) o sube un audio",
  });

export type IdeasInput = z.infer<typeof ideasInputSchema>;

// Output estructurado que devuelve la IA (y consume la UI).
export const ideaSchema = z.object({
  hook: z.string().describe("Gancho de apertura, máx 15 palabras"),
  titulo: z.string().describe("Título de la idea"),
  puntos: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe("Copys listos, uno por slide del carrusel"),
  cta: z.string().describe("Llamado a la acción de cierre"),
});

export const ideasOutputSchema = z.object({
  ideas: z.array(ideaSchema).min(3).max(7),
  resumen: z.string().describe("Resumen del contenido en 2 líneas"),
});

export type IdeasOutput = z.infer<typeof ideasOutputSchema>;
