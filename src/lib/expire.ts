import { Todo, EXPIRE_DAYS } from "./types";

export function getExpireInfo(todo: Todo) {
  // ถ้าไม่มี autoDeleteAt ให้ใช้ logic เก่า: once ที่เลยเวลาแล้ว
  if (todo.autoDeleteAt) {
    const expireDate = new Date(todo.autoDeleteAt);
    if (isNaN(expireDate.getTime())) return null;
    const now = new Date();
    const daysLeft = Math.ceil((expireDate.getTime() - now.getTime()) / 86400000);
    
    return {
      expireDate,
      daysLeft: Math.max(0, daysLeft),
      isExpired: daysLeft <= 0,
      label: daysLeft <= 0 
        ? "หมดอายุ - กำลังลบ" 
        : `ลบอัตโนมัติใน ${daysLeft} วัน • ${expireDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`
    };
  }

  // logic เก่าสำหรับ once (เผื่อข้อมูลเก่า)
  if (todo.kind !== "once" || todo.done || !todo.onceAt) return null;
  const due = new Date(todo.onceAt);
  if (isNaN(due.getTime())) return null;
  const now = new Date();
  if (due >= now) return null;

  const expireDate = new Date(due);
  expireDate.setDate(expireDate.getDate() + EXPIRE_DAYS);
  const daysLeft = Math.ceil((expireDate.getTime() - now.getTime()) / 86400000);

  return {
    expireDate,
    daysLeft: Math.max(0, daysLeft),
    isExpired: daysLeft <= 0,
    label: daysLeft <= 0 
      ? "หมดอายุ" 
      : `หมดอายุใน ${daysLeft} วัน • ลบ ${expireDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`
  };
}

export function filterExpired(todos: Todo[]) {
  const now = Date.now();
  return todos.filter(t => {
    // 1. ถ้ามี autoDeleteAt (ระบบใหม่ 7 วัน)
    if (t.autoDeleteAt) {
      if (new Date(t.autoDeleteAt).getTime() <= now) return false;
      return true;
    }
    // 2. ถ้าไม่มี ให้ใช้ getExpireInfo เช็คหมดอายุแบบเก่า
    const info = getExpireInfo(t);
    return !info?.isExpired;
  });
}