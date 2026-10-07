import { useEffect, useState } from "react";
import { Modal, ScrollView, View, Text, TextInput, Pressable, Alert } from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Kind, Priority, Todo, TodoInput } from "../types";
import {
  KINDS, KIND_LABEL, PRIORITY_BG, PRIORITY_LABEL, WEEKDAY_SHORT, fmtDateTime, hhmm,
} from "../lib/format";

type Props = {
  visible: boolean;
  editing: Todo | null;
  onClose: () => void;
  onSave: (input: TodoInput) => Promise<void> | void;
};

const chip = "rounded-full border px-4 py-2.5";

export default function TodoForm({ visible, editing, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [kind, setKind] = useState<Kind>("once");
  const [onceAt, setOnceAt] = useState(new Date());
  const [everyHours, setEveryHours] = useState("2");
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [weekday, setWeekday] = useState(2); // จันทร์
  const [monthDay, setMonthDay] = useState("1");

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description);
      setPriority(editing.priority);
      setKind(editing.kind);
      setOnceAt(new Date(editing.onceAt));
      setEveryHours(String(editing.everyHours));
      setHour(editing.hour);
      setMinute(editing.minute);
      setWeekday(editing.weekday);
      setMonthDay(String(editing.monthDay));
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setKind("once");
      setOnceAt(new Date(Date.now() + 60 * 1000));
      setEveryHours("2");
      setHour(8);
      setMinute(0);
      setWeekday(2);
      setMonthDay("1");
    }
  }, [visible, editing]);

  const pickTime = () =>
    DateTimePickerAndroid.open({
      value: new Date(2000, 0, 1, hour, minute),
      mode: "time",
      is24Hour: true,
      onChange: (e, d) => {
        if (e.type === "set" && d) {
          setHour(d.getHours());
          setMinute(d.getMinutes());
        }
      },
    });

  const pickOnce = () =>
    DateTimePickerAndroid.open({
      value: onceAt,
      mode: "date",
      onChange: (e, date) => {
        if (e.type !== "set" || !date) return;
        DateTimePickerAndroid.open({
          value: date,
          mode: "time",
          is24Hour: true,
          onChange: (e2, time) => {
            if (e2.type !== "set" || !time) return;
            const merged = new Date(date);
            merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
            setOnceAt(merged);
          },
        });
      },
    });

  const submit = async () => {
    if (!title.trim()) return Alert.alert("กรุณาใส่ชื่อ");
    if (kind === "once" && onceAt.getTime() <= Date.now())
      return Alert.alert("เวลาผ่านไปแล้ว", "เลือกเวลาในอนาคต");
    const hours = Number(everyHours);
    if (kind === "hours" && (!Number.isInteger(hours) || hours < 1 || hours > 168))
      return Alert.alert("จำนวนชั่วโมงไม่ถูกต้อง", "ใส่เลขจำนวนเต็ม 1-168");
    const day = Number(monthDay);
    if (kind === "monthly" && (!Number.isInteger(day) || day < 1 || day > 31))
      return Alert.alert("วันที่ไม่ถูกต้อง", "ใส่เลข 1-31");

    await onSave({
      title: title.trim(),
      description: description.trim(),
      priority,
      kind,
      onceAt: onceAt.toISOString(),
      everyHours: hours || 1,
      hour,
      minute,
      weekday,
      monthDay: day || 1,
    });
  };

  const TimeButton = () => (
    <Pressable className="rounded-xl bg-zinc-100 p-3" onPress={pickTime}>
      <Text>⏰ {hhmm(hour, minute)}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerClassName="p-5 pt-14" keyboardShouldPersistTaps="handled">
        <Text className="text-3xl font-black">{editing ? "แก้ไขรายการ" : "เพิ่มรายการ"}</Text>

        <Text className="mb-1.5 mt-4 font-bold">ชื่อ</Text>
        <TextInput className="rounded-xl bg-zinc-100 p-3" value={title} onChangeText={setTitle} placeholder="เช่น กินยา" />

        <Text className="mb-1.5 mt-4 font-bold">รายละเอียด</Text>
        <TextInput
          className="h-20 rounded-xl bg-zinc-100 p-3"
          style={{ textAlignVertical: "top" }}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="รายละเอียดเพิ่มเติม"
        />

        <Text className="mb-1.5 mt-4 font-bold">ความสำคัญ</Text>
        <View className="flex-row gap-2">
          {(["high", "medium", "low"] as Priority[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPriority(p)}
              className={`${chip} ${priority === p ? PRIORITY_BG[p] : "border-zinc-300"}`}
            >
              <Text className={`font-bold ${priority === p ? "text-white" : "text-black"}`}>
                {PRIORITY_LABEL[p]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="mb-1.5 mt-4 font-bold">การแจ้งเตือน</Text>
        <View className="flex-row flex-wrap gap-2">
          {KINDS.map((k) => (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              className={`${chip} ${kind === k ? "border-black bg-black" : "border-zinc-300"}`}
            >
              <Text className={`font-bold ${kind === k ? "text-white" : "text-black"}`}>{KIND_LABEL[k]}</Text>
            </Pressable>
          ))}
        </View>

        {kind === "once" && (
          <>
            <Text className="mb-1.5 mt-4 font-bold">วันและเวลา</Text>
            <Pressable className="rounded-xl bg-zinc-100 p-3" onPress={pickOnce}>
              <Text>📅 {fmtDateTime(onceAt.toISOString())}</Text>
            </Pressable>
          </>
        )}

        {kind === "hours" && (
          <>
            <Text className="mb-1.5 mt-4 font-bold">เตือนทุกกี่ชั่วโมง</Text>
            <TextInput
              className="rounded-xl bg-zinc-100 p-3"
              value={everyHours}
              onChangeText={setEveryHours}
              keyboardType="number-pad"
              placeholder="เช่น 2"
            />
            <Text className="mt-2 text-xs text-zinc-500">เริ่มนับจากเวลาที่กดบันทึก แล้ววนซ้ำจนกว่าจะติ๊กเสร็จหรือลบ</Text>
          </>
        )}

        {kind === "daily" && (
          <>
            <Text className="mb-1.5 mt-4 font-bold">เวลาที่เตือนทุกวัน</Text>
            <TimeButton />
          </>
        )}

        {kind === "weekly" && (
          <>
            <Text className="mb-1.5 mt-4 font-bold">วันในสัปดาห์</Text>
            <View className="flex-row flex-wrap gap-2">
              {WEEKDAY_SHORT.map((w, i) => (
                <Pressable
                  key={w}
                  onPress={() => setWeekday(i + 1)}
                  className={`h-11 w-11 items-center justify-center rounded-full border ${
                    weekday === i + 1 ? "border-black bg-black" : "border-zinc-300"
                  }`}
                >
                  <Text className={`font-bold ${weekday === i + 1 ? "text-white" : "text-black"}`}>{w}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="mb-1.5 mt-4 font-bold">เวลา</Text>
            <TimeButton />
          </>
        )}

        {kind === "monthly" && (
          <>
            <Text className="mb-1.5 mt-4 font-bold">วันที่ของเดือน (1-31)</Text>
            <TextInput
              className="rounded-xl bg-zinc-100 p-3"
              value={monthDay}
              onChangeText={setMonthDay}
              keyboardType="number-pad"
            />
            <Text className="mt-2 text-xs text-zinc-500">ถ้าเดือนนั้นไม่มีวันที่นี้ (เช่น 31) จะเตือนวันสุดท้ายของเดือนแทน</Text>
            <Text className="mb-1.5 mt-4 font-bold">เวลา</Text>
            <TimeButton />
          </>
        )}

        <View className="mt-6 flex-row gap-2">
          <Pressable className="flex-1 items-center rounded-xl bg-zinc-400 p-3.5" onPress={onClose}>
            <Text className="font-bold text-white">ยกเลิก</Text>
          </Pressable>
          <Pressable className="flex-1 items-center rounded-xl bg-black p-3.5" onPress={submit}>
            <Text className="font-bold text-white">บันทึก</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Modal>
  );
}