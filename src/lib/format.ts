import { Kind, Priority, Todo } from "./types";

export const PAGE_SIZE = 5;

export const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
export const PRIORITY_LABEL: Record<Priority, string> = { high: "สูง", medium: "กลาง", low: "ต่ำ" };
// ต้องเขียน class เต็มๆ เพื่อให้ NativeWind มองเห็น
export const PRIORITY_BG: Record<Priority, string> = {
  high: "bg-red-500 border-red-500",
  medium: "bg-yellow-500 border-yellow-500",
  low: "bg-green-500 border-green-500",
};
export const PRIORITY_BORDER: Record<Priority, string> = {
  high: "border-red-500",
  medium: "border-yellow-500",
  low: "border-green-500",
};

export const KINDS: Kind[] = ["once", "hours", "daily", "weekly", "monthly"];
export const KIND_LABEL: Record<Kind, string> = {
  once: "ครั้งเดียว",
  hours: "ทุกกี่ ชม.",
  daily: "ทุกวัน",
  weekly: "ทุกสัปดาห์",
  monthly: "ทุกเดือน",
};

export const WEEKDAY_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
export const WEEKDAY_FULL = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

const pad = (n: number) => String(n).padStart(2, "0");
export const hhmm = (h: number, m: number) => `${pad(h)}:${pad(m)}`;

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

export function describe(t: Todo): string {
  switch (t.kind) {
    case "once": return `ครั้งเดียว ${fmtDateTime(t.onceAt)}`;
    case "hours": return `ทุก ${t.everyHours} ชั่วโมง`;
    case "daily": return `ทุกวัน ${hhmm(t.hour, t.minute)}`;
    case "weekly": return `ทุกวัน${WEEKDAY_FULL[t.weekday - 1]} ${hhmm(t.hour, t.minute)}`;
    case "monthly": return `ทุกวันที่ ${t.monthDay} ของเดือน ${hhmm(t.hour, t.minute)}`;
  }
}