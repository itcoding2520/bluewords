export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function getGreeting(date: Date): string {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}