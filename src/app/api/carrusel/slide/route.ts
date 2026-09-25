import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateInvite, INVITE_COOKIE } from "@/lib/invite";
import { prisma } from "@/lib/prisma";
import {
  renderCoverPng,
  renderClosingPng,
  renderSlidePng,
  type SlideIdea,
} from "@/lib/carrusel";
import { ideaSchema } from "@/lib/validations/ideas";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET /api/carrusel/slide?id=&slide=N|cover|closing → PNG 1080x1080.
export async function GET(req: Request) {
  const invite = await validateInvite(
    (await cookies()).get(INVITE_COOKIE)?.value ?? "",
  );
  if (!invite) {
    return NextResponse.json({ error: "Acceso requerido" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawSlide = searchParams.get("slide") ?? searchParams.get("index");
  const parsed = z
    .object({ id: z.string().cuid(), slide: z.string().min(1) })
    .safeParse({ id: searchParams.get("id"), slide: rawSlide });
  if (!parsed.success) {
    return NextResponse.json({ error: "id y slide requeridos" }, { status: 400 });
  }

  const gen = await prisma.generation.findFirst({
    where: { id: parsed.data.id, inviteCode: invite.code },
  });
  if (!gen) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const output = gen.output as { ideas?: unknown; resumen?: string };
  const ideas = z.array(ideaSchema).min(1).max(7).safeParse(output.ideas);
  if (!ideas.success) {
    return NextResponse.json({ error: "Contenido inválido" }, { status: 422 });
  }
  const list = ideas.data as SlideIdea[];
  const resumen = typeof output.resumen === "string" ? output.resumen : "";

  try {
    let png: Buffer;
    if (parsed.data.slide === "cover") {
      png = await renderCoverPng(list[0]?.titulo ?? "Carrusel", resumen.slice(0, 220), list.length);
    } else if (parsed.data.slide === "closing") {
      const last = list[list.length - 1];
      png = await renderClosingPng(last.cta, last.hook);
    } else {
      const index = Number(parsed.data.slide);
      if (!Number.isInteger(index) || index < 0 || index >= list.length) {
        return NextResponse.json({ error: "Slide inexistente" }, { status: 404 });
      }
      png = await renderSlidePng(list[index], index, list.length);
    }
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
