import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNoteSchema } from "@/lib/validations/note";

export async function GET() {
  const notes = await prisma.note.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
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
