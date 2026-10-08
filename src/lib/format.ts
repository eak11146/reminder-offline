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

export const KINDS: Kind[] = ["once", "hours", "minutes", "daily", "weekly", "monthly"];
export const KIND_LABEL: Record<Kind, string> = {
  once: "ครั้งเดียว",
  hours: "ทุกๆ ชั่วโมง",
  minutes: "ทุกๆ นาที/วินาที",
  daily: "ทุกวัน",
  weekly: "ทุกสัปดาห์",
  monthly: "ทุกเดือน"
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
  const formatMin = (m: number) => {
    if (m < 1) return `${Math.round(m * 60)} วิ`;
    const min = Math.floor(m);
    const sec = Math.round((m - min) * 60);
    if (sec === 0) return `${min} นาที`;
    return `${min}.${sec.toString().padStart(2, '0')} นาที`;
  };

  switch (t.kind) {
    case "once": 
      return `ครั้งเดียว ${fmtDateTime(t.onceAt)}`;
    
    case "hours": 
      return `ทุก ${t.everyHours} ชั่วโมง`;
    
    case "minutes": {
      const mins = (t as any).everyMinutes ?? (t.everyHours ? t.everyHours * 60 : 1);
      const secs = (t as any).everySeconds ?? Math.round(mins * 60);
      // ถ้าน้อยกว่า 1 นาที โชว์เป็นวินาที
      if (mins < 1) return `ทุก ${secs} วินาที`;
      return `ทุก ${formatMin(mins)}`;
    }
    
    case "daily": 
      return `ทุกวัน ${hhmm(t.hour, t.minute)}`;
    
    case "weekly": {
      // รองรับเลือกหลายวัน
      const days = (t as any).weekdays?.length ? (t as any).weekdays : [t.weekday];
      const names = days.map((d: number) => WEEKDAY_FULL[d - 1]).join(', ');
      return `ทุกวัน${names} ${hhmm(t.hour, t.minute)}`;
    }
    
    case "monthly": 
      return t.monthDay === 99 
        ? `ทุกวันสิ้นเดือน ${hhmm(t.hour, t.minute)}`
        : `ทุกวันที่ ${t.monthDay} ของเดือน ${hhmm(t.hour, t.minute)}`;
    
    default:
      return `แจ้งเตือน ${hhmm((t as any).hour, (t as any).minute)}`;
  }
}