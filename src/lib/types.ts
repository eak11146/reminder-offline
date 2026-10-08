export type Priority = "high" | "medium" | "low";
export type Kind = "once" | "hours" | "minutes" | "daily" | "weekly" | "monthly";

export type Todo = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  kind: Kind;

  onceAt: string;
  everyHours: number;
  everyMinutes?: number; // ใหม่ 0.5 = 30วิ
  everySeconds?: number;
  hour: number;
  minute: number;
  weekday: number;
  weekdays: number[];
  monthDay: number;

    // ใหม่: ระบบครั้งเดียว vs วนซ้ำ
  isRepeating: boolean;
  autoDeleteAt?: string; // วันลบอัตโนมัติ

  createdAt: string;
  updatedAt: string;
  done: boolean;
  notificationIds?: string[];
    // เพิ่มใหม่
  expiredLabel?: string; // ไม่ต้อง save ก็ได้ เอาไว้โชว์
};

export type TodoInput = {
  title: string;
  description: string;
  priority: Priority;
  kind: Kind;
  onceAt: string;
  everyHours: number;
  everyMinutes?: number;
  everySeconds?: number;
  hour: number;
  minute: number;
  weekday: number;
  weekdays: number[];
  monthDay: number;
  isRepeating: boolean;
  autoDeleteAt?: string;
};

export const EXPIRE_DAYS = 7; // เพิ่มไว้ตรงนี้เลย expire info จะได้ใช้ตรงนี้