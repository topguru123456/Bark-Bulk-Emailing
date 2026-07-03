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
 * Subject lines — unique vocabulary per account so 6 sends to one client
 * don't produce duplicate "Hi Joana" / "Quick note" subjects.
 */
const SUBJECT_RECIPES_BY_ACCOUNT: Record<string, SubjectRecipe[]> = {
  "1": [
    () => `Architectural proposal`,
    ({ name }) => `Drawing package for ${name}`,
    () => `City submission scope`,
    ({ name }) => `${name} — permit drawing proposal`,
    () => `Full permit package`,
    ({ sender }) => `Proposal — ${sender}`,
    () => `Code-compliant drawing set`,
    ({ name }) => `Scope for ${name}'s project`,
  ],
  "2": [
    ({ name }) => `Hey ${name}`,
    () => `Can you use an extra hand on drawings?`,
    () => `Permit set question`,
    ({ name }) => `${name} — quick one`,
    () => `Thought I'd reach out`,
    () => `City permit help`,
    ({ name }) => `Drawings for ${name}`,
    () => `Flexible on timeline`,
  ],
  "3": [
    () => `Interest in your posted work`,
    ({ name }) => `${name} — permit scope`,
    () => `Submission-ready drawings`,
    () => `Formal proposal — permit drawings`,
    ({ name }) => `Your listing — ${name}`,
    () => `IBC-compliant drawing set`,
    ({ sender }) => `${sender} — permit proposal`,
    () => `Review & compliance package`,
  ],
  "4": [
    () => `Shorter permit review cycles`,
    ({ name }) => `${name} — approval timeline`,
    () => `Reducing plan-check revisions`,
    () => `Submittal-ready documents`,
    ({ name }) => `Permit path for ${name}`,
    () => `Sample work available`,
    ({ sender }) => `Permit support — ${sender}`,
    () => `From design to approval`,
  ],
  "5": [
    () => `Stamped drawings`,
    ({ name }) => `${name}`,
    () => `Ready for city filing`,
    () => `Permit docs`,
    ({ name }) => `Drawings — ${name}`,
    () => `Need stamped set?`,
    () => `Building code filing set`,
    ({ name }) => `about your listing`,
  ],
  "6": [
    () => `P.E. review & stamp`,
    ({ name }) => `${name} — structural sign-off`,
    () => `Licensed engineer availability`,
    () => `Engineering calculations`,
    ({ name }) => `Your build — ${name}`,
    ({ sender }) => `${sender}, P.E.`,
    () => `Professional engineer services`,
    () => `Calc package & stamp`,
  ],
};

const FALLBACK_RECIPES: SubjectRecipe[] = [
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
  // Strip fake Re: prefixes
  if (/^re:\s*/i.test(s)) {
    s = s.replace(/^re:\s*/i, "").trim();
  }
  s = s.replace(/^([A-Z][a-z]+),\s+(?=[a-z])/u, "$1 — ");
  return s;
}
