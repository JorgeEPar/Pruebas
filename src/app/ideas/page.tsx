"use client";

import { useState } from "react";
import type { IdeasOutput } from "@/lib/validations/ideas";

export default function IdeasPage() {
  const [text, setText] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdeasOutput | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (text.trim().length < 20 && !audio) {
      setError("Pegá un texto (mín 20 caracteres) o subí un audio");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.set("text", text);
      if (audio) form.set("audio", audio);
      const res = await fetch("/api/ideas", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falló la generación");
        return;
      }
      setResult(data as IdeasOutput);
    } catch {
      setError("Error de red. Reintentá.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">De contenido a ideas ✨</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pegá un texto o subí un audio y generá ideas listas para carrusel.
          MVP con Gemini Flash (gratis).
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          maxLength={8000}
          placeholder="Pegá aquí el artículo, guion o idea suelta…"
          className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Generando…" : "Generar ideas"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <section className="space-y-4">
          <p className="rounded bg-zinc-100 p-3 text-sm dark:bg-zinc-900">
            {result.resumen}
          </p>
          {result.ideas.map((idea, i) => (
            <article
              key={i}
              className="rounded border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <p className="text-xs font-semibold uppercase text-zinc-400">
                Idea {i + 1}
              </p>
              <h2 className="mt-1 font-bold">{idea.titulo}</h2>
              <p className="mt-1 text-sm italic">🪝 {idea.hook}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {idea.puntos.map((p, j) => (
                  <li key={j}>{p}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm font-medium">📣 {idea.cta}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
