/**
 * Default subject + body per sending account (matched by account id 1–6).
 * Placeholder: {Clientname} — the first name you enter on the Send tab.
 * Default sends get a human subject line + slight greeting/opener variation per client.
 */

import {
  applyPersonalization,
  composeHumanSubject,
  pickVariant,
  sanitizeSubject,
  type PersonalizeContext,
} from "@/lib/personalize";

export type AccountTemplate = {
  defaultSubject: string;
  defaultBody: string;
};

/** Per-account greetings — not shared, so six sends don't all open "Hi Joana". */
const GREETING_VARIANTS_BY_ACCOUNT: Record<string, string[]> = {
  "1": ["Dear {Clientname},", "Dear {Clientname}", "Hello {Clientname},"],
  "2": ["Hey {Clientname}", "Hi {Clientname}", "{Clientname} —"],
  "3": ["Hello {Clientname},", "Dear {Clientname},", "Good day {Clientname},"],
  "4": ["Hello {Clientname},", "Hi {Clientname},", "{Clientname},"],
  "5": ["Hi {Clientname}", "{Clientname},", "Hey {Clientname},"],
  "6": ["Dear {Clientname},", "Dear {Clientname}", "To {Clientname},"],
};

/** Default first-line opener in each template body (replaced with a variant at send). */
const DEFAULT_OPENER_BY_ACCOUNT: Record<string, string> = {
  "1": "Thank you for the opportunity to submit a proposal for your project.",
  "2": "Saw your listing and figured I'd reach out directly.",
  "3": "I am writing to express my interest in the work you posted and to submit a formal proposal.",
  "4": "Permit delays usually come from drawings that don't match what the city expects — that's the part we focus on.",
  "5": "Need stamped drawings filed with the city?",
  "6": "I am a licensed Professional Engineer and would be glad to review whether your project needs a P.E. stamp or structural calcs.",
};

/** Alternate openers — distinct voice per account, no copy-paste across senders. */
const OPENER_VARIANTS_BY_ACCOUNT: Record<string, string[]> = {
  "1": [
    "Thank you for the opportunity to submit a proposal for your project.",
    "We would like to put forward a formal scope for architectural and engineering permit drawings.",
    "Following your listing, our team prepared a brief outline of how we can support city submission.",
  ],
  "2": [
    "Saw your listing and figured I'd reach out directly.",
    "Looks like you might need a permit drawing set — that's what I do most days.",
    "Not sure if you've already lined someone up, but I had a minute and wanted to write.",
  ],
  "3": [
    "I am writing to express my interest in the work you posted and to submit a formal proposal.",
    "Your project requirements align closely with the permit packages I prepare for city review.",
    "After reviewing your listing, I believe I can deliver a complete submission-ready drawing set.",
  ],
  "4": [
    "Permit delays usually come from drawings that don't match what the city expects — that's the part we focus on.",
    "Most plan-check cycles stretch out because of fixable drawing gaps — we close those before submittal.",
    "I reviewed what you posted and think we can shorten the path from drawings to approval.",
  ],
  "5": [
    "Need stamped drawings filed with the city?",
    "If you're still looking for someone to turn around a filing set, I can help.",
    "Quick note — I do permit-ready drawing packages when you need them fast.",
  ],
  "6": [
    "I am a licensed Professional Engineer and would be glad to review whether your project needs a P.E. stamp or structural calcs.",
    "Depending on jurisdiction, your build may require engineering sign-off — that's where I come in.",
    "I focus on calculations, structural review, and P.E. stamping rather than full architectural sets.",
  ],
};

