export { formatClockDuration as formatQuizTime } from "@/lib/clock-duration";

export function formatQuizDate(date: string): string {
  return new Date(date).toLocaleString();
}
