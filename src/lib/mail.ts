import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Sends email through a Gmail account using an app password (SMTP).
 *
 * Needs GMAIL_USER (the address mail is sent from) and GMAIL_APP_PASSWORD (a 16-character Google app
 * password, not the normal account password) in .env.local. Without them mailConfigured() is false and
 * callers fall back gracefully.
 */
function credentials() {
  const user = process.env.GMAIL_USER?.trim();
  // Google shows app passwords as four groups with spaces; the spaces aren't part of the password.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  return user && pass ? { user, pass } : null;
}

export function mailConfigured() {
  return credentials() !== null;
}

let transport: Transporter | undefined;

export async function sendMail(msg: { to: string; subject: string; text: string; html: string }): Promise<boolean> {
  const auth = credentials();
  if (!auth) return false;
  try {
    transport ??= nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth,
      connectionTimeout: 10_000,
      socketTimeout: 15_000,
    });
    await transport.sendMail({
      from: { name: process.env.MAIL_FROM_NAME?.trim() || "Career House Quest", address: auth.user },
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });
    return true;
  } catch (e) {
    // Drop the cached transport so a fixed password is picked up on the next try.
    transport = undefined;
    console.error("sendMail error:", (e as Error).message);
    return false;
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** The email that carries a default password. */
export function defaultPasswordEmail(opts: { name: string; password: string; signInUrl: string; byStaff: boolean }) {
  const why = opts.byStaff
    ? "Your password was reset by your school."
    : "You asked to reset your password on Career House Quest.";
  const text = [
    `Hi ${opts.name},`,
    "",
    why,
    `Your temporary password is: ${opts.password}`,
    "",
    `Sign in at ${opts.signInUrl} with this password. You'll be asked to choose a new one straight away.`,
    "",
    "If you didn't expect this email, tell your teacher or school admin.",
  ].join("\n");
  const html = `<p>Hi ${esc(opts.name)},</p>
<p>${why}</p>
<p>Your temporary password is:</p>
<p style="font:600 20px/1.4 monospace;background:#f6ecd8;padding:10px 14px;border-radius:8px;display:inline-block">${esc(opts.password)}</p>
<p><a href="${esc(opts.signInUrl)}">Sign in</a> with this password. You'll be asked to choose a new one straight away.</p>
<p style="color:#545270">If you didn't expect this email, tell your teacher or school admin.</p>`;
  return { subject: "Your temporary Career House Quest password", text, html };
}
