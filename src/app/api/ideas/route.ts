import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateObject, type FilePart, type TextPart, type UserModelMessage } from "ai";
import { getTextModel, assertAiConfigured } from "@/lib/ai/provider";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateInvite, INVITE_COOKIE } from "@/lib/invite";
import { prisma } from "@/lib/prisma";
import {
  ideasInputSchema,
  ideasOutputSchema,
  MAX_AUDIO_BYTES,
} from "@/lib/validations/ideas";

const SYSTEM = `Sos un editor de contenido para agencias y creadores.
Extraé entre 5 y 7 ideas clave del material y devolvé copy listo para publicar.
Reglas: español neutro y directo; hooks de máx 15 palabras sin clickbait engañoso;
nada de muletillas de IA ("en el vertiginoso mundo", "profundicemos", emojis en cada línea).
Si el material es audio, primero transcribilo mentalmente y trabajá sobre la transcripción.`;

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
  );
}

export async function POST(req: Request) {
  const invite = await validateInvite(
    (await cookies()).get(INVITE_COOKIE)?.value ?? "",
  );
  if (!invite) {
    return NextResponse.json(
      { error: "Acceso requerido. Ingresá tu código en /acceso" },
      { status: 401 },
    );
  }

  const { allowed, retryAfterSec } = checkRateLimit(clientIp(req));
  if (!allowed) {
    return NextResponse.json(
      { error: `Límite excedido. Reintentá en ${retryAfterSec}s` },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Enviá los datos como multipart/form-data" },
      { status: 400 },
    );
  }

  const text = String(form.get("text") ?? "");
  const audio = form.get("audio");
  const audioFile =
    audio instanceof File && audio.size > 0 ? audio : null;

  if (audioFile) {
    if (!audioFile.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "El archivo debe ser de audio" },
        { status: 400 },
      );
    }
    if (audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Audio máx 15 MB" },
        { status: 400 },
      );
    }
  }

  const parsed = ideasInputSchema.safeParse({
    text,
    hasAudio: audioFile !== null,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().formErrors.join(". ") },
      { status: 400 },
    );
  }

  try {
    assertAiConfigured();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "IA no configurada" },
      { status: 503 },
    );
  }

  try {
    const content: Array<TextPart | FilePart> = [];
    if (parsed.data.text.length > 0) {
      content.push({
        type: "text",
        text: `Material del cliente:\n${parsed.data.text}`,
      });
    }
    if (audioFile) {
      content.push({
        type: "file",
        data: Buffer.from(await audioFile.arrayBuffer()),
        mediaType: audioFile.type,
      });
    }

    const { object } = await generateObject({
      model: getTextModel(),
      schema: ideasOutputSchema,
      system: SYSTEM,
      prompt: [{ role: "user", content } satisfies UserModelMessage],
    });
    await prisma.inviteCode.update({
      where: { code: invite.code },
      data: { uses: { increment: 1 } },
    });
    return NextResponse.json(object);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    // Cuota gratis agotada o key inválida → 429/502 legible, no 500 genérico.
    if (/429|quota|rate|exhausted/i.test(message)) {
      return NextResponse.json(
        { error: "Cuota gratuita de Gemini agotada. Reintentá más tarde." },
        { status: 429 },
      );
    }
    if (/503|overloaded|high demand|UNAVAILABLE/i.test(message)) {
      return NextResponse.json(
        { error: "Modelo saturado. Reintentá en unos segundos." },
        { status: 503 },
      );
    }
    if (/401|403|api key|api_key/i.test(message)) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY inválida. Revisá tu .env" },
        { status: 502 },
      );
    }
    console.error("POST /api/ideas", e);
    return NextResponse.json(
      { error: "Falló la generación. Reintentá." },
      { status: 500 },
    );
  }
}
