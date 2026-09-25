import Link from "next/link";
import { ArrowRight, CalendarClock, Images, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURES = [
  {
    icon: Share2,
    title: "Versiones por red",
    desc: "El mismo contenido adaptado a LinkedIn, Instagram, TikTok y X en un click, listo para copiar.",
  },
  {
    icon: Images,
    title: "Texto, audio e imagen",
    desc: "Pegá un texto, subí una nota de voz o un flyer. La IA extrae ideas con hook, copy y CTA.",
  },
  {
    icon: CalendarClock,
    title: "Digest diario por email",
    desc: "Programá tus temas y recibí contenido nuevo cada mañana sin abrir la web.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl space-y-12 px-4 py-12 sm:px-6">
      <section className="space-y-5 text-center">
        <Badge variant="secondary">Beta · Para agencias y creadores</Badge>
        <h1 className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          De contenido a ideas listas para publicar
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Subí un texto, un audio o una imagen y generá copys con gancho,
          versiones por red social y un digest diario en tu email.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/acceso"
            className={buttonVariants({ size: "lg" })}
          >
            Probar gratis <ArrowRight />
          </Link>
          <Link
            href="/ideas/programado"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Ver programado
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <f.icon className="size-6 text-primary" />
              <CardTitle className="text-base">{f.title}</CardTitle>
              <CardDescription>{f.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <footer className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>Contenido IA · MVP en construcción</span>
        <Link href="/debug" className="underline">
          debug
        </Link>
      </footer>
    </main>
  );
}
