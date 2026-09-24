"use client";

import { useState } from "react";
import {
  FileAudio,
  Loader2,
  Megaphone,
  Mic,
  Quote,
  Sparkles,
  TriangleAlert,
  Type,
  WandSparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { IdeasOutput } from "@/lib/validations/ideas";

const MAX_TEXT = 8000;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function IdeasPage() {
  const [tab, setTab] = useState("texto");
  const [text, setText] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdeasOutput | null>(null);

  const textValid = text.trim().length >= 20;

  async function generate(form: FormData) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
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

  function submitText(e: React.FormEvent) {
    e.preventDefault();
    if (!textValid || loading) return;
    const form = new FormData();
    form.set("text", text);
    void generate(form);
  }

  function submitAudio(e: React.FormEvent) {
    e.preventDefault();
    if (!audio || loading) return;
    const form = new FormData();
    form.set("text", "");
    form.set("audio", audio);
    void generate(form);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6 sm:p-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            De contenido a ideas
          </h1>
          <Badge variant="secondary">MVP · Gemini Flash</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Generá copys listos para carrusel desde un texto o un audio.
          Cada fuente va por separado.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="texto" className="gap-2">
            <Type className="size-4" /> Texto
          </TabsTrigger>
          <TabsTrigger value="audio" className="gap-2">
            <Mic className="size-4" /> Audio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="texto">
          <Card>
            <form onSubmit={submitText}>
              <CardContent className="space-y-3 pt-6">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={7}
                  maxLength={MAX_TEXT}
                  placeholder="Pegá aquí el artículo, guion o idea suelta (mín 20 caracteres)…"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {text.trim().length} / {MAX_TEXT}
                </p>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={!textValid || loading}>
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <WandSparkles />
                  )}
                  Generar desde texto
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="audio">
          <Card>
            <form onSubmit={submitAudio}>
              <CardContent className="space-y-3 pt-6">
                <label
                  htmlFor="audio-upload"
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors hover:border-primary"
                >
                  <FileAudio className="size-8 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {audio ? audio.name : "Elegí un archivo de audio"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {audio
                      ? formatBytes(audio.size)
                      : "Cualquier formato audio/*, máx 15 MB"}
                  </span>
                </label>
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
                />
                {audio && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAudio(null)}
                  >
                    <X /> Quitar archivo
                  </Button>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={!audio || loading}>
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <WandSparkles />
                  )}
                  Generar desde audio
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4" aria-label="Generando ideas">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !result && !error && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <Sparkles className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Todavía no hay ideas. Elegí una fuente y generá.
          </p>
        </div>
      )}

      {result && (
        <section className="space-y-4">
          <Card className="bg-muted/50">
            <CardContent className="pt-6 text-sm">
              {result.resumen}
            </CardContent>
          </Card>
          {result.ideas.map((idea, i) => (
            <Card key={i}>
              <CardHeader>
                <Badge className="w-fit" variant="outline">
                  Idea {i + 1}
                </Badge>
                <CardTitle className="text-lg">{idea.titulo}</CardTitle>
                <CardDescription className="flex items-start gap-1.5">
                  <Quote className="mt-0.5 size-3.5 shrink-0" />
                  {idea.hook}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                  {idea.puntos.map((p, j) => (
                    <li key={j}>{p}</li>
                  ))}
                </ol>
              </CardContent>
              <CardFooter>
                <p className="flex items-start gap-1.5 text-sm font-medium">
                  <Megaphone className="mt-0.5 size-4 shrink-0" />
                  {idea.cta}
                </p>
              </CardFooter>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