/** Account id → default compose content (see .env.local account order). */
export const TEMPLATES_BY_ACCOUNT_ID: Record<string, AccountTemplate> = {
  "1": {
    defaultSubject: "Proposal for Bark Project Services",
    defaultBody: `Dear {Clientname},

Thank you for the opportunity to submit a proposal for your project.

Our firm provides integrated architectural and engineering services for permit submission across the United States. We prepare code-compliant construction documents aligned to local jurisdiction requirements.

Scope of Services:
- Architectural permit drawings
- Engineering coordination (structural / MEP as required)
- Code compliance review
- City submission support

We would welcome the chance to discuss your timeline and tailor the deliverable list to your needs.

Respectfully,
David
Architectural & Engineering Services`,
  },
  "2": {
    defaultSubject: "Let's Support Your Bark Project",
    defaultBody: `Hey {Clientname}

Saw your listing and figured I'd reach out directly.

I help contractors and designers get permit drawings through city review — usually architectural sets with structural coordination when it's needed. I'm easy to work with on timeline and markups.

If you're still looking for someone, happy to jump on a quick call or just reply here.

— Daniel`,
  },
  "3": {
    defaultSubject: "Permit drawing services for your Bark project",
    defaultBody: `Hello {Clientname},

I am writing to express my interest in the work you posted and to submit a formal proposal.

1. Scope
Full architectural permit drawing sets, structural coordination where required, and documentation formatted for your city's plan-check process.

2. Compliance
Drawings prepared to IBC and applicable local amendments, with a pre-submittal review to reduce reviewer comments.

3. Deliverables
Submission-ready PDF sets, revision support through plan check, and coordination with your design intent.

I work independently and manage projects from intake through approval. Please let me know if you would like to discuss jurisdiction-specific requirements.

Kind regards,
James
Independent Permit Drawing Consultant`,
  },
  "4": {
    defaultSubject: "Get Faster City Permit Approval for your Bark Project",
    defaultBody: `Hello {Clientname},

Permit delays usually come from drawings that don't match what the city expects — that's the part we focus on.

We prepare architectural permit packages and coordinate engineering so submittals move through plan check with fewer rounds. Typical scope covers drawing production, code verification, and city-ready document formatting.

If timing matters on your side, reply and I can share relevant samples and a realistic turnaround.

Michael
Permit Drawing Services`,
  },
  "5": {
    defaultSubject: "Permit Drawing Services for Your Bark Project",
    defaultBody: `Hi {Clientname}

Need stamped drawings filed with the city?

I turn around permit-ready sets — architectural plus engineering when stamps are required — built to local code and formatted for filing. Short projects welcome.

Reply if you want availability this week.

Joseph`,
  },
  "6": {
    defaultSubject: "Licensed P.E. Services for Your Bark Project",
    defaultBody: `Dear {Clientname},

I am a licensed Professional Engineer and would be glad to review whether your project needs a P.E. stamp or structural calcs.

My practice covers engineering analysis, structural review, and stamped documentation for jurisdictions that require professional sign-off. I do not produce full architectural plan sets — I partner on the engineering side or stamp coordinated drawings prepared by others.

If your permit path requires P.E. involvement, I would be pleased to discuss scope and schedule.

Sincerely,
Robert, P.E.
Licensed Professional Engineer`,
  },
};

/** Per-account “wrong recipient” note — structure and tone differ, not just wording. */
const MISTAKE_FOOTER_BY_ACCOUNT_ID: Record<string, string> = {
  "1": `\n\n(P.S. If this proposal was sent to the wrong person, please accept my apologies — a brief reply is sufficient.)`,
  "2": `\n\n(wrong person? just say so — no worries)`,
  "3": `\n\nIf this message was not intended for you, I apologize for the error. A short reply would help me correct my records.`,
  "4": `\n\n— If you are not the intended recipient, my apologies; a quick note back would be appreciated.`,
  "5": `\n\nnot for you? my bad, reply and i'll fix it`,
  "6": `\n\nIf you received this correspondence in error, please notify me at your earliest convenience. Respectfully, Robert`,
};

const DEFAULT_MISTAKE_FOOTER =
  "\n\nIf this message reached you in error, my apologies — please reply and let me know.";

