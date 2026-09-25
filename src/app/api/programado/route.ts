import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateInvite, INVITE_COOKIE } from "@/lib/invite";
import { prisma } from "@/lib/prisma";
import { runDigest } from "@/lib/dispatch";
import { z } from "zod";

const addTopicSchema = z.object({ action: z.literal("add-topic"), topic: z.string().trim().min(3).max(200) });
const removeTopicSchema = z.object({ action: z.literal("remove-topic"), id: z.string().cuid() });
const saveScheduleSchema = z.object({
  action: z.literal("save-schedule"),
  hour: z.number().int().min(0).max(23),
  emailTo: z.string().trim().email().max(320),
  active: z.boolean(),
});
const sendNowSchema = z.object({ action: z.literal("send-now"), topic: z.string().trim().min(3).max(200).optional() });

const actionSchema = z.discriminatedUnion("action", [
  addTopicSchema,
  removeTopicSchema,
  saveScheduleSchema,
  sendNowSchema,
]);

async function gate() {
  const code = (await cookies()).get(INVITE_COOKIE)?.value ?? "";
  return validateInvite(code);
}

// GET → intereses + schedule + últimos envíos del código.
export async function GET() {
  const invite = await gate();
  if (!invite) return NextResponse.json({ error: "Acceso requerido" }, { status: 401 });
  const [interests, schedule, deliveries] = await Promise.all([
    prisma.interest.findMany({ where: { inviteCode: invite.code }, orderBy: { createdAt: "asc" } }),
    prisma.schedule.findUnique({ where: { inviteCode: invite.code } }),
    prisma.delivery.findMany({ where: { inviteCode: invite.code }, orderBy: { sentAt: "desc" }, take: 10 }),
  ]);
  return NextResponse.json({ interests, schedule, deliveries, dailyLimit: invite.dailyLimit });
}

// POST { action, ... } → gestiona intereses, schedule o envío manual.
export async function POST(req: Request) {
  const invite = await gate();
  if (!invite) return NextResponse.json({ error: "Acceso requerido" }, { status: 401 });

  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }
  const action = parsed.data;

  if (action.action === "add-topic") {
    const count = await prisma.interest.count({ where: { inviteCode: invite.code, active: true } });
    if (count >= 20) {
      return NextResponse.json({ error: "Máx 20 temas activos" }, { status: 400 });
    }
    const created = await prisma.interest.create({
      data: { inviteCode: invite.code, topic: action.topic },
    });
    return NextResponse.json(created, { status: 201 });
  }

  if (action.action === "remove-topic") {
    await prisma.interest.deleteMany({ where: { id: action.id, inviteCode: invite.code } });
    return NextResponse.json({ ok: true });
  }

  if (action.action === "save-schedule") {
    const saved = await prisma.schedule.upsert({
      where: { inviteCode: invite.code },
      update: { hour: action.hour, emailTo: action.emailTo, active: action.active },
      create: { inviteCode: invite.code, hour: action.hour, emailTo: action.emailTo, active: action.active },
    });
    return NextResponse.json(saved);
  }

  // send-now: ejecuta el digest ya (descuenta uso + cupo diario igual que el cron).
  let email: string;
  try {
    email = await resolveEmail(invite.code);
  } catch {
    return NextResponse.json(
      { error: "Guardá tu email en la programación primero" },
      { status: 400 },
    );
  }
  try {
    const r = await runDigest(invite.code, email, action.topic);
    return NextResponse.json(r);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown";
    if (message === "NO_TOPICS") {
      return NextResponse.json({ error: "Agregá al menos un tema primero" }, { status: 400 });
    }
    if (message === "QUOTA_EXHAUSTED") {
      return NextResponse.json({ error: "Código agotado. Pedí uno nuevo." }, { status: 403 });
    }
    if (message === "DAILY_LIMIT") {
      return NextResponse.json({ error: "Cupo diario alcanzado. Reintentá mañana." }, { status: 429 });
    }
    console.error("POST /api/programado send-now", e);
    return NextResponse.json({ error: "Falló el envío. Reintentá." }, { status: 500 });
  }
}

async function resolveEmail(inviteCode: string): Promise<string> {
  const schedule = await prisma.schedule.findUnique({ where: { inviteCode } });
  if (!schedule?.emailTo) throw new Error("NO_SCHEDULE_EMAIL");
  return schedule.emailTo;
}
