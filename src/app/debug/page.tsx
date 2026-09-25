import { prisma } from "@/lib/prisma";
import { NotesClient } from "./notes-client";

export const dynamic = "force-dynamic";

type Note = { id: number; text: string; createdAt: Date };

async function getNotes(): Promise<Note[]> {
  return prisma.note.findMany({ orderBy: { id: "desc" } });
}

export default async function DebugPage() {
  const initialNotes = await getNotes();
  return (
    <main className="mx-auto max-w-xl space-y-2 p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Debug / smoke test</h1>
      <p className="text-sm text-muted-foreground">
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