export function getMistakeFooterForAccount(accountId: string): string {
  return MISTAKE_FOOTER_BY_ACCOUNT_ID[accountId] ?? DEFAULT_MISTAKE_FOOTER;
}

export function getTemplateForAccount(accountId: string): AccountTemplate {
  return (
    TEMPLATES_BY_ACCOUNT_ID[accountId] ?? {
      defaultSubject: "",
      defaultBody: "",
    }
  );
}

function shouldUseDefaultHumanization(accountId: string, text: string, kind: "subject" | "body"): boolean {
  const defaults = getTemplateForAccount(accountId);
  const baseline = kind === "subject" ? defaults.defaultSubject : defaults.defaultBody;

  if (text === baseline) return true;

  if (kind === "subject") {
    const sanitized = sanitizeSubject(text);
    const defaultSanitized = sanitizeSubject(baseline);
    if (sanitized === defaultSanitized) return true;
    if (/^re:\s*/i.test(text.trim())) return true;
    if (/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(text)) return true;
    // Old emoji defaults or legacy "Name, support for your Bark project" style
    if (/,\s*(support|proposal|permit|engineering|licensed)/i.test(text)) return true;
    if (/your bark project/i.test(text)) return true;
  }

  if (kind === "body") {
    // Still on default if only whitespace differs, or starts with default greeting block
    const norm = (s: string) => s.replace(/\r\n/g, "\n").trim();
    if (norm(text) === norm(baseline)) return true;
    const firstBlock = norm(text).split("\n\n")[0] ?? "";
    const defaultFirst = norm(baseline).split("\n\n")[0] ?? "";
    if (firstBlock === defaultFirst) return true;
  }

  return false;
}

/** Compose a short human subject when using default / legacy templates. */
export function resolveSubjectForSend(options: {
  accountId: string;
  subjectFromTemplate: string;
  clientEmail: string;
  ctx: PersonalizeContext;
}): string {
  const { accountId, subjectFromTemplate, clientEmail, ctx } = options;

  const raw = shouldUseDefaultHumanization(accountId, subjectFromTemplate, "subject")
    ? composeHumanSubject(accountId, clientEmail, ctx)
    : subjectFromTemplate;

  return sanitizeSubject(applyPersonalization(raw, ctx));
}

/** Swap greeting + opener on default bodies so copy isn't byte-identical every send. */
export function resolveBodyForSend(options: {
  accountId: string;
  bodyFromTemplate: string;
  clientEmail: string;
  ctx: PersonalizeContext;
}): string {
  const { accountId, bodyFromTemplate, clientEmail, ctx } = options;
  let body = bodyFromTemplate;

  if (shouldUseDefaultHumanization(accountId, bodyFromTemplate, "body")) {
    const normalized = body.replace(/\r\n/g, "\n");
    const firstLine = normalized.split("\n")[0] ?? "";
    const defaultOpener = DEFAULT_OPENER_BY_ACCOUNT[accountId];
    const openers = OPENER_VARIANTS_BY_ACCOUNT[accountId] ?? [defaultOpener];
    const greetings = GREETING_VARIANTS_BY_ACCOUNT[accountId] ?? ["Hi {Clientname}"];
    const newGreeting = pickVariant(greetings, clientEmail, 2);
    const newOpener = pickVariant(openers, clientEmail, 3);

    body = normalized.replace(firstLine, newGreeting);
    if (defaultOpener) {
      body = body.replace(defaultOpener, newOpener);
    }
  }

  return applyPersonalization(body, ctx);
}

/** Replace personalization placeholders in subject or body. */
export function personalizeContent(
  template: string,
  ctx: PersonalizeContext,
): string {
  return applyPersonalization(template, ctx);
}

/** @deprecated Use personalizeContent with full context. */
export function applyClientPlaceholders(
  template: string,
  clientName: string,
): string {
  return applyPersonalization(template, { clientName, senderName: "" });
}
