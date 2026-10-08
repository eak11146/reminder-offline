import { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, Pressable, ScrollView, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { Todo, TodoInput, Kind } from "../lib/types";

type Props = {
  visible: boolean;
  editing: Todo | null;
  onClose: () => void;
  onSave: (input: TodoInput) => void;
};

export default function TodoForm({ visible, editing, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<Kind>("once");
  const [onceAt, setOnceAt] = useState(new Date().toISOString());
  const [everyHours, setEveryHours] = useState(1);
  const [everyMinutes, setEveryMinutes] = useState(1);
  const [everySeconds, setEverySeconds] = useState(0);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(30);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState(1);
  const [isRepeating, setIsRepeating] = useState(false);

  // picker state
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description);
      setKind(editing.kind);
      setOnceAt(editing.onceAt);
      setEveryHours(editing.everyHours);
      const em = (editing as any).everyMinutes?? 1;
      setEveryMinutes(Math.floor(em));
      setEverySeconds(Math.round((em % 1) * 60));
      setHour(editing.hour);
      setMinute(editing.minute);
      setWeekdays((editing as any).weekdays?? []);
      setMonthDay((editing as any).monthDay?? 1);
      setIsRepeating((editing as any).isRepeating?? false);
      setTempDate(new Date(editing.onceAt));
    } else {
      const now = new Date(Date.now() + 60000);
      setTitle("");
      setDescription("");
      setKind("once");
      setOnceAt(now.toISOString());
      setTempDate(now);
      setEveryHours(1);
      setEveryMinutes(1);
      setEverySeconds(0);
      setHour(8);
      setMinute(30);
      setWeekdays([]);
      setMonthDay(1);
      setIsRepeating(false);
    }
  }, [editing, visible]);

  const handleSave = () => {
    if (!title.trim()) return;
    const totalMinutes = everyMinutes + everySeconds / 60;
    onSave({
      title: title.trim(),
      description,
      priority: "medium",
      kind,
      onceAt,
      everyHours,
      everyMinutes: totalMinutes || 0.5,
      hour,
      minute,
      weekday: weekdays[0]?? 1,
      weekdays,
      monthDay,
      isRepeating,
    } as any);
  };

  const onChangeOnce = (e: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowDate(false), setShowTime(false);
    if (!selected) return;
    setTempDate(selected);
    setOnceAt(selected.toISOString());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[90%] rounded-t-3xl bg-white p-5">
          <Text className="mb-4 text-xl font-black">เพิ่มการแจ้งเตือน</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput placeholder="ชื่อ" value={title} onChangeText={setTitle} className="mb-3 rounded-xl border border-zinc-200 p-3" />
            <TextInput placeholder="รายละเอียด" value={description} onChangeText={setDescription} className="mb-4 rounded-xl border border-zinc-200 p-3" />

            <Text className="mb-2 font-bold">รูปแบบการเตือน</Text>
            <View className="mb-4 flex-row gap-2">
              <Pressable onPress={()=>setIsRepeating(false)} className={`flex-1 rounded-xl border p-3 ${!isRepeating?"bg-black border-black":"border-zinc-300 bg-white"}`}>
                <Text className={`text-center font-bold ${!isRepeating?"text-white":"text-black"}`}>🔔 ครั้งเดียว</Text>
              </Pressable>
              <Pressable onPress={()=>setIsRepeating(true)} className={`flex-1 rounded-xl border p-3 ${isRepeating?"bg-black border-black":"border-zinc-300 bg-white"}`}>
                <Text className={`text-center font-bold ${isRepeating?"text-white":"text-black"}`}>🔁 วนซ้ำ</Text>
              </Pressable>
            </View>

            <View className="mb-4 flex-row flex-wrap gap-2">
              {(["once","minutes","hours","daily","monthly"] as Kind[]).map(k => (
                <Pressable key={k} onPress={()=>setKind(k)} className={`rounded-full border px-3 py-2 ${kind===k?"bg-black border-black":"border-zinc-300"}`}>
                  <Text className={kind===k?"text-white":"text-black"}>{k}</Text>
                </Pressable>
              ))}
            </View>

            {/* ONCE ใช้ DateTimePicker จริง */}
            {kind==="once" && (
              <View className="mb-4 rounded-2xl bg-zinc-50 p-3">
                <Text className="mb-2 font-bold">📅 เลือกวัน เวลา (ครั้งเดียว)</Text>
                <View className="flex-row gap-2">
                  <Pressable onPress={()=>setShowDate(true)} className="flex-1 rounded-xl bg-black p-4">
                    <Text className="text-center font-bold text-white">📅 {tempDate.toLocaleDateString('th-TH')}</Text>
                  </Pressable>
                  <Pressable onPress={()=>setShowTime(true)} className="flex-1 rounded-xl bg-black p-4">
                    <Text className="text-center font-bold text-white">⏰ {tempDate.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</Text>
                  </Pressable>
                </View>
                {showDate && (
                  <DateTimePicker value={tempDate} mode="date" display="default" onChange={onChangeOnce} />
                )}
                {showTime && (
                  <DateTimePicker value={tempDate} mode="time" display="default" is24Hour onChange={onChangeOnce} />
                )}
              </View>
            )}

            {/* MINUTES = เลือก นาที + วินาที ด้วย picker */}
            {kind==="minutes" && (
              <View className="mb-4 rounded-2xl bg-zinc-50 p-3">
                <Text className="mb-2 font-bold">⏱️ ทุกๆกี่นาที</Text>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="mb-1 text-center text-xs">นาที</Text>
                    <View className="flex-row items-center">
                      <Pressable onPress={()=>setEveryMinutes(m=>Math.max(0,m-1))} className="h-12 w-12 items-center justify-center rounded-xl border bg-white"><Text className="text-xl">-</Text></Pressable>
                      <View className="mx-1 h-12 flex-1 items-center justify-center rounded-xl bg-black"><Text className="font-black text-white">{everyMinutes}</Text></View>
                      <Pressable onPress={()=>setEveryMinutes(m=>m+1)} className="h-12 w-12 items-center justify-center rounded-xl border bg-white"><Text className="text-xl">+</Text></Pressable>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="mb-1 text-center text-xs">วินาที</Text>
                    <View className="flex-row items-center">
                      <Pressable onPress={()=>setEverySeconds(s=>Math.max(0,s-5))} className="h-12 w-12 items-center justify-center rounded-xl border bg-white"><Text className="text-xl">-</Text></Pressable>
                      <View className="mx-1 h-12 flex-1 items-center justify-center rounded-xl bg-black"><Text className="font-black text-white">{everySeconds}</Text></View>
                      <Pressable onPress={()=>setEverySeconds(s=>Math.min(55,s+5))} className="h-12 w-12 items-center justify-center rounded-xl border bg-white"><Text className="text-xl">+</Text></Pressable>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* HOURS = -[ 1>=24 ]+ */}
            {kind==="hours" && (
              <View className="mb-4 rounded-2xl bg-zinc-50 p-3">
                <Text className="mb-2 font-bold">⏰ ทุกๆกี่ชั่วโมง (1-24)</Text>
                <View className="flex-row items-center justify-center gap-3">
                  <Pressable onPress={()=>setEveryHours(h=>Math.max(1,h-1))} className="h-14 w-14 items-center justify-center rounded-xl border bg-white"><Text className="text-2xl font-black">-</Text></Pressable>
                  <View className="h-14 w-24 items-center justify-center rounded-xl bg-black"><Text className="text-xl font-black text-white">{everyHours}</Text></View>
                  <Pressable onPress={()=>setEveryHours(h=>Math.min(24,h+1))} className="h-14 w-14 items-center justify-center rounded-xl border bg-white"><Text className="text-2xl font-black">+</Text></Pressable>
                </View>
              </View>
            )}

            {kind==="daily" && (
               <View className="mb-4">
                  <Text className="mb-2 font-bold">เลือกวัน จ-อา</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[{id:1,label:"จ"},{id:2,label:"อ"},{id:3,label:"พ"},{id:4,label:"พฤ"},{id:5,label:"ศ"},{id:6,label:"ส"},{id:0,label:"อา"}].map(d => {
                      const active = weekdays.includes(d.id);
                      return (
                        <Pressable key={d.id} onPress={()=>setWeekdays(prev => prev.includes(d.id)? prev.filter(x=>x!==d.id) : [...prev, d.id])} className={`h-10 w-10 items-center justify-center rounded-full border ${active?"bg-black border-black":"border-zinc-300"}`}>
                          <Text className={`font-bold ${active?"text-white":"text-black"}`}>{d.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
            )}

            {kind==="monthly" && (
              <View className="mb-4">
                <Text className="mb-2 font-bold">ทุกวันที่</Text>
                <View className="flex-row items-center gap-2">
                  <Pressable onPress={()=>setMonthDay(d=> d===99?31:Math.max(1,d-1))} className="h-12 w-12 items-center justify-center rounded-xl border bg-white"><Text className="text-xl">-</Text></Pressable>
                  <View className="h-12 flex-1 items-center justify-center rounded-xl bg-black"><Text className="text-white font-black">{monthDay===99?"สิ้นเดือน":`วันที่ ${monthDay}`}</Text></View>
                  <Pressable onPress={()=>setMonthDay(d=> d===99?1:Math.min(31,d+1))} className="h-12 w-12 items-center justify-center rounded-xl border bg-white"><Text className="text-xl">+</Text></Pressable>
                  <Pressable onPress={()=>setMonthDay(99)} className={`h-12 px-4 rounded-xl border ${monthDay===99?"bg-black":"bg-white"}`}><Text className={monthDay===99?"text-white":"text-black"}>สิ้นเดือน</Text></Pressable>
                </View>
              </View>
            )}

          </ScrollView>

          <View className="mt-4 flex-row gap-2">
            <Pressable onPress={onClose} className="flex-1 rounded-xl bg-zinc-200 p-4"><Text className="text-center font-bold">ยกเลิก</Text></Pressable>
            <Pressable onPress={handleSave} className="flex-1 rounded-xl bg-blue-600 p-4"><Text className="text-center font-bold text-white">บันทึก</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}