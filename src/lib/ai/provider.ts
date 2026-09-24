import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Abstracción del provider de IA: hoy Gemini Flash (gratis), mañana
// Claude/OpenAI cambiando solo esta función, sin tocar las rutas.
// Nota: el SDK de Google lee GOOGLE_GENERATIVE_AI_API_KEY, así que
// creamos el provider con nuestra GEMINI_API_KEY para no atarnos a su nombre.
export function getTextModel() {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  return google(process.env.AI_MODEL ?? "gemini-3.5-flash-lite");
}

export function assertAiConfigured() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "Falta GEMINI_API_KEY. Creala gratis en https://aistudio.google.com/apikey y agregala al .env",
    );
  }
}
