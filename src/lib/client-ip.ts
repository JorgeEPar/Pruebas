export function clientIp(req: Request): string {
  const raw =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    "local";
  const clean = raw.replace(/[^a-zA-Z0-9.:]/g, "").slice(0, 64);
  return clean || "local";
}
