/**
 * Default subject + body per sending account (matched by account id 1–6).
 * Placeholder: {Clientname} — the first name you enter on the Send tab.
 * The template body is what gets sent, except for placeholder replacement.
 */

import {
  applyPersonalization,
  sanitizeSubject,
  type PersonalizeContext,
} from "@/lib/personalize";

export type AccountTemplate = {
  defaultSubject: string;
  defaultBody: string;
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
    defaultSubject: "Job Request on Bark",
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

/** Per-account “wrong recipient” note — structure and tone differ, not just wording. */
const MISTAKE_FOOTER_BY_ACCOUNT_ID: Record<string, string> = {
  "1": `\n\nP.S. If I reached the wrong person, please accept my apologies — a brief reply is enough.`,
  "2": `\n\nIf this was sent to the wrong person, please let me know and I will correct it.`,
  "3": `\n\nIf this message was not intended for you, I apologize for the error. A short reply would help me correct my records.`,
  "4": `\n\nIf you are not the right contact for this request, my apologies — please reply and I will update my notes.`,
  "5": `\n\nIf I reached you by mistake, please reply and I will not contact you again about this request.`,
  "6": `\n\nIf you received this correspondence in error, please notify me and accept my apologies.`,
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

function shouldUseLegacySubjectCleanup(accountId: string, subject: string): boolean {
  const defaults = getTemplateForAccount(accountId);
  if (subject === defaults.defaultSubject) return false;
  if (/^re:\s*/i.test(subject.trim())) return true;
  if (/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(subject)) return true;
  if (/,\s*(support|proposal|permit|engineering|licensed)/i.test(subject)) return true;
  return false;
}

/** Send the visible subject with placeholder replacement and spammy cleanup only. */
export function resolveSubjectForSend(options: {
  accountId: string;
  subjectFromTemplate: string;
  clientEmail: string;
  ctx: PersonalizeContext;
}): string {
  const { accountId, subjectFromTemplate, ctx } = options;

  const raw = shouldUseLegacySubjectCleanup(accountId, subjectFromTemplate)
    ? sanitizeSubject(subjectFromTemplate)
    : subjectFromTemplate;

  return sanitizeSubject(applyPersonalization(raw, ctx));
}

/** Send the visible body with placeholder replacement only. */
export function resolveBodyForSend(options: {
  accountId: string;
  bodyFromTemplate: string;
  clientEmail: string;
  ctx: PersonalizeContext;
}): string {
  return applyPersonalization(options.bodyFromTemplate, options.ctx);
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
