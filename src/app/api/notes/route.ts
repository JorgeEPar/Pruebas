import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createNoteSchema } from "@/lib/validations/note";
import { validateInvite, INVITE_COOKIE } from "@/lib/invite";
import { checkRateLimit } from "@/lib/rate-limit";

// Smoke test legacy: exige invite + rate limit + paginación.
async function gate() {
  const invite = await validateInvite(
    (await cookies()).get(INVITE_COOKIE)?.value ?? "",
  );
  if (!invite) return null;
  const { allowed } = checkRateLimit(`notes:${invite.code}`);
  return allowed ? invite : null;
}

export async function GET() {
  if (!(await gate())) {
    return NextResponse.json({ error: "Acceso requerido" }, { status: 401 });
  }
  const notes = await prisma.note.findMany({
    orderBy: { id: "desc" },
    take: 50,
  });
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  if (!(await gate())) {
    return NextResponse.json({ error: "Acceso requerido" }, { status: 401 });
  }
  const body: unknown = await req.json().catch(() => null);
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const note = await prisma.note.create({ data: parsed.data });
  return NextResponse.json(note, { status: 201 });
}
