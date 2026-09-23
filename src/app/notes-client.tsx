"use client";

import { useState } from "react";
import { NoteForm } from "./note-form";

type NoteDTO = { id: number; text: string; createdAt: string };

export function NotesClient({ initialNotes }: { initialNotes: NoteDTO[] }) {
  const [notes, setNotes] = useState<NoteDTO[]>(initialNotes);

  async function refresh() {
    const res = await fetch("/api/notes", { cache: "no-store" });
    if (res.ok) setNotes(await res.json());
  }

  return (
    <div className="space-y-4">
      <NoteForm onCreated={refresh} />
      <ul className="space-y-2">
        {notes.length === 0 && (
          <li className="text-sm text-zinc-500">Sin notas todavía.</li>
        )}
        {notes.map((n) => (
          <li
            key={n.id}
            className="rounded border border-zinc-200 px-3 py-2 dark:border-zinc-800"
          >
            <span>#{n.id} — {n.text}</span>
            {/* toLocaleString difiere entre Node y navegador: se suprime
                el aviso y React conserva el valor del cliente. */}
            <span
              className="ml-2 text-xs text-zinc-400"
              suppressHydrationWarning
            >
              {new Date(n.createdAt).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
