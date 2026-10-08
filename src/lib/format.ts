import { Todo } from "./types";
import { getNextTrigger } from "./schedule";

export const PAGE_SIZE = 10;

export const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function fmtNext(todo: Todo): string {
  if (todo.done) return "✅ เสร็จแล้ว";
  
  const next = getNextTrigger(todo);
  if (!next) return "ไม่มีกำหนด";

  const now = new Date();
  const diff = next.getTime() - now.getTime();
  if (diff <= 0) return "ถึงเวลาแล้ว";

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return `อีก ${Math.floor(diff / 1000)} วินาที`;
  if (mins < 60) return `อีก ${mins} นาที • ${next.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
  
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `อีก ${hours} ชม. ${mins % 60} นาที • ${next.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
  
  return next.toLocaleString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtDate(d: string | Date): string {
  const date = typeof d === 'string'? new Date(d) : d;
  return date.toLocaleString('th-TH');
}