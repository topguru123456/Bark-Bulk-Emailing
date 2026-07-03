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

export function hashSlot(seed: string, slot: number): number {
  let hash = slot * 9973;
  const s = seed.toLowerCase().trim();
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Stable pick so the same client always gets the same variant from a pool. */
export function pickVariant<T>(items: T[], seed: string, slot = 0): T {
  if (items.length === 0) throw new Error("empty variant pool");
  return items[hashSlot(seed, slot) % items.length];
}

type SubjectParts = { name: string; sender: string; pick: (slot: number, n: number) => number };

type SubjectRecipe = (parts: SubjectParts) => string;

/**
 * Human subject lines — short, varied, no "Name, support for your Bark project" mail-merge feel.
 * Built from recipes per sender voice; same client always gets the same line.
 */
const SUBJECT_RECIPES_BY_ACCOUNT: Record<string, SubjectRecipe[]> = {
  "1": [
    ({ name }) => `Hi ${name}`,
    ({ name }) => `${name} — permit drawings`,
    () => `Permit drawing proposal`,
    () => `Architectural plans for city approval`,
    ({ name }) => `Quick note — ${name}`,
    () => `Proposal for your project`,
    ({ sender }) => `Permit package — ${sender}`,
    ({ name }) => `Following your listing — ${name}`,
  ],
  "2": [
    ({ name }) => `Hi ${name}`,
    ({ name }) => `${name} — permit help`,
    () => `Permit drawings`,
    () => `Quick note`,
    () => `Drawings for city approval`,
    ({ name }) => `Saw your listing — ${name}`,
    ({ sender }) => `${sender} — permit support`,
    () => `Your project request`,
    ({ name }) => `${name} — quick question`,
  ],
  "3": [
    ({ name }) => `Hi ${name}`,
    ({ name }) => `${name} — permit drawings`,
    () => `Permit-ready drawings`,
    () => `Architectural plans`,
    ({ name }) => `Your listing — ${name}`,
    () => `City permit proposal`,
    ({ sender }) => `Drawings — ${sender}`,
    ({ name }) => `Quick note for ${name}`,
  ],
  "4": [
    ({ name }) => `Hi ${name}`,
    () => `Faster city permit approval`,
    ({ name }) => `${name} — permit drawings`,
    () => `Permit submittal help`,
    () => `Quick note`,
    ({ name }) => `Your work request — ${name}`,
    () => `Code-compliant drawing set`,
    ({ sender }) => `Permit help — ${sender}`,
  ],
  "5": [
    ({ name }) => `Hi ${name}`,
    ({ name }) => `${name} — stamped drawings`,
    () => `Permit drawing services`,
    () => `Quick note`,
    () => `Drawings for city filing`,
    ({ name }) => `Following up — ${name}`,
    ({ sender }) => `${sender} — permit drawings`,
    () => `Your project`,
  ],
  "6": [
    ({ name }) => `Hi ${name}`,
    ({ name }) => `${name} — engineering review`,
    () => `Licensed P.E. services`,
    () => `Quick note`,
    ({ name }) => `Your project — ${name}`,
    () => `Structural / permit support`,
    ({ sender }) => `${sender}, P.E.`,
    () => `Engineering for your build`,
  ],
};

const FALLBACK_RECIPES: SubjectRecipe[] = [
  ({ name }) => `Hi ${name}`,
  () => `Quick note`,
  ({ name }) => `${name} — permit drawings`,
  () => `Following your listing`,
];

export function composeHumanSubject(
  accountId: string,
  clientEmail: string,
  ctx: PersonalizeContext,
): string {
  const name = formatDisplayName(ctx.clientName);
  const sender = ctx.senderName;
  const recipes = SUBJECT_RECIPES_BY_ACCOUNT[accountId] ?? FALLBACK_RECIPES;
  const idx = hashSlot(clientEmail, 0) % recipes.length;
  const pick = (slot: number, n: number) => hashSlot(clientEmail, slot + 1) % n;
  return recipes[idx]({ name, sender, pick });
}

/** Trim spammy patterns often flagged by filters. */
export function sanitizeSubject(subject: string): string {
  let s = subject.trim();
  s = s.replace(/([\u{1F300}-\u{1FAFF}\u2600-\u27BF])\1{2,}/gu, "$1");
  s = s.replace(/^[\s\u{1F300}-\u{1FAFF}\u2600-\u27BF]+/gu, "").trim();
  s = s.replace(/[\s\u{1F300}-\u{1FAFF}\u2600-\u27BF]+$/gu, "").trim();
  if (/^re:\s*/i.test(s) && !s.toLowerCase().includes("fwd:")) {
    s = s.replace(/^re:\s*/i, "").trim();
  }
  // "Name, something" reads like mail merge — prefer em dash when we control the format
  s = s.replace(/^([A-Z][a-z]+),\s+(?=[a-z])/u, "$1 — ");
  return s;
}
