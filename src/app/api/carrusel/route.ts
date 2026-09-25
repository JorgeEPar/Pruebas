import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateInvite, INVITE_COOKIE } from "@/lib/invite";
import { prisma } from "@/lib/prisma";
import { renderCarouselPdf, type SlideIdea } from "@/lib/carrusel";
import { ideaSchema } from "@/lib/validations/ideas";
import { z } from "zod";

// POST { generationId } → PDF del carrusel (un slide por idea).
// Render determinista, sin costo IA: no descuenta usos.
export async function POST(req: Request) {
  const invite = await validateInvite(
    (await cookies()).get(INVITE_COOKIE)?.value ?? "",
  );
  if (!invite) {
    return NextResponse.json({ error: "Acceso requerido" }, { status: 401 });
  }

  const parsed = z
    .object({ generationId: z.string().cuid() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "generationId requerido" }, { status: 400 });
  }

  const gen = await prisma.generation.findFirst({
    where: { id: parsed.data.generationId, inviteCode: invite.code },
  });
  if (!gen) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const output = gen.output as { ideas?: unknown; resumen?: string };
  const ideas = z.array(ideaSchema).min(1).max(7).safeParse(output.ideas);
  if (!ideas.success) {
    return NextResponse.json({ error: "Contenido inválido para carrusel" }, { status: 422 });
  }

  try {
    const pdf = await renderCarouselPdf(
      ideas.data as SlideIdea[],
      typeof output.resumen === "string" ? output.resumen : "",
    );
    const bytes = new Uint8Array(pdf);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="carrusel-${gen.id}.pdf"`,
        "Content-Length": String(bytes.length),
      },
    });
  } catch (e) {
    console.error("POST /api/carrusel", e);
    return NextResponse.json({ error: "Falló el render. Reintentá." }, { status: 500 });
  }
}
