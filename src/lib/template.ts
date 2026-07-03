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
    defaultSubject: "{Clientname} — Bark request review",
    defaultBody: `Dear {Clientname},

I am a licensed Professional Engineer and saw your Bark request.

I can help prepare a permit-ready package for your project, including architectural drawings and engineering coordination where the city requires it. My focus is to make the set complete enough for submission, not just attractive on paper.

If you can share the project address, scope, and any city comments you already have, I can review the likely requirements and outline the next step.

Respectfully,
David`,
  },
  "2": {
    defaultSubject: "Licensed P.E. for your Bark request",
    defaultBody: `Hello {Clientname},

I am a licensed Professional Engineer and saw your Bark request.

If you are still comparing options, I can help you identify what drawings or engineering items the city will expect before you spend time on the wrong package. I keep the process practical: review the scope, confirm the permit path, then prepare what is needed.

Reply with the project type and city, and I can tell you what I would check first.

Daniel`,
  },
  "3": {
    defaultSubject: "Bark permit drawing review",
    defaultBody: `Hello {Clientname},

I am a licensed Professional Engineer and reviewed your Bark request.

For permit work, the weak point is usually not one drawing; it is coordination between the architectural sheets, code notes, and engineering requirements. I can prepare or review the package so the submittal is technically consistent before it reaches plan check.

If you send the scope and jurisdiction, I can respond with the drawing list I would expect for approval.

Kind regards,
James`,
  },
  "4": {
    defaultSubject: "Plan-check help for your Bark request",
    defaultBody: `Hi {Clientname},

I am a licensed Professional Engineer and saw your Bark request.

My work is centered on permit approval: drawings that answer the city's review points, code notes that match the project, and engineering coordination before submittal. That usually saves more time than trying to fix a rejected set later.

If timing is important, send the project location and a short description. I can let you know what may slow the permit down.

Michael`,
  },
  "5": {
    defaultSubject: "Stamped drawings for Bark request",
    defaultBody: `Hi {Clientname},

I am a licensed Professional Engineer and saw your Bark request.

If the job needs stamped drawings or a clean permit set, I can help turn the scope into documents the city can actually review. I prefer to start with the practical items: location, work type, existing conditions, and whether structural changes are involved.

Send those details if you have them, and I can confirm whether I am a fit.

Joseph`,
  },
  "6": {
    defaultSubject: "P.E. review for your Bark request",
    defaultBody: `Dear {Clientname},

I am a licensed Professional Engineer and came across your Bark request.

I can assist with engineering review, structural calculations, and stamped documentation when your jurisdiction requires professional sign-off. If architectural sheets are already being prepared, I can coordinate with them; if not, I can advise what engineering information should be included.

Please reply with the project location and the type of work, and I can tell you what P.E. involvement is likely needed.

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
