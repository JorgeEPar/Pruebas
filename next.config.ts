import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Satori carga wasm (yoga/harfbuzz) con paths de archivo: si Turbopack
  // lo empaqueta, resuelve mal (D:\ROOT\...) y el render falla en runtime.
  serverExternalPackages: ["satori"],
};

export default nextConfig;
