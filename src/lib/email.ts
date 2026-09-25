import "server-only";

import nodemailer from "nodemailer";

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

export type EmailDriver = "brevo" | "smtp";

export function emailDriver(): EmailDriver {
  return process.env.EMAIL_DRIVER === "smtp" ? "smtp" : "brevo";
}

function smtpTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
  });
}

async function sendViaSmtp(to: string, subject: string, html: string): Promise<void> {
  await smtpTransport().sendMail({
    from: process.env.SMTP_FROM ?? "contenido@localhost",
    to,
    subject,
    html,
  });
}

async function sendViaBrevo(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.BREVO_API_KEY) {
    throw new Error(
      "Falta BREVO_API_KEY. Creala gratis en https://app.brevo.com/settings/keys/api-keys (300 emails/día) y agregala al .env",
    );
  }
  const res = await fetch(BREVO_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME ?? "Contenido IA",
        email: process.env.BREVO_SENDER_EMAIL ?? "noreply@example.com",
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo ${res.status}: ${body.slice(0, 200)}`);
  }
}

export function assertEmailConfigured() {
  if (emailDriver() === "smtp") return; // Mailpit local no requiere key
  if (!process.env.BREVO_API_KEY) {
    throw new Error(
      "Falta BREVO_API_KEY. Creala gratis en https://app.brevo.com/settings/keys/api-keys (300 emails/día) y agregala al .env",
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type DigestContent = {
  topic: string;
  resumen: string;
  ideas: Array<{ hook: string; titulo: string; puntos: string[]; cta: string }>;
  versiones: {
    linkedin: string;
    instagram: string;
    tiktok: string;
    x: string;
  };
};

export function renderDigestHtml(c: DigestContent): string {
  const ideas = c.ideas
    .map(
      (idea, i) => `
      <h3>${i + 1}. ${escapeHtml(idea.titulo)}</h3>
      <p><em>${escapeHtml(idea.hook)}</em></p>
      <ul>${idea.puntos.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
      <p><strong>${escapeHtml(idea.cta)}</strong></p>`,
    )
    .join("");
  return `
  <h2>Tu contenido de hoy: ${escapeHtml(c.topic)}</h2>
  <p>${escapeHtml(c.resumen)}</p>
  ${ideas}
  <hr/>
  <h3>LinkedIn</h3><p>${escapeHtml(c.versiones.linkedin).replace(/\n/g, "<br/>")}</p>
  <h3>Instagram</h3><p>${escapeHtml(c.versiones.instagram).replace(/\n/g, "<br/>")}</p>
  <h3>TikTok (guion)</h3><p>${escapeHtml(c.versiones.tiktok).replace(/\n/g, "<br/>")}</p>
  <h3>X</h3><p>${escapeHtml(c.versiones.x).replace(/\n/g, "<br/>")}</p>`;
}

export async function sendDigestEmail(
  to: string,
  subject: string,
  content: DigestContent,
): Promise<void> {
  assertEmailConfigured();
  const html = renderDigestHtml(content);
  if (emailDriver() === "smtp") {
    await sendViaSmtp(to, subject, html);
    return;
  }
  await sendViaBrevo(to, subject, html);
}
