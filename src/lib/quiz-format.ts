import { formatDateTime } from "@/lib/formatDate";

export { formatClockDuration as formatQuizTime } from "@/lib/clock-duration";

export function formatQuizDate(date: string): string {
  return formatDateTime(date);
}
