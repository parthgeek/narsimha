import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type SevaPayload = {
  name: string;
  phone: string;
  email: string;
  seva: string;
  message: string;
};

type SmtpError = Error & {
  code?: string;
  responseCode?: number;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\s\-()]{7,17}$/;
const templeAddress = "yoganarasimhabaggavalli@gmail.com";
const templePhone = "+91 99647 62267";
const archakaPhone = "+91 63625 97022";
const mapsUrl =
  "https://www.google.com/maps/search/?api=1&query=Sri+Yoga+Narasimha+Swamy+Temple+Baggavalli+Ajjampura+Karnataka";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

function readString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function parsePayload(value: unknown): SevaPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const body = value as Record<string, unknown>;

  // Honeypot: bots fill the hidden field, real devotees never see it.
  if (readString(body.honey, 200)) {
    return null;
  }

  const payload: SevaPayload = {
    name: readString(body.name, 120),
    phone: readString(body.phone, 20),
    email: readString(body.email, 254),
    seva: readString(body.seva, 120),
    message: readString(body.message, 5000),
  };

  if (
    !payload.name ||
    !phonePattern.test(payload.phone) ||
    !emailPattern.test(payload.email) ||
    !payload.seva
  ) {
    return null;
  }

  return payload;
}

function singleLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function isSmtpAuthError(error: unknown): error is SmtpError {
  if (!(error instanceof Error)) {
    return false;
  }

  const smtpError = error as SmtpError;
  return smtpError.code === "EAUTH" || smtpError.responseCode === 534;
}

export async function POST(request: Request) {
  let payload: SevaPayload | null = null;

  try {
    payload = parsePayload(await request.json());
  } catch {
    return NextResponse.json(
      { error: "The seva request could not be read." },
      { status: 400 },
    );
  }

  if (!payload) {
    return NextResponse.json(
      { error: "Please complete all required fields with valid details." },
      { status: 400 },
    );
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT ?? "587");
  const smtpSecure =
    process.env.SMTP_SECURE === undefined
      ? false
      : process.env.SMTP_SECURE === "true";

  if (!smtpUser || !smtpPass || !Number.isInteger(smtpPort)) {
    console.error("Seva form SMTP configuration is incomplete.");
    return NextResponse.json(
      { error: "Email is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  if (smtpHost === "smtp.gmail.com" && smtpPass.length !== 16) {
    console.error(
      "Seva form Gmail authentication requires a 16-character app password in SMTP_PASS.",
    );
    return NextResponse.json(
      { error: "Email is temporarily unavailable. Please try again shortly." },
      { status: 503 },
    );
  }

  const contactAddress = process.env.CONTACT_TO ?? templeAddress;
  const fromAddress =
    process.env.SMTP_FROM ?? `Yoga Narasimha Temple <${smtpUser}>`;
  const safeName = singleLine(payload.name);
  const safeSeva = singleLine(payload.seva);

  const details = [
    ["Name", payload.name],
    ["Phone", payload.phone],
    ["Email", payload.email],
    ["Seva", payload.seva],
  ];

  const detailsHtml = details
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:8px 16px 8px 0;color:#667085;vertical-align:top">${escapeHtml(label)}</td>
          <td style="padding:8px 0;color:#101828;font-weight:600">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    requireTLS: smtpHost === "smtp.gmail.com" && !smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: contactAddress,
      replyTo: {
        name: safeName,
        address: payload.email,
      },
      subject: `Seva request: ${safeSeva} - ${safeName}`,
      text: [
        "A new seva request was submitted through the temple website.",
        "",
        ...details.map(([label, value]) => `${label}: ${value}`),
        "",
        "Message:",
        payload.message || "Not provided",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#101828">
          <h1 style="font-size:24px;margin:0 0 16px">New seva request</h1>
          <p style="color:#475467">A new seva request was submitted through the temple website.</p>
          <table style="border-collapse:collapse;margin:24px 0">${detailsHtml}</table>
          <h2 style="font-size:16px;margin:24px 0 8px">Message</h2>
          <div style="padding:16px;background:#f2f4f7;border-radius:8px;white-space:pre-wrap;line-height:1.6">${escapeHtml(payload.message || "Not provided")}</div>
        </div>
      `,
    });

    await transporter.sendMail({
      from: fromAddress,
      to: {
        name: safeName,
        address: payload.email,
      },
      replyTo: contactAddress,
      subject: "Your seva request — Sri Yoga Narasimha Swamy Temple, Baggavalli",
      text: [
        `Namaste ${payload.name},`,
        "",
        "Thank you for your devotion. We have received your seva request and the temple will contact you to confirm the date and sankalpa.",
        "",
        `Seva requested: ${payload.seva}`,
        "",
        "Om Namo Narayanaya,",
        "Sri Yoga Narasimha Swamy Temple, Baggavalli",
        "",
        `Official email: ${templeAddress}`,
        `Contact: ${templePhone}`,
        `Archaka: ${archakaPhone}`,
        "Location: Baggavalli, about 3 km from Ajjampura",
        `Google Maps: ${mapsUrl}`,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#101828;line-height:1.6">
          <p>Namaste ${escapeHtml(payload.name)},</p>
          <p>Thank you for your devotion. We have received your seva request and the temple will contact you to confirm the date and sankalpa.</p>
          <p><strong>Seva requested:</strong> ${escapeHtml(payload.seva)}</p>
          <p style="margin:28px 0 0">Om Namo Narayanaya,</p>
          <p style="margin:4px 0 12px"><strong>Sri Yoga Narasimha Swamy Temple, Baggavalli</strong></p>
          <p style="margin:0">
            <strong>Official email:</strong> <a href="mailto:${templeAddress}" style="color:#7A2418">${templeAddress}</a><br>
            <strong>Contact:</strong> <a href="tel:+919964762267" style="color:#7A2418">${templePhone}</a><br>
            <strong>Archaka:</strong> <a href="tel:+916362597022" style="color:#7A2418">${archakaPhone}</a><br>
            <strong>Location:</strong> Baggavalli, about 3 km from Ajjampura<br>
            <a href="${mapsUrl}" style="color:#7A2418">Find the temple on Google Maps</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isSmtpAuthError(error)) {
      console.error(
        "Seva form SMTP authentication failed. For Gmail, use a 16-character app password generated after enabling 2-Step Verification.",
      );
      return NextResponse.json(
        { error: "Email is temporarily unavailable. Please try again shortly." },
        { status: 503 },
      );
    }

    console.error("Seva form email delivery failed:", error);
    return NextResponse.json(
      { error: "We could not send your request. Please try again shortly." },
      { status: 502 },
    );
  } finally {
    transporter.close();
  }
}
