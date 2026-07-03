import "server-only";
import { readJsonFile, writeJsonFile } from "@/lib/storage";

export type AppSettings = {
  /** Warn when re-sending to the same client within this many days. */
  duplicateWarningDays: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  duplicateWarningDays: 15,
};

const FILENAME = "settings.json";

export async function getSettings(): Promise<AppSettings> {
  const stored = await readJsonFile<Partial<AppSettings>>(FILENAME, {});
  return {
    duplicateWarningDays:
      typeof stored.duplicateWarningDays === "number" &&
      stored.duplicateWarningDays >= 0
        ? stored.duplicateWarningDays
        : DEFAULT_SETTINGS.duplicateWarningDays,
  };
}

export async function updateSettings(
  patch: Partial<AppSettings>,
): Promise<AppSettings> {
  const current = await getSettings();
  const next: AppSettings = { ...current };

  if (patch.duplicateWarningDays !== undefined) {
    const days = Math.floor(patch.duplicateWarningDays);
    if (Number.isNaN(days) || days < 0 || days > 365) {
      throw new Error("duplicateWarningDays must be between 0 and 365.");
    }
    next.duplicateWarningDays = days;
  }

  await writeJsonFile(FILENAME, next);
  return next;
}
