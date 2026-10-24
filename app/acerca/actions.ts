"use server";

import { Resend } from "resend";
import { buildContactEmail, type ContactMessage } from "@/lib/contact-email";

export type ContactField = "name" | "email" | "msg";

export type ContactState =
  | { status: "idle" }
  | {
      status: "invalid";
      errors: Partial<Record<ContactField, string>>;
      values: ContactMessage;
    }
  | { status: "sent"; name: string }
  | { status: "error"; values: ContactMessage };

const DEFAULT_FROM = "Arcade Vault <onboarding@resend.dev>";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ name, email, msg }: ContactMessage) {
  const errors: Partial<Record<ContactField, string>> = {};
  if (!name) errors.name = "NOMBRE OBLIGATORIO";
  else if (name.length > 60) errors.name = "NOMBRE DEMASIADO LARGO";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) errors.email = "CORREO NO VÁLIDO";
  if (!msg) errors.msg = "MENSAJE OBLIGATORIO";
  else if (msg.length > 2000) errors.msg = "MENSAJE DEMASIADO LARGO";
  return errors;
}

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const field = (key: string) => String(formData.get(key) ?? "").trim();
  const values: ContactMessage = { name: field("name"), email: field("email"), msg: field("msg") };

  // Honeypot: un humano nunca rellena `website`. Se finge éxito para no dar pistas al bot.
  if (field("website")) return { status: "sent", name: values.name };

  const errors = validate(values);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors, values };

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("[contacto] Faltan RESEND_API_KEY o CONTACT_TO_EMAIL; no se envía el correo.");
    return { status: "error", values };
  }

  try {
    const { subject, html, text } = buildContactEmail(values);
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
      to,
      replyTo: values.email,
      subject,
      html,
      text,
    });
    if (error) {
      console.error("[contacto] Resend rechazó el envío:", error);
      return { status: "error", values };
    }
  } catch (err) {
    console.error("[contacto] Error al llamar a Resend:", err);
    return { status: "error", values };
  }

  return { status: "sent", name: values.name };
}
