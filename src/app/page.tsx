import { prisma } from "@/lib/prisma";
import { NotesClient } from "./notes-client";

export const dynamic = "force-dynamic";

type Note = { id: number; text: string; createdAt: Date };

async function getNotes(): Promise<Note[]> {
  return prisma.note.findMany({ orderBy: { id: "desc" } });
}

export default async function Home() {
  const initialNotes = await getNotes();
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">Smoke test ✅</h1>
      <p className="mt-1 text-sm text-zinc-500">
        SSR + Route Handlers + Prisma + Postgres + Zod + RHF
      </p>
      <div className="mt-6">
        <NotesClient
          initialNotes={initialNotes.map((n) => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      </div>
    </main>
  );
}
