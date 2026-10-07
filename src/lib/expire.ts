import { Todo, EXPIRE_DAYS } from "./types";

export function getExpireInfo(todo: Todo) {
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
  return todos.filter(t => !getExpireInfo(t)?.isExpired);
}