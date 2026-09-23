import "server-only";

import { google } from "@ai-sdk/google";

// Abstracción del provider de IA: hoy Gemini Flash (gratis), mañana
// Claude/OpenAI cambiando solo esta función, sin tocar las rutas.
export function getTextModel() {
  return google(process.env.AI_MODEL ?? "gemini-2.5-flash");
}

export function assertAiConfigured() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "Falta GEMINI_API_KEY. Creala gratis en https://aistudio.google.com/apikey y agregala al .env",
    );
  }
}
