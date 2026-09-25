"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileAudio,
  FileImage,
  History,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Mic,
  Pencil,
  Quote,
  RefreshCw,
  Save,
  Share2,
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Versiones } from "@/lib/validations/ideas";
import { MAX_TEXT_LENGTH as MAX_TEXT } from "@/lib/validations/ideas";
import { Textarea } from "@/components/ui/textarea";

type Idea = { hook: string; titulo: string; puntos: string[]; cta: string };
type Result = {
  generationId: string | null;
  ideas: Idea[];
  resumen: string;
  versiones?: Versiones | null;
};
type HistoryItem = {
  id: string;
  inputKind: string;
  inputPreview: string;
  ideasCount: number;
  resumen: string;
  createdAt: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const REDES = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "x", label: "X" },
] as const;

function VersionesPorRed({ versiones }: { versiones: Versiones }) {
  const [copiado, setCopiado] = useState<string | null>(null);

  async function copiar(red: string, texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Fallback para contextos no seguros.
      const ta = document.createElement("textarea");
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopiado(red);
    setTimeout(() => setCopiado((c) => (c === red ? null : c)), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="size-4" /> Versiones por red
        </CardTitle>
        <CardDescription>
          El mismo contenido adaptado a cada plataforma en 1 click.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {REDES.map(({ key, label }) => (
          <div key={key} className="rounded-lg border p-3">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="secondary">{label}</Badge>
              <span className="flex-1" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copiar(key, versiones[key])}
              >
                {copiado === key ? <Check /> : <Copy />}
                {copiado === key ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm">{versiones[key]}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function IdeasPage() {
  const [tab, setTab] = useState("texto");
  const [text, setText] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Idea | null>(null);
  const [saving, setSaving] = useState(false);
  const [regenIndex, setRegenIndex] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  const textValid = text.trim().length >= 20;

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/generations", { cache: "no-store" });
    if (res.ok) setHistory(await res.json());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/generations", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: HistoryItem[]) => {
        if (!cancelled) setHistory(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function generate(form: FormData) {
    setLoading(true);
    setError(null);
    setResult(null);
    setEditing(null);
    try {
      const res = await fetch("/api/ideas", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falló la generación");
        return;
      }
      setResult({
        generationId: data.generationId ?? null,
        ideas: data.ideas,
        resumen: data.resumen,
        versiones: data.versiones ?? null,
      });
      void loadHistory();
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

  function pickImage(file: File | null) {
    setImage(file);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function submitImage(e: React.FormEvent) {
    e.preventDefault();
    if (!image || loading) return;
    const form = new FormData();
    form.set("text", "");
    form.set("image", image);
    void generate(form);
  }

  async function openHistory(id: string) {
    setError(null);
    const res = await fetch(`/api/generations?id=${id}`, { cache: "no-store" });
    if (!res.ok) {
      setError("No se pudo abrir el historial");
      return;
    }
    const gen = await res.json();
    setResult({
      generationId: gen.id,
      ideas: gen.output.ideas,
      resumen: gen.output.resumen,
      versiones: gen.output.versiones ?? null,
    });
    setEditing(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(i: number) {
    if (!result) return;
    setEditing(i);
    setDraft({ ...result.ideas[i], puntos: [...result.ideas[i].puntos] });
  }

  async function saveEdit(i: number) {
    if (!result || !result.generationId || !draft) return;
    setSaving(true);
    const ideas = result.ideas.map((idea, j) => (j === i ? draft : idea));
    try {
      const res = await fetch("/api/generations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: result.generationId,
          output: {
            resumen: result.resumen,
            ideas,
            ...(result.versiones ? { versiones: result.versiones } : {}),
          },
        }),
      });
      if (!res.ok) {
        setError("No se pudo guardar la edición");
        return;
      }
      setResult({ ...result, ideas });
      setEditing(null);
      setDraft(null);
    } finally {
      setSaving(false);
    }
  }

  async function regenSlide(i: number) {
    if (!result || !result.generationId) return;
    setRegenIndex(i);
    setError(null);
    try {
      const res = await fetch("/api/ideas/regenerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId: result.generationId, index: i }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falló la regeneración");
        return;
      }
      setResult({ ...result, ideas: data.ideas });
      setEditing(null);
    } catch {
      setError("Error de red. Reintentá.");
    } finally {
      setRegenIndex(null);
    }
  }

  async function downloadPdf() {
    if (!result || !result.generationId || downloading) return;
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch("/api/carrusel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId: result.generationId }),
      });
      if (!res.ok) {
        setError("No se pudo generar el PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carrusel-${result.generationId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Error de red. Reintentá.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6 sm:p-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            De contenido a ideas
          </h1>
          <Badge variant="secondary">MVP · Gemini Flash</Badge>
          <a href="/ideas/programado" className="text-sm text-muted-foreground underline">
            Programado
          </a>
        </div>
        <p className="text-sm text-muted-foreground">
          Generá copys listos para carrusel desde un texto, un audio o una imagen.
          Cada fuente va por separado.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="texto" className="gap-2">
            <Type className="size-4" /> Texto
          </TabsTrigger>
          <TabsTrigger value="audio" className="gap-2">
            <Mic className="size-4" /> Audio
          </TabsTrigger>
          <TabsTrigger value="imagen" className="gap-2">
            <ImageIcon className="size-4" /> Imagen
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
                  {loading ? <Loader2 className="animate-spin" /> : <WandSparkles />}
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
                    {audio ? formatBytes(audio.size) : "Cualquier formato audio/*, máx 15 MB"}
                  </span>
                </label>
                <input
                  id="audio-upload"
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm,audio/aac,audio/flac"
                  className="hidden"
                  onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
                />
                {audio && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAudio(null)}>
                    <X /> Quitar archivo
                  </Button>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={!audio || loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <WandSparkles />}
                  Generar desde audio
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="imagen">
          <Card>
            <form onSubmit={submitImage}>
              <CardContent className="space-y-3 pt-6">
                <label
                  htmlFor="image-upload"
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors hover:border-primary"
                >
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="Vista previa" className="max-h-48 rounded-md" />
                  ) : (
                    <FileImage className="size-8 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {image ? image.name : "Elegí una imagen (flyer, captura, foto)"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {image ? formatBytes(image.size) : "PNG, JPG o WEBP, máx 10 MB"}
                  </span>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
                />
                {image && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => pickImage(null)}>
                    <X /> Quitar imagen
                  </Button>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={!image || loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <WandSparkles />}
                  Generar desde imagen
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
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
            <CardContent className="pt-6 text-sm">{result.resumen}</CardContent>
          </Card>
          {result.versiones && <VersionesPorRed versiones={result.versiones} />}
          {result.generationId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="size-4" /> Carrusel listo para publicar
                </CardTitle>
                <CardDescription>
                  Un slide 1080×1080 por idea. Sin costo adicional.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {result.ideas.map((idea, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={`/api/carrusel/slide?id=${result.generationId}&index=${i}`}
                      alt={`Slide ${i + 1}: ${idea.titulo}`}
                      className="rounded-md border"
                      loading="lazy"
                    />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={downloadPdf} disabled={downloading}>
                  {downloading ? <Loader2 className="animate-spin" /> : <Download />}
                  Descargar PDF
                </Button>
              </CardFooter>
            </Card>
          )}
          {result.ideas.map((idea, i) => (
            <Card key={i}>
              <CardHeader>
                <Badge className="w-fit" variant="outline">Idea {i + 1}</Badge>
                {editing === i && draft ? (
                  <Input
                    value={draft.titulo}
                    onChange={(e) => setDraft({ ...draft, titulo: e.target.value })}
                    aria-label="Título"
                  />
                ) : (
                  <CardTitle className="text-lg">{idea.titulo}</CardTitle>
                )}
                {editing === i && draft ? (
                  <Input
                    value={draft.hook}
                    onChange={(e) => setDraft({ ...draft, hook: e.target.value })}
                    aria-label="Hook"
                  />
                ) : (
                  <CardDescription className="flex items-start gap-1.5">
                    <Quote className="mt-0.5 size-3.5 shrink-0" />
                    {idea.hook}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {editing === i && draft ? (
                  <Textarea
                    rows={6}
                    value={draft.puntos.join("\n")}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        puntos: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    aria-label="Puntos (uno por línea)"
                  />
                ) : (
                  <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                    {idea.puntos.map((p, j) => (
                      <li key={j}>{p}</li>
                    ))}
                  </ol>
                )}
              </CardContent>
              <CardFooter className="flex-col items-start gap-3">
                {editing === i && draft ? (
                  <Input
                    value={draft.cta}
                    onChange={(e) => setDraft({ ...draft, cta: e.target.value })}
                    aria-label="CTA"
                  />
                ) : (
                  <p className="flex items-start gap-1.5 text-sm font-medium">
                    <Megaphone className="mt-0.5 size-4 shrink-0" />
                    {idea.cta}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {editing === i ? (
                    <>
                      <Button size="sm" onClick={() => saveEdit(i)} disabled={saving}>
                        {saving ? <Loader2 className="animate-spin" /> : <Save />}
                        Guardar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setDraft(null); }}>
                        <X /> Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => startEdit(i)}>
                        <Pencil /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => regenSlide(i)}
                        disabled={regenIndex !== null || !result.generationId}
                        title={!result.generationId ? "Solo disponible en items guardados" : undefined}
                      >
                        {regenIndex === i ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                        Regenerar slide
                      </Button>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </section>
      )}

      {history.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <History className="size-4" /> Historial
          </h2>
          <div className="space-y-2">
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => openHistory(h.id)}
                className="w-full rounded-lg border p-3 text-left text-sm transition-colors hover:border-primary"
              >
                <span className="flex items-center gap-2">
                  <Badge variant="outline">{h.inputKind}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(h.createdAt).toLocaleString()} · {h.ideasCount} ideas
                  </span>
                </span>
                <span className="mt-1 block truncate text-muted-foreground">
                  {h.inputPreview || h.resumen}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
