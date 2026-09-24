import { NextResponse } from "next/server";
import { validateInvite, INVITE_COOKIE } from "@/lib/invite";

const isProd = process.env.NODE_ENV === "production";

// POST { code } → valida y setea cookie httpOnly.
// DELETE → cierra acceso (borra cookie).
export async function POST(req: Request) {
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
  res.cookies.delete(INVITE_COOKIE);
  return res;
}
