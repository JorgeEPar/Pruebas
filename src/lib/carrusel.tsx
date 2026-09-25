import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import satori from "satori";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

export const SLIDE_SIZE = 1080;

export type SlideIdea = {
  hook: string;
  titulo: string;
  puntos: string[];
  cta: string;
};

let fontsCache: Array<{ name: string; data: Buffer; weight: 400 | 700; style: "normal" }> | null = null;

async function loadFonts() {
  if (fontsCache) return fontsCache;
  const base = join(process.cwd(), "node_modules", "@expo-google-fonts", "inter");
  const [regular, bold] = await Promise.all([
    readFile(join(base, "400Regular", "Inter_400Regular.ttf")),
    readFile(join(base, "700Bold", "Inter_700Bold.ttf")),
  ]);
  fontsCache = [
    { name: "Inter", data: regular, weight: 400, style: "normal" },
    { name: "Inter", data: bold, weight: 700, style: "normal" },
  ];
  return fontsCache;
}

function Slide({ idea, index, total }: { idea: SlideIdea; index: number; total: number }) {
  return (
    <div
      style={{
        width: SLIDE_SIZE,
        height: SLIDE_SIZE,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 90,
        background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 55%, #d946ef 100%)",
        fontFamily: "Inter",
        color: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          color: "#18181b",
          borderRadius: 48,
          padding: 70,
          minHeight: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              background: "#7c3aed",
              color: "#fff",
              borderRadius: 999,
              padding: "10px 28px",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            <span>
              {index + 1} / {total}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#7c3aed", fontStyle: "italic", marginBottom: 16 }}>
          <span>{idea.hook}</span>
        </div>
        <div style={{ display: "flex", fontSize: 62, fontWeight: 700, lineHeight: 1.15, marginBottom: 32 }}>
          <span>{idea.titulo}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 32 }}>
          {idea.puntos.map((p, j) => (
            <div key={j} style={{ display: "flex", gap: 16, fontSize: 34, lineHeight: 1.35 }}>
              <span style={{ color: "#d946ef", fontWeight: 700 }}>•</span>
              <span style={{ flex: 1 }}>{p}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            background: "#f5f3ff",
            borderRadius: 24,
            padding: "24px 32px",
            fontSize: 32,
            fontWeight: 700,
            color: "#4c1d95",
          }}
        >
          <span>{idea.cta}</span>
        </div>
      </div>
    </div>
  );
}

export async function renderSlidePng(
  idea: SlideIdea,
  index: number,
  total: number,
): Promise<Buffer> {
  const fonts = await loadFonts();
  const svg = await satori(<Slide idea={idea} index={index} total={total} />, {
    width: SLIDE_SIZE,
    height: SLIDE_SIZE,
    fonts,
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function renderCarouselPdf(ideas: SlideIdea[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < ideas.length; i++) {
    const png = await renderSlidePng(ideas[i], i, ideas.length);
    const img = await doc.embedPng(png);
    const page = doc.addPage([SLIDE_SIZE, SLIDE_SIZE]);
    page.drawImage(img, { x: 0, y: 0, width: SLIDE_SIZE, height: SLIDE_SIZE });
  }
  return Buffer.from(await doc.save());
}
