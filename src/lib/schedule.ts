import { Platform, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { Todo } from "./types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const T = Notifications.SchedulableTriggerInputTypes;
const CH = "default";

export async function setupNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CH, {
      name: "Reminder",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  if (status!== "granted") {
    Alert.alert("ต้องเปิดสิทธิ์แจ้งเตือน", "ไปที่ Settings > Apps > Notifications");
  }
}

function monthlyDates(t: Todo, count = 12): Date[] {
  const now = new Date();
  const out: Date[] = [];
  for (let i = 0; out.length < count; i++) {
    const first = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const day = t.monthDay === 99? last : Math.min(t.monthDay, last);
    const d = new Date(first.getFullYear(), first.getMonth(), day, t.hour, t.minute, 0, 0);
    if (d.getTime() > now.getTime()) out.push(d);
  }
  return out;
}

export function getNextTrigger(t: Todo): Date | null {
  const now = new Date();
  if (t.done) return null;

  switch (t.kind) {
    case "once":
      return new Date(t.onceAt);
    case "hours": {
      const last = t.updatedAt? new Date(t.updatedAt) : now;
      return new Date(last.getTime() + t.everyHours * 3600 * 1000);
    }
    case "minutes": {
      const mins = t.everyMinutes?? 1;
      const last = t.updatedAt? new Date(t.updatedAt) : now;
      return new Date(last.getTime() + mins * 60 * 1000);
    }
    case "daily": {
      const d = new Date();
      d.setHours(t.hour, t.minute, 0, 0);
      if (d <= now) d.setDate(d.getDate() + 1);
      return d;
    }
    case "weekly": {
      const days = t.weekdays?.length? t.weekdays : [t.weekday];
      let nearest: Date | null = null;
      for (const wd of days) {
        const d = new Date();
        d.setHours(t.hour, t.minute, 0, 0);
        const diff = (wd - d.getDay() + 7) % 7;
        d.setDate(d.getDate() + diff);
        if (d <= now) d.setDate(d.getDate() + 7);
        if (!nearest || d < nearest) nearest = d;
      }
      return nearest;
    }
    case "monthly":
      return monthlyDates(t, 1)[0] || null;
    default:
      return null;
  }
}

export function getAutoDeleteInfo(t: Todo) {
  if (!t.autoDeleteAt) return null;
  const delDate = new Date(t.autoDeleteAt);
  const diffMs = delDate.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return { delDate, diffDays, isExpired: diffMs <= 0 };
}

export async function schedule(t: Todo): Promise<string[]> {
  if (t.done) return [];

  const content = {
    title: "🔔 " + t.title,
    body: t.description || "ถึงเวลาแล้ว",
    sound: "default" as const,
  };

  const isOnce =!t.isRepeating || t.kind === "once";

  // แบบครั้งเดียว - แจ้งครั้งเดียวแล้วรอ auto ลบใน 7 วัน
  if (isOnce) {
    let date: Date;
    if (t.kind === "once") {
      date = new Date(t.onceAt);
    } else if (t.kind === "minutes") {
      const mins = t.everyMinutes?? 1;
      date = new Date(Date.now() + mins * 60 * 1000);
    } else if (t.kind === "hours") {
      date = new Date(Date.now() + t.everyHours * 3600 * 1000);
    } else {
      date = getNextTrigger(t) || new Date(Date.now() + 60000);
    }

    if (date.getTime() <= Date.now()) return [];

    return [
      await Notifications.scheduleNotificationAsync({
        content: {...content, body: t.description || `ครั้งเดียว • จะลบใน 7 วัน` },
        trigger: { type: T.DATE, date, channelId: CH },
      }),
    ];
  }

  // แบบวนซ้ำ
  switch (t.kind) {
    case "once": {
      const d = new Date(t.onceAt);
      if (d.getTime() <= Date.now()) return [];
      return [
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: T.DATE, date: d, channelId: CH },
        }),
      ];
    }
    case "hours":
      return [
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: T.TIME_INTERVAL, seconds: t.everyHours * 3600, repeats: true, channelId: CH },
        }),
      ];
    case "minutes": {
      const mins = t.everyMinutes?? 1;
      const seconds = Math.max(10, Math.round(mins * 60));
      return [
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: T.TIME_INTERVAL, seconds, repeats: true, channelId: CH },
        }),
      ];
    }
    case "daily":
      return [
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: T.DAILY, hour: t.hour, minute: t.minute, channelId: CH },
        }),
      ];
    case "weekly": {
      const days = t.weekdays?.length? t.weekdays : [t.weekday];
      const ids: string[] = [];
      for (const wd of days) {
        const id = await Notifications.scheduleNotificationAsync({
          content,
          trigger: { type: T.WEEKLY, weekday: wd, hour: t.hour, minute: t.minute, channelId: CH },
        });
        ids.push(id);
      }
      return ids;
    }
    case "monthly":
      return Promise.all(
        monthlyDates(t).map((date) =>
          Notifications.scheduleNotificationAsync({
            content,
            trigger: { type: T.DATE, date, channelId: CH },
          })
        )
      );
    default:
      return [];
  }
}

export async function cancel(ids: string[]) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}