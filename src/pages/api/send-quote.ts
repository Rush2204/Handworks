import type { APIRoute } from "astro";
import nodemailer from "nodemailer";
import { buildQuoteEmail } from "../../lib/email-template";

// This endpoint must run on the server (not be prerendered),
// otherwise the SMTP credentials would never execute.
export const prerender = false;

// Loose email format check — full RFC validation is impractical and the
// SMTP server is the ultimate authority. This catches obvious typos.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface IncomingPayload {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  inquiryType?: unknown;
  message?: unknown;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Cache the transporter across requests so we don't reconnect every time.
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = import.meta.env.SMTP_HOST;
  const port = Number(import.meta.env.SMTP_PORT || 465);
  const user = import.meta.env.SMTP_USER;
  const pass = import.meta.env.SMTP_PASSWORD;
  // SMTP_SECURE controls implicit TLS: true for port 465, false for 587 (STARTTLS).
  const secure =
    String(import.meta.env.SMTP_SECURE ?? "true").toLowerCase() === "true";

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP credentials are not configured. Define SMTP_HOST, SMTP_USER and SMTP_PASSWORD in .env.",
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
}

export const POST: APIRoute = async ({ request }) => {
  // ---- 1. Parse JSON body --------------------------------------------------
  let body: IncomingPayload;
  try {
    body = (await request.json()) as IncomingPayload;
  } catch {
    return jsonResponse(400, { ok: false, error: "Invalid JSON payload." });
  }

  // ---- 2. Server-side validation (mirrors the HTML "required" attributes) -
  const fullName = asString(body.fullName);
  const email = asString(body.email);
  const phone = asString(body.phone);
  const company = asString(body.company);
  const inquiryType = asString(body.inquiryType);
  const message = asString(body.message);

  const errors: Record<string, string> = {};
  if (!fullName) errors.fullName = "Full name is required.";
  if (!email) errors.email = "Email address is required.";
  else if (!EMAIL_RE.test(email)) errors.email = "Email address is not valid.";
  if (!inquiryType) errors.inquiryType = "Inquiry type is required.";
  if (!message) errors.message = "Message is required.";
  // Defensive cap to keep abusive payloads from blowing up the SMTP body.
  if (message.length > 5000)
    errors.message = "Message is too long (max 5000 characters).";

  if (Object.keys(errors).length > 0) {
    return jsonResponse(422, {
      ok: false,
      error: "Validation failed.",
      fields: errors,
    });
  }

  // ---- 3. Build and send the email ----------------------------------------
  try {
    const tx = getTransporter();
    const recipient = import.meta.env.CONTACT_RECIPIENT;
    const from = import.meta.env.MAIL_FROM || import.meta.env.SMTP_USER;

    if (!recipient) {
      throw new Error("CONTACT_RECIPIENT is not configured in .env.");
    }

    const { html, text, subject } = buildQuoteEmail({
      fullName,
      email,
      phone,
      company,
      inquiryType,
      message,
      submittedAt: new Date(),
    });

    await tx.sendMail({
      from,
      to: recipient,
      // Reply-To points at the visitor so hitting "Reply" goes back to them
      // instead of the SMTP account.
      replyTo: `${fullName} <${email}>`,
      subject,
      text,
      html,
    });

    return jsonResponse(200, {
      ok: true,
      message: "Your message was sent successfully.",
    });
  } catch (err) {
    // Log the full error server-side; never leak credentials/details to the client.
    console.error("[send-quote] failed to send email:", err);
    return jsonResponse(500, {
      ok: false,
      error:
        "We could not send your message right now. Please try again later.",
    });
  }
};

// Reject anything other than POST with 405 instead of a generic 404.
export const ALL: APIRoute = () =>
  new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
