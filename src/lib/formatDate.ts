export function toVietnamDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

export function formatLocalTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(date);
}

export function formatFullLocalDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(date);
}

export function formatLocalDate(value: string | Date): string {
  return (value instanceof Date ? value : new Date(value)).toLocaleDateString();
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatShortDate(value: string, fallback = "—"): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? fallback
    : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatLocalDateForFilename(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}${month}${date.getFullYear()}`;
}

export function getGreeting(date: Date): string {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}
