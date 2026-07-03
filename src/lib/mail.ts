import "server-only";
import nodemailer from "nodemailer";
import type { SmtpAccount } from "@/lib/accounts";

export function createGmailTransporter(account: SmtpAccount) {
  // Port 587 + STARTTLS matches typical mail-client behaviour (vs raw SSL on 465).
  return nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: account.email, pass: account.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    tls: { minVersion: "TLSv1.2" },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Small opt-out line — helps CAN-SPAM compliance and reduces spam reports. */
const OPT_OUT_TEXT =
  '\n\n—\nIf you prefer not to receive further messages, reply with "unsubscribe".';

const OPT_OUT_HTML =
  '<p style="margin-top:24px;font-size:12px;color:#666;">If you prefer not to receive further messages, reply with "unsubscribe".</p>';

function buildHtmlBody(body: string): string {
  const messageHtml = escapeHtml(body).replace(/\r?\n/g, "<br>");
  return (
    `<!DOCTYPE html>` +
    `<html><head><meta charset="utf-8"></head>` +
    `<body style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;line-height:1.5;margin:0;padding:0;">` +
    `<div>${messageHtml}</div>` +
    OPT_OUT_HTML +
    `</body></html>`
  );
}

export type OutgoingMail = {
  from: { name: string; address: string };
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
  xMailer: false;
};

export function buildOutgoingMail(options: {
  account: { name: string; email: string };
  to: string;
  subject: string;
  body: string;
}): OutgoingMail {
  const text = options.body + OPT_OUT_TEXT;

  return {
    from: { name: options.account.name, address: options.account.email },
    to: options.to,
    replyTo: options.account.email,
    subject: options.subject.trim(),
    text,
    html: buildHtmlBody(options.body),
    xMailer: false,
  };
}
