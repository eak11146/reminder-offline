import AsyncStorage from "@react-native-async-storage/async-storage";
import { Todo } from "./types";
import { cancel, schedule } from "./schedule";

const KEY = "todos-v2";
const DAY = 24 * 60 * 60 * 1000;

export const saveAll = (list: Todo[]) => AsyncStorage.setItem(KEY, JSON.stringify(list));

// โหลด + ลบรายการที่เสร็จเกิน 30 วัน + ต่ออายุแจ้งเตือนรายเดือน
export async function loadAll(): Promise<Todo[]> {
  const raw = await AsyncStorage.getItem(KEY);
  const list: Todo[] = raw ? JSON.parse(raw) : [];
  const keep: Todo[] = [];

  for (const t of list) {
    const expired = t.done && t.doneAt && Date.now() - new Date(t.doneAt).getTime() > 30 * DAY;
    if (expired) {
      await cancel(t.notifIds);
      continue;
    }
    if (t.kind === "monthly" && !t.done) {
      await cancel(t.notifIds);
      t.notifIds = await schedule(t);
    }
    keep.push(t);
  }
  await saveAll(keep);
  return keep;
}