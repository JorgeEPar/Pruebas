import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateInvite, INVITE_COOKIE } from "@/lib/invite";
import { prisma } from "@/lib/prisma";
import { renderSlidePng, type SlideIdea } from "@/lib/carrusel";
import { ideaSchema } from "@/lib/validations/ideas";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET /api/carrusel/slide?id=&index= → PNG 1080x1080 del slide.
export async function GET(req: Request) {
  const invite = await validateInvite(
    (await cookies()).get(INVITE_COOKIE)?.value ?? "",
  );
  if (!invite) {
    return NextResponse.json({ error: "Acceso requerido" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = z
    .object({ id: z.string().cuid(), index: z.coerce.number().int().min(0).max(6) })
    .safeParse({
      id: searchParams.get("id"),
      index: searchParams.get("index"),
    });
  if (!parsed.success) {
    return NextResponse.json({ error: "id e index requeridos" }, { status: 400 });
  }

  const gen = await prisma.generation.findFirst({
    where: { id: parsed.data.id, inviteCode: invite.code },
  });
  if (!gen) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const output = gen.output as { ideas?: unknown };
  const ideas = z.array(ideaSchema).min(1).max(7).safeParse(output.ideas);
  if (!ideas.success || !ideas.data[parsed.data.index]) {
    return NextResponse.json({ error: "Slide inexistente" }, { status: 404 });
  }

  try {
    const png = await renderSlidePng(
      ideas.data[parsed.data.index] as SlideIdea,
      parsed.data.index,
      ideas.data.length,
    );
    const bytes = new Uint8Array(png);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(bytes.length),
      },
    });
  } catch (e) {
    console.error("GET /api/carrusel/slide", e);
    return NextResponse.json({ error: "Falló el render. Reintentá." }, { status: 500 });
  }
}
