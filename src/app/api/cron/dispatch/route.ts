import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runDigest } from "@/lib/dispatch";

function hourInTimezone(timezone: string, date = new Date()): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    }).formatToParts(date);
    return Number(parts.find((p) => p.type === "hour")?.value);
  } catch {
    return null;
  }
}

function assertCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const url = new URL(req.url);
  return (
    url.searchParams.get("secret") === secret ||
    req.headers.get("authorization") === `Bearer ${secret}`
  );
}

// GET /api/cron/dispatch?secret=... → ejecuta schedules vencidos.
// Diseñado para un cron externo (Trigger.dev, cron-job.org) o `curl` local.
// `?hour=N` fuerza la hora (solo para probar).
export async function GET(req: Request) {
  if (!assertCron(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const forcedHour = url.searchParams.get("hour");
  const results: Array<Record<string, unknown>> = [];

  const schedules = await prisma.schedule.findMany({ where: { active: true } });
  for (const s of schedules) {
    const hour = forcedHour !== null
      ? Number(forcedHour)
      : hourInTimezone(s.timezone);
    if (hour !== s.hour) {
      results.push({ inviteCode: s.inviteCode, status: "skipped", reason: "not-due" });
      continue;
    }
    try {
      const r = await runDigest(s.inviteCode, s.emailTo);
      results.push({ inviteCode: s.inviteCode, status: "sent", ...r });
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown";
      // DAILY_LIMIT / QUOTA_EXHAUSTED / NO_TOPICS: esperable, no reintentar hoy.
      results.push({ inviteCode: s.inviteCode, status: "skipped", reason: message });
    }
  }
  return NextResponse.json({ results });
}
