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
};

export type TodoInput = Omit<Todo, "id" | "done" | "doneAt" | "notifIds">;