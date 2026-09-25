import { NextResponse } from "next/server";
import { validateInvite, INVITE_COOKIE } from "@/lib/invite";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

const isProd = process.env.NODE_ENV === "production";

// POST { code } → valida y setea cookie httpOnly.
// DELETE → cierra acceso (borra cookie).
export async function POST(req: Request) {
  // Anti brute-force de códigos (5/min por IP).
  const { allowed, retryAfterSec } = checkRateLimit(`acceso:${clientIp(req)}`, 5);
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Reintentá en 1 min" },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  const body: unknown = await req.json().catch(() => null);
  const code = typeof body === "object" && body !== null
    ? String((body as Record<string, unknown>).code ?? "")
    : "";
  const invite = await validateInvite(code);
  if (!invite) {
    return NextResponse.json(
      { error: "Código inválido, agotado o revocado" },
      { status: 401 },
    );
  }
  const res = NextResponse.json({ ok: true, label: invite.label });
  res.cookies.set(INVITE_COOKIE, invite.code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: isProd,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(INVITE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
