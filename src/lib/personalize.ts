/**
 * Personalization — you enter the client's first name; {Clientname} is that name.
 * {SenderName} is the account display name (David, Daniel, …).
 */

export type PersonalizeContext = {
  clientName: string;
  senderName: string;
};

/** Title-case a first name: "joana" → "Joana", "MARY" → "Mary" */
export function formatDisplayName(raw: string): string {
  const s = raw.trim();
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function applyPersonalization(
  template: string,
  ctx: PersonalizeContext,
): string {
  const name = formatDisplayName(ctx.clientName);
  return template
    .replace(/\{Clientname\}/gi, name)
    .replace(/\{FirstName\}/gi, name)
    .replace(/\{SenderName\}/gi, ctx.senderName);
}

/** Trim spammy patterns often flagged by filters. */
export function sanitizeSubject(subject: string): string {
  let s = subject.trim();
  s = s.replace(/([\u{1F300}-\u{1FAFF}\u2600-\u27BF])\1{2,}/gu, "$1");
  s = s.replace(/^[\s\u{1F300}-\u{1FAFF}\u2600-\u27BF]+/gu, "").trim();
  s = s.replace(/[\s\u{1F300}-\u{1FAFF}\u2600-\u27BF]+$/gu, "").trim();
  // Strip fake Re: prefixes
  if (/^re:\s*/i.test(s)) {
    s = s.replace(/^re:\s*/i, "").trim();
  }
  // Avoid obvious mail-merge comma subjects if a user pastes one in.
  s = s.replace(/^([A-Z][a-z]+),\s+(?=[a-z])/u, "$1 — ");
  return s;
}
