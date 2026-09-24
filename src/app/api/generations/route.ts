import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateInvite, INVITE_COOKIE } from "@/lib/invite";
import { prisma } from "@/lib/prisma";

// GET → historial del código actual (sin el output completo).
// GET ?id= → detalle con output para re-ver / editar.
export async function GET(req: Request) {
  const invite = await validateInvite(
    (await cookies()).get(INVITE_COOKIE)?.value ?? "",
  );
  if (!invite) {
    return NextResponse.json({ error: "Acceso requerido" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const gen = await prisma.generation.findFirst({
      where: { id, inviteCode: invite.code },
    });
    if (!gen) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    return NextResponse.json(gen);
  }

  const list = await prisma.generation.findMany({
    where: { inviteCode: invite.code },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      inputKind: true,
      inputText: true,
      createdAt: true,
      output: true,
    },
  });
  // Resumen liviano: id, fecha, tipo, preview y cantidad de ideas.
  return NextResponse.json(
    list.map((g) => {
      const out = g.output as { resumen?: string; ideas?: unknown[] };
      return {
        id: g.id,
        inputKind: g.inputKind,
        inputPreview: (g.inputText ?? "").slice(0, 80),
        ideasCount: Array.isArray(out.ideas) ? out.ideas.length : 0,
        resumen: out.resumen ?? "",
        createdAt: g.createdAt,
      };
    }),
  );
}

// PUT { id, output } → guarda ediciones del usuario sobre una generación.
export async function PUT(req: Request) {
  const invite = await validateInvite(
    (await cookies()).get(INVITE_COOKIE)?.value ?? "",
  );
  if (!invite) {
    return NextResponse.json({ error: "Acceso requerido" }, { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const id = typeof body === "object" && body !== null
    ? String((body as Record<string, unknown>).id ?? "")
    : "";
  const output = typeof body === "object" && body !== null
    ? (body as Record<string, unknown>).output
    : null;
  if (!id || typeof output !== "object" || output === null) {
    return NextResponse.json({ error: "id y output requeridos" }, { status: 400 });
  }

  const ideas = (output as Record<string, unknown>).ideas;
  if (!Array.isArray(ideas) || ideas.length < 1 || ideas.length > 7) {
    return NextResponse.json({ error: "output inválido" }, { status: 400 });
  }

  const updated = await prisma.generation.updateMany({
    where: { id, inviteCode: invite.code },
    data: { output: output as object },
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
