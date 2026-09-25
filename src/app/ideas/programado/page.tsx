"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BellRing,
  Clock,
  Loader2,
  Mail,
  Plus,
  Send,
  Trash2,
  TriangleAlert,
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

type Interest = { id: string; topic: string; active: boolean; lastUsedAt: string | null };
type Schedule = { hour: number; emailTo: string; active: boolean } | null;
type Delivery = {
  id: string;
  topic: string;
  channel: string;
  status: string;
  error: string | null;
  sentAt: string;
};

export default function ProgramadoPage() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [schedule, setSchedule] = useState<Schedule>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [dailyLimit, setDailyLimit] = useState(1);
  const [topic, setTopic] = useState("");
  const [hour, setHour] = useState("8");
  const [emailTo, setEmailTo] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/programado", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setInterests(data.interests);
    setSchedule(data.schedule);
    setDeliveries(data.deliveries);
    setDailyLimit(data.dailyLimit ?? 1);
    if (data.schedule) {
      setHour(String(data.schedule.hour));
      setEmailTo(data.schedule.emailTo);
      setActive(data.schedule.active);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/programado", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled || !data) return;
        setInterests(data.interests);
        setSchedule(data.schedule);
        setDeliveries(data.deliveries);
        setDailyLimit(data.dailyLimit ?? 1);
        if (data.schedule) {
          setHour(String(data.schedule.hour));
          setEmailTo(data.schedule.emailTo);
          setActive(data.schedule.active);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function post(body: object) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/programado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falló la operación");
        return null;
      }
      await refresh();
      return data;
    } catch {
      setError("Error de red. Reintentá.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function addTopic(e: React.FormEvent) {
    e.preventDefault();
    if (topic.trim().length < 3 || busy) return;
    const data = await post({ action: "add-topic", topic: topic.trim() });
    if (data) {
      setTopic("");
      setNotice("Tema agregado");
    }
  }

  async function saveSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const data = await post({
      action: "save-schedule",
      hour: Number(hour),
      emailTo: emailTo.trim(),
      active,
    });
    if (data) setNotice(active ? "Programación activa" : "Programación pausada");
  }

  async function sendNow() {
    if (busy) return;
    const data = await post({ action: "send-now" });
    if (data) setNotice(`Enviado sobre "${data.topic}"`);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6 sm:p-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Contenido programado
          </h1>
          <Badge variant="secondary">Beta · Email</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Recibí tu digest diario por email. Cupo: {dailyLimit}/día por código.
        </p>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          {notice}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Temas de interés</CardTitle>
          <CardDescription>
            El sistema rota entre ellos evitando repetir los recientes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={addTopic} className="flex gap-2">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: email marketing para coaches"
              maxLength={200}
            />
            <Button type="submit" disabled={topic.trim().length < 3 || busy}>
              <Plus /> Agregar
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {interests.length === 0 && (
              <span className="text-sm text-muted-foreground">Sin temas todavía.</span>
            )}
            {interests.map((t) => (
              <Badge key={t.id} variant="outline" className="gap-1 py-1">
                {t.topic}
                <button
                  aria-label={`Quitar ${t.topic}`}
                  onClick={() => post({ action: "remove-topic", id: t.id })}
                  className="ml-1 hover:text-destructive"
                >
                  <Trash2 className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <form onSubmit={saveSchedule}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" /> Programación diaria
            </CardTitle>
            <CardDescription>Hora de Argentina (America/Argentina/Buenos_Aires).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">
                Hora
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                Estado
                <Button
                  type="button"
                  variant={active ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setActive(!active)}
                >
                  <BellRing /> {active ? "Activo" : "Pausado"}
                </Button>
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              Email destino
              <Input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="vos@tuemail.com"
                maxLength={320}
              />
            </label>
          </CardContent>
          <CardFooter className="gap-2">
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              <Mail /> Guardar
            </Button>
            <Button type="button" variant="outline" onClick={sendNow} disabled={busy || !schedule}>
              <Send /> Enviar ahora
            </Button>
          </CardFooter>
        </form>
      </Card>

      {deliveries.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Últimos envíos</h2>
          {deliveries.map((d) => (
            <div key={d.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
              <Badge variant={d.status === "sent" ? "default" : "destructive"}>
                {d.status === "sent" ? "enviado" : "falló"}
              </Badge>
              <span className="truncate">{d.topic}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {new Date(d.sentAt).toLocaleString()}
              </span>
            </div>
          ))}
          {deliveries.some((d) => d.status === "failed" && d.error) && (
            <p className="text-xs text-muted-foreground">
              Error del último fallo: {deliveries.find((d) => d.status === "failed")?.error}
            </p>
          )}
        </section>
      )}
    </main>
  );
}
