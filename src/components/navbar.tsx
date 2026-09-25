"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/ideas", label: "Generar" },
  { href: "/ideas/programado", label: "Programado" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/acceso", { method: "DELETE" });
    router.push("/acceso");
  }

  const inApp = pathname.startsWith("/ideas");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-2xl items-center gap-1 px-4 sm:px-6">
        <Link href="/" className="mr-2 flex items-center gap-1.5 font-bold">
          <Sparkles className="size-4 text-primary" />
          Contenido IA
        </Link>
        {LINKS.map((l) => {
          const active =
            l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                !active && "text-muted-foreground",
              )}
            >
              {l.label}
            </Link>
          );
        })}
        <span className="flex-1" />
        <ThemeToggle />
        {inApp && (
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut /> Salir
          </Button>
        )}
      </nav>
    </header>
  );
}
