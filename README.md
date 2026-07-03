# Bulk Email Sender

A small Next.js app to send bulk email from one of several Gmail accounts to a
list of recipients uploaded as a CSV.

**Flow:** pick a sending account → upload a CSV → compose subject & body → click
**Send**. Each recipient gets their own individual email (not CC/BCC), with
optional `{{company}}` / `{{email}}` personalization.

## Setup

### 1. Create Gmail App Passwords

Gmail SMTP requires an **App Password**, not your normal password. For each of
your 3 accounts:

1. Turn on **2-Step Verification** at https://myaccount.google.com/security
2. Go to https://myaccount.google.com/apppasswords
3. Generate a 16-character app password.

### 2. Configure accounts

Edit `.env.local` (already created, git-ignored) and fill in each account's
email and app password:

```ini
SMTP_ACCOUNT_1_NAME="Marketing"
SMTP_ACCOUNT_1_EMAIL="you1@gmail.com"
SMTP_ACCOUNT_1_PASSWORD="abcd efgh ijkl mnop"

SMTP_ACCOUNT_2_NAME="Sales"
SMTP_ACCOUNT_2_EMAIL="you2@gmail.com"
SMTP_ACCOUNT_2_PASSWORD="..."

SMTP_ACCOUNT_3_NAME="Support"
SMTP_ACCOUNT_3_EMAIL="you3@gmail.com"
SMTP_ACCOUNT_3_PASSWORD="..."
```

(See `.env.local.example` for the template. You can configure up to 10 accounts.)

### 3. Run

```bash
npm run dev
```

Then open the printed URL (e.g. http://localhost:3000 — it may fall back to
another port if 3000 is busy).

## CSV format

A header row with `First Name`, `Company Name`, and `Email` columns:

```csv
First Name,Company Name,Email
Barnabas,DrinKing,barnabas@example.com
Alice,Acme Inc,alice@example.com
```

See `sample-recipients.csv`. Column matching is case-insensitive and
order-independent. Recognized headers: email (`email`, `email address`,
`e-mail`), company (`company name`, `company`, `organization`), first name
(`first name`, `firstname`, `first`, `name`). Only the email column is required.

Use `{{firstname}}`, `{{company}}`, and `{{email}}` in the subject or body to
personalize each message (e.g. the default subject is
`✨ Motivated to join {{company}}` and the body opens with `Hello {{firstname}},`).

## How it works

- `src/lib/accounts.ts` — loads accounts from env vars (server-only; passwords
  never reach the browser).
- `src/app/api/accounts/route.ts` — returns the account list **without**
  passwords for the dropdown.
- `src/app/api/send/route.ts` — verifies the SMTP login, then sends one email
  per recipient via Nodemailer over `smtp.gmail.com:465`, with a short delay
  between sends, and returns a per-recipient success/failure report.
- `src/app/page.tsx` — the UI (account picker, CSV upload + preview, compose,
  send, results).

## Notes & limits

- **Gmail sending limits:** a free Gmail account allows roughly **500 recipients
  per day**; Google Workspace allows ~2,000. Exceeding this temporarily blocks
  sending. Spread large lists across your accounts.
- Sends run sequentially with a 250 ms gap to stay gentle on Gmail's limits, so
  very large lists take a while. The request budget is 5 minutes.
- This is intended for legitimate, consented mail. Don't use it for spam.
