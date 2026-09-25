import "server-only";

import { generateObject, type UserModelMessage } from "ai";
import { getTextModel, assertAiConfigured } from "@/lib/ai/provider";
import { prisma } from "@/lib/prisma";
import { ideasOutputSchema } from "@/lib/validations/ideas";
import { sendDigestEmail, type DigestContent } from "@/lib/email";

const SYSTEM_DIGEST = `Sos un editor de contenido para agencias y creadores.
Con el TEMA dado, generá entre 5 y 7 ideas con copy listo para publicar.
Reglas: español neutro y directo; hooks de máx 15 palabras sin clickbait engañoso;
nada de muletillas de IA ("en el vertiginoso mundo", "profundicemos", emojis en cada línea).
Además adaptá el contenido a cada red en "versiones": LinkedIn profesional con hashtags,
Instagram breve con emojis, TikTok como guion de 30 segundos, X corto y directo.`;

// Elige un tema activo evitando repetir los usados recientemente.
export async function pickTopic(inviteCode: string): Promise<string | null> {
  const interests = await prisma.interest.findMany({
    where: { inviteCode, active: true },
    // Los nunca usados (NULL) primero, luego los menos recientes.
    orderBy: [
      { lastUsedAt: { sort: "asc", nulls: "first" } },
      { createdAt: "asc" },
    ],
    take: 5,
  });
  if (interests.length === 0) return null;
  const chosen = interests[Math.floor(Math.random() * interests.length)];
  await prisma.interest.update({
    where: { id: chosen.id },
    data: { lastUsedAt: new Date() },
  });
  return chosen.topic;
}

export async function todayDeliveries(inviteCode: string): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.delivery.count({
    where: { inviteCode, sentAt: { gte: start }, status: "sent" },
  });
}

// Genera el digest para un código: IA → Generation → email → Delivery.
// Idempotente por día si se llama con `onlyIfDue` desde el cron.
export async function runDigest(
  inviteCode: string,
  emailTo: string,
  topicOverride?: string,
): Promise<{ generationId: string; topic: string }> {
  const topic = topicOverride ?? (await pickTopic(inviteCode));
  if (!topic) throw new Error("NO_TOPICS");

  assertAiConfigured();
  const { object } = await generateObject({
    model: getTextModel(),
    schema: ideasOutputSchema,
    system: SYSTEM_DIGEST,
    prompt: [
      { role: "user", content: `TEMA de hoy entre <material>...</material>:\n<material>\n${topic}\n</material>` } satisfies UserModelMessage,
    ],
  });

  const content = { ...(object as object), topic } as DigestContent & { topic: string };
  const generation = await prisma.$transaction(async (tx) => {
    const invite = await tx.inviteCode.findUnique({ where: { code: inviteCode } });
    if (!invite || invite.revoked || invite.uses >= invite.maxUses) {
      throw new Error("QUOTA_EXHAUSTED");
    }
    const sentToday = await tx.delivery.count({
      where: {
        inviteCode,
        status: "sent",
        sentAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });
    if (sentToday >= invite.dailyLimit) throw new Error("DAILY_LIMIT");
    await tx.inviteCode.update({
      where: { code: inviteCode },
      data: { uses: { increment: 1 } },
    });
    return tx.generation.create({
      data: {
        inviteCode,
        inputKind: "auto",
        inputText: `Tema programado: ${topic}`,
        output: object,
        model: process.env.AI_MODEL ?? "gemini-3.5-flash-lite",
      },
    });
  });

  try {
    await sendDigestEmail(
      emailTo,
      `Tu contenido de hoy: ${topic}`,
      content as DigestContent,
    );
  } catch (e) {
    await prisma.delivery.create({
      data: {
        inviteCode,
        generationId: generation.id,
        topic,
        channel: "email",
        status: "failed",
        error: e instanceof Error ? e.message.slice(0, 500) : "unknown",
      },
    });
    throw e;
  }

  await prisma.delivery.create({
    data: {
      inviteCode,
      generationId: generation.id,
      topic,
      channel: "email",
      status: "sent",
    },
  });
  return { generationId: generation.id, topic };
}
