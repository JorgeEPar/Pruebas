"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, TriangleAlert } from "lucide-react";
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

export default function AccesoPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Código inválido");
        return;
      }
      router.push("/ideas");
    } catch {
      setError("Error de red. Reintentá.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm items-center p-6">
      <Card className="w-full">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5" /> Acceso beta
            </CardTitle>
            <CardDescription>
              Ingresá el código de invitación que te compartimos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BETA-XXXX-00"
              autoComplete="off"
              maxLength={32}
            />
            {error && (
              <p
                role="alert"
                className="mt-2 flex items-start gap-1.5 text-sm text-destructive"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={code.trim().length === 0 || loading}
            >
              {loading && <Loader2 className="animate-spin" />}
              Entrar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
