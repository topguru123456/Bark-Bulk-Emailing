export type PublicAccount = {
  id: string;
  name: string;
  email: string;
};

export type HistoryEntry = {
  id: string;
  sentAt: string;
  accountId: string;
  accountName: string;
  accountEmail: string;
  clientName: string;
  clientEmail: string;
  subject: string;
};

export type AppSettings = {
  duplicateWarningDays: number;
};

export type DuplicateWarning = {
  lastSend: HistoryEntry;
  timeAgo: string;
};

export type CrossAccountWarning = {
  otherSends: Array<{
    accountName: string;
    subject: string;
    timeAgo: string;
  }>;
};
