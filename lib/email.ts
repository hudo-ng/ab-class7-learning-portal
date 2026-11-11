import { Resend } from "resend";

let client: Resend | null = null;
function resend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: EmailMessage) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is not set");

  const { error } = await resend().emails.send({
    from,
    to,
    subject,
    text,
    html,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
  });
  if (error) throw new Error(`Email not sent: ${error.message}`);
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function buttonEmail(opts: {
  heading: string;
  intro: string;
  button: string;
  url: string;
  footer: string;
}) {
  const { heading, intro, button, url, footer } = opts;
  const text = `${heading}\n\n${intro}\n\n${url}\n\n${footer}`;
  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#111">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:24px">
    <p style="font-size:18px;font-weight:bold;margin:0 0 12px">${escapeHtml(heading)}</p>
    <p style="font-size:15px;line-height:1.5;margin:0 0 20px">${escapeHtml(intro)}</p>
    <p style="margin:0 0 20px">
      <a href="${escapeHtml(url)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:15px">${escapeHtml(button)}</a>
    </p>
    <p style="font-size:13px;line-height:1.5;color:#555;margin:0 0 8px;word-break:break-all">${escapeHtml(url)}</p>
    <p style="font-size:13px;line-height:1.5;color:#555;margin:0">${escapeHtml(footer)}</p>
  </div>
</body></html>`;
  return { text, html };
}
