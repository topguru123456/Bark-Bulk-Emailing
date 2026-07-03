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

/** Greeting swaps for default bodies — "Hello, Joana" vs "Hi Joana" etc. */
const GREETING_VARIANTS = [
  "Hi {Clientname}",
  "Hello {Clientname}",
  "Hello, {Clientname}",
  "Hi, {Clientname}",
];

/** Default first-line opener in each template body (replaced with a variant at send). */
const DEFAULT_OPENER_BY_ACCOUNT: Record<string, string> = {
  "1": "I hope this message finds you well.",
  "2": "I hope you're doing well.",
  "3": "Hope you are doing well.",
  "4": "I have reviewed the work request you posted to bark.com.",
  "5": "How are you?",
  "6": "I hope you are doing well.",
};

/** Alternate openers swapped on default bodies (per account voice). */
const OPENER_VARIANTS_BY_ACCOUNT: Record<string, string[]> = {
  "1": [
    "I hope this message finds you well.",
    "I wanted to reach out about your project.",
    "I saw your listing and thought I'd get in touch.",
  ],
  "2": [
    "I hope you're doing well.",
    "I saw your listing and wanted to reach out.",
    "I came across your project and thought I'd write.",
  ],
  "3": [
    "Hope you are doing well.",
    "I saw your project online and wanted to connect.",
    "I'm reaching out about the work you posted.",
  ],
  "4": [
    "I have reviewed the work request you posted to bark.com.",
    "I saw your listing and wanted to follow up.",
    "I'm writing about the permit work you need.",
  ],
  "5": [
    "How are you?",
    "I hope you're doing well.",
    "I saw your project and wanted to reach out.",
  ],
  "6": [
    "I hope you are doing well.",
    "I came across your project and wanted to connect.",
    "I'm reaching out about the work you posted.",
  ],
};

/** Account id → default compose content (see .env.local account order). */
export const TEMPLATES_BY_ACCOUNT_ID: Record<string, AccountTemplate> = {
  "1": {
    defaultSubject: "Proposal for Bark Project Services",
    defaultBody: `Hi, {Clientname}

I hope this message finds you well.

We are pleased to submit our proposal for providing architectural and engineering services, including full permit drawing packages for city submission and approval within the United States.

Our team specializes in preparing code-compliant construction documents tailored to local jurisdiction requirements, ensuring smooth permit processing and reduced revision cycles.

Scope of Services:
- Architectural permit drawings
- Engineering coordination (structural / MEP as required)
- Code compliance review
- City submission support

We would be glad to discuss your project in detail and tailor our services to your specific requirements.

Thank you for considering our proposal.

Kind regards,
David`,
  },
  "2": {
    defaultSubject: "Let's Support Your Bark Project",
    defaultBody: `Hello, {Clientname}

I hope you're doing well.

We help design professionals and contractors prepare architectural and engineering drawings for city permits across the U.S.

If you're currently working on a project that needs permit submission support, we can help prepare a complete and compliant drawing set.

We are flexible and easy to coordinate with, and can adapt to your project workflow and timeline.

Let me know if you'd like to connect.

Best, Daniel`,
  },
  "3": {
    defaultSubject: "Permit drawing services for your Bark project",
    defaultBody: `Hello, {Clientname}

Hope you are doing well.

I am writing to express my interest in your project on bark.com and to formally submit my proposal for architectural and engineering permit drawing services.

I specialize in preparing code-compliant permit drawing packages for city approvals across the United States, ensuring accuracy, compliance, and smooth permitting processes.

What I Provide:
- Full architectural permit drawing sets
- Structural coordination (as required)
- Code compliance review (IBC / local amendments)
- City submission-ready documentation
- Revisions based on reviewer comments (if needed)

My Working Approach:
I begin by carefully reviewing your project requirements and jurisdiction standards. Then I develop a coordinated drawing set that aligns with both design intent and permitting regulations. Before submission, I perform a compliance check to reduce revision cycles and improve approval speed.

I would be glad to support your project and deliver a complete permit-ready package efficiently and professionally.

Kind regards,
James`,
  },
  "4": {
    defaultSubject: "Get Faster City Permit Approval for your Bark Project",
    defaultBody: `Hello, {Clientname}

I have reviewed the work request you posted to bark.com.

Getting city permits approved can be time-consuming and complex, especially when drawings do not fully meet jurisdiction requirements.

We help architects, developers, and contractors by preparing accurate and code-compliant permit drawing packages that reduce delays and revision cycles.

Our services include:
- Architectural permit drawings
- Engineering coordination
- Code compliance verification
- City submittal-ready documents

Our goal is to help you move from design to approval faster and with fewer revisions.

Please let us know if you would like to review our sample work.

Sincerely,
Michael`,
  },
  "5": {
    defaultSubject: "Permit Drawing Services for Your Bark Project",
    defaultBody: `Hello, {Clientname}
How are you?

We provide architectural and engineering permit drawing services for city approvals across the United States.

Our deliverables include complete drawing sets prepared according to local building codes and submission requirements, ready for permit filing.

If you are currently working on a project that requires stamped or permit-ready drawings, we would be happy to assist.

Looking forward to your response.

Best regards,
Joseph`,
  },
  "6": {
    defaultSubject: "Licensed P.E. Services for Your Bark Project",
    defaultBody: `Dear {Clientname},

I hope you are doing well.

I came across your project on Bark and would be pleased to assist you. As a licensed Professional Engineer (P.E.), I can provide the expertise needed to successfully complete your project.

I look forward to learning more about your requirements and discussing how I can best support your project.

Thank you for your time and consideration. I look forward to hearing from you.

Sincerely,
Robert, P.E.`,
  },
};

/** Per-account “wrong recipient” note — unique wording to match each sender’s voice. */
const MISTAKE_FOOTER_BY_ACCOUNT_ID: Record<string, string> = {
  "1": `\n\nP.S. If this proposal reached you in error, my apologies — a quick reply is all I need.`,
  "2": `\n\nSorry if this ended up with the wrong person — just reply if so and I'll take care of it.`,
  "3": `\n\nIf you received this in error, I apologize for the inconvenience. A brief reply would help me correct it.`,
  "4": `\n\nShould this message not be intended for you, please accept my apologies. A short reply would be appreciated.`,
  "5": `\n\nApologies if this wasn't meant for you — feel free to reply and I'll sort it out right away.`,
  "6": `\n\nIf you are not the intended recipient, please disregard this note and let me know. My sincere apologies for any confusion.`,
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
    const newGreeting = pickVariant(GREETING_VARIANTS, clientEmail, 2);
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
