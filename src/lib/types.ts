export type Priority = "high" | "medium" | "low";
export type Kind = "once" | "hours" | "daily" | "weekly" | "monthly";

export type Todo = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  kind: Kind;
  onceAt: string;     // ISO ใช้กับ "ครั้งเดียว"
  everyHours: number; // ใช้กับ "ทุกกี่ชม."
  hour: number;       // ใช้กับ ทุกวัน / ทุกสัปดาห์ / ทุกเดือน
  minute: number;
  weekday: number;    // 1=อา ... 7=ส (ทุกสัปดาห์)
  weekdays: number[]; // ใช้ใหม่ ติ๊กได้หลายวัน
  monthDay: number;   // 1-31 (ทุกเดือน)
  done: boolean;
  doneAt: string | null;
  notifIds: string[];
    // เพิ่มใหม่
  expiredLabel?: string; // ไม่ต้อง save ก็ได้ เอาไว้โชว์
};

export type TodoInput = Omit<Todo, "id" | "done" | "doneAt" | "notifIds">;

export const EXPIRE_DAYS = 15; // เพิ่มไว้ตรงนี้เลย