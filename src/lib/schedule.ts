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
  if (status !== "granted") {
    Alert.alert("ต้องเปิดสิทธิ์แจ้งเตือน", "ไปที่ Settings > Apps > Notifications");
  }
}

// ทุกเดือน: ระบบไม่มี trigger รายเดือน จึงตั้งล่วงหน้า 12 เดือน
// (ถ้าวันที่เกินจำนวนวันของเดือน เช่น 31 จะใช้วันสุดท้ายของเดือนนั้น)
function monthlyDates(t: Todo, count = 12): Date[] {
  const now = new Date();
  const out: Date[] = [];
  for (let i = 0; out.length < count; i++) {
    const first = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const d = new Date(
      first.getFullYear(), first.getMonth(), Math.min(t.monthDay, last), t.hour, t.minute, 0, 0
    );
    if (d.getTime() > now.getTime()) out.push(d);
  }
  return out;
}

export async function schedule(t: Todo): Promise<string[]> {
  if (t.done) return [];
  const content = {
    title: "🔔 " + t.title,
    body: t.description || "ถึงเวลาแล้ว",
    sound: "default" as const,
  };

  switch (t.kind) {
    case "once": {
      const d = new Date(t.onceAt);
      if (d.getTime() <= Date.now()) return [];
      return [await Notifications.scheduleNotificationAsync({
        content, trigger: { type: T.DATE, date: d, channelId: CH },
      })];
    }
    case "hours":
      return [await Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: T.TIME_INTERVAL, seconds: t.everyHours * 3600, repeats: true, channelId: CH },
      })];
    case "daily":
      return [await Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: T.DAILY, hour: t.hour, minute: t.minute, channelId: CH },
      })];
    case "weekly":
      return [await Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: T.WEEKLY, weekday: t.weekday, hour: t.hour, minute: t.minute, channelId: CH },
      })];
    case "monthly":
      return Promise.all(
        monthlyDates(t).map((date) =>
          Notifications.scheduleNotificationAsync({
            content, trigger: { type: T.DATE, date, channelId: CH },
          })
        )
      );
  }
}

export async function cancel(ids: string[]) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}