import "server-only";

/**
 * A Gmail SMTP account loaded from environment variables.
 * The `password` (Gmail App Password) never leaves the server.
 */
export type SmtpAccount = {
  id: string;
  name: string;
  email: string;
  password: string;
};

/** Account info that is safe to send to the browser (no password). */
export type PublicAccount = {
  id: string;
  name: string;
  email: string;
};

/**
 * Reads up to N Gmail accounts from env vars of the form:
 *   SMTP_ACCOUNT_1_NAME, SMTP_ACCOUNT_1_EMAIL, SMTP_ACCOUNT_1_PASSWORD
 *   SMTP_ACCOUNT_2_...
 * An account is only included when both EMAIL and PASSWORD are present.
 */
export function getAccounts(): SmtpAccount[] {
  const accounts: SmtpAccount[] = [];

  for (let i = 1; i <= 10; i++) {
    const email = process.env[`SMTP_ACCOUNT_${i}_EMAIL`]?.trim();
    const password = process.env[`SMTP_ACCOUNT_${i}_PASSWORD`]?.trim();
    if (!email || !password) continue;

    const name = process.env[`SMTP_ACCOUNT_${i}_NAME`]?.trim() || email;
    accounts.push({ id: String(i), name, email, password });
  }

  return accounts;
}

/** Find one account by its id, or undefined. */
export function getAccountById(id: string): SmtpAccount | undefined {
  return getAccounts().find((a) => a.id === id);
}

/** Strip secrets before sending account data to the client. */
export function toPublicAccount(account: SmtpAccount): PublicAccount {
  return { id: account.id, name: account.name, email: account.email };
}
