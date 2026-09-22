import { z } from "zod";

// Schema compartido front (RHF) + back (Route Handlers).
export const createNoteSchema = z.object({
  text: z.string().trim().min(1, "Requerido").max(280, "Máx 280 caracteres"),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
