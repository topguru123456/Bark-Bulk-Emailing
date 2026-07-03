/**
 * Per-sender visual identity for HTML part — each account should not look
 * like it came from the same mail merge system.
 */

export type AccountMailStyle = {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  textColor: string;
  footerColor: string;
  footerSize: string;
  footerMarginTop: string;
  padding: string;
  /** plain = footer in same block; separate = distinct footer paragraph */
  footerLayout: "plain" | "separate" | "italic";
};

export const MAIL_STYLE_BY_ACCOUNT_ID: Record<string, AccountMailStyle> = {
  "1": {
    fontFamily: "Georgia, 'Times New Roman', Times, serif",
    fontSize: "14px",
    lineHeight: "1.65",
    textColor: "#1a1a1a",
    footerColor: "#444",
    footerSize: "13px",
    footerMarginTop: "1.75em",
    padding: "20px 24px",
    footerLayout: "separate",
  },
  "2": {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "14px",
    lineHeight: "1.5",
    textColor: "#222",
    footerColor: "#666",
    footerSize: "12px",
    footerMarginTop: "1.25em",
    padding: "12px 16px",
    footerLayout: "plain",
  },
  "3": {
    fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
    fontSize: "14px",
    lineHeight: "1.55",
    textColor: "#2c2c2c",
    footerColor: "#555",
    footerSize: "12px",
    footerMarginTop: "2em",
    padding: "16px 20px",
    footerLayout: "separate",
  },
  "4": {
    fontFamily: "'Trebuchet MS', Verdana, sans-serif",
    fontSize: "13px",
    lineHeight: "1.55",
    textColor: "#333",
    footerColor: "#777",
    footerSize: "11px",
    footerMarginTop: "1.5em",
    padding: "14px 18px",
    footerLayout: "italic",
  },
  "5": {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontSize: "14px",
    lineHeight: "1.45",
    textColor: "#111",
    footerColor: "#888",
    footerSize: "12px",
    footerMarginTop: "1em",
    padding: "8px 12px",
    footerLayout: "plain",
  },
  "6": {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: "14px",
    lineHeight: "1.7",
    textColor: "#1a1a1a",
    footerColor: "#444",
    footerSize: "12px",
    footerMarginTop: "2em",
    padding: "24px 28px",
    footerLayout: "separate",
  },
};

const DEFAULT_STYLE: AccountMailStyle = MAIL_STYLE_BY_ACCOUNT_ID["2"];

export function getMailStyleForAccount(accountId: string): AccountMailStyle {
  return MAIL_STYLE_BY_ACCOUNT_ID[accountId] ?? DEFAULT_STYLE;
}
