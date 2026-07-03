import "server-only";
import nodemailer from "nodemailer";
import type { SmtpAccount } from "@/lib/accounts";
import { getMailStyleForAccount } from "@/lib/mail-styles";
import { getMistakeFooterForAccount } from "@/lib/template";

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

function buildHtmlBody(
  accountId: string,
  body: string,
  mistakeFooter: string,
): string {
  const style = getMailStyleForAccount(accountId);
  const messageHtml = escapeHtml(body).replace(/\r?\n/g, "<br>\n");
  const footerHtml = escapeHtml(mistakeFooter.trim()).replace(/\r?\n/g, "<br>\n");

  const bodyStyle = [
    `font-family:${style.fontFamily}`,
    `font-size:${style.fontSize}`,
    `color:${style.textColor}`,
    `line-height:${style.lineHeight}`,
    `margin:0`,
    `padding:${style.padding}`,
  ].join(";");

  const footerStyle = [
    `margin-top:${style.footerMarginTop}`,
    `font-size:${style.footerSize}`,
    `color:${style.footerColor}`,
    style.footerLayout === "italic" ? "font-style:italic" : "",
  ]
    .filter(Boolean)
    .join(";");

  if (style.footerLayout === "plain") {
    return (
      `<!DOCTYPE html>\n` +
      `<html><head><meta charset="utf-8"></head>\n` +
      `<body style="${bodyStyle}">` +
      `<div>${messageHtml}${footerHtml ? `<br><br>${footerHtml}` : ""}</div>` +
      `</body></html>`
    );
  }

  return (
    `<!DOCTYPE html>\n` +
    `<html><head><meta charset="utf-8"></head>\n` +
    `<body style="${bodyStyle}">` +
    `<div>${messageHtml}</div>` +
    `<p style="${footerStyle}">${footerHtml}</p>` +
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
  accountId: string;
  account: { name: string; email: string };
  to: string;
  subject: string;
  body: string;
}): OutgoingMail {
  const mistakeFooter = getMistakeFooterForAccount(options.accountId);
  const text = options.body + mistakeFooter;

  return {
    from: { name: options.account.name, address: options.account.email },
    to: options.to,
    replyTo: options.account.email,
    subject: options.subject.trim(),
    text,
    html: buildHtmlBody(options.accountId, options.body, mistakeFooter),
    xMailer: false,
  };
}
