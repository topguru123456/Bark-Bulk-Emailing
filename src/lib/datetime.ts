/** All dates/times in the app are displayed in Japan Standard Time. */
export const DISPLAY_TIMEZONE = "Asia/Tokyo";

export function toJstDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function formatJstDateTime(iso: string): string {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
  return `${formatted} JST`;
}

export function formatJstTime(iso: string): string {
  return (
    new Intl.DateTimeFormat("en-US", {
      timeZone: DISPLAY_TIMEZONE,
      timeStyle: "short",
    }).format(new Date(iso)) + " JST"
  );
}

export function formatJstDayHeading(dateKey: string, now = new Date()): string {
  const todayKey = toJstDateKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toJstDateKey(yesterday.toISOString());

  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";

  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Human-readable relative time: "3 hrs ago", "2 days ago", etc. */
export function formatTimeAgo(iso: string, now = new Date()): string {
  const ms = now.getTime() - new Date(iso).getTime();
  if (ms < 0) return "just now";

  const minutes = Math.floor(ms / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
