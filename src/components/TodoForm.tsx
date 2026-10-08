import { useEffect, useState } from "react";
import { Modal, ScrollView, View, Text, TextInput, Pressable, Alert } from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Kind, Priority, Todo, TodoInput } from "../lib/types";
import { KINDS, KIND_LABEL, PRIORITY_BG, PRIORITY_LABEL, WEEKDAY_SHORT, fmtDateTime, hhmm } from "../lib/format";

type Props = { visible: boolean; editing: Todo | null; onClose: () => void; onSave: (input: TodoInput) => Promise<void> | void; };
const chip = "rounded-full border px-4 py-2.5";

// แปลง 0.5 -> "30 วิ", 1.5 -> "1.30 นาที"
const formatMinLabel = (m: number) => {
  if (m < 1) return `${m * 60} วิ`;
  const min = Math.floor(m);
  const sec = Math.round((m - min) * 60);
  if (sec === 0) return `${min} นาที`;
  return `${min}.${sec.toString().padStart(2,'0')} นาที`;
};

export default function TodoForm({ visible, editing, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [kind, setKind] = useState<Kind>("once");
  const [onceAt, setOnceAt] = useState(new Date());
  const [everyHours, setEveryHours] = useState<number>(2);
  const [everyMinutes, setEveryMinutes] = useState<number>(1.5); // ใหม่! 1.5 = 1.30 นาที
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [weekdays, setWeekdays] = useState<number[]>([2]);
  const [monthDay, setMonthDay] = useState<number>(1);

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description);
      setPriority(editing.priority);
      setKind(editing.kind);
      setOnceAt(new Date(editing.onceAt));
      setEveryHours(editing.everyHours);
      setEveryMinutes((editing as any).everyMinutes?? 1.5);
      setHour(editing.hour);
      setMinute(editing.minute);
      const oldDays = (editing as any).weekdays?.length? (editing as any).weekdays : [(editing as any).weekday?? 2];
      setWeekdays(oldDays);
      setMonthDay(editing.monthDay===99? 99 : editing.monthDay);
    } else {
      setTitle(""); setDescription(""); setPriority("medium"); setKind("once");
      setOnceAt(new Date(Date.now()+60000));
      setEveryHours(2); setEveryMinutes(1.5); setHour(8); setMinute(0);
      setWeekdays([2]); setMonthDay(1);
    }
  }, [visible, editing]);

  const toggleWeekday = (id: number) => {
    setWeekdays(prev => prev.includes(id)? prev.filter(x=>x!==id) : [...prev, id].sort((a,b)=>a-b));
  };

  const pickTime = () => DateTimePickerAndroid.open({
    value: new Date(2000,0,1,hour,minute), mode:"time", is24Hour:true,
    onChange:(e,d)=>{ if(e.type==="set"&&d){ setHour(d.getHours()); setMinute(d.getMinutes()); } }
  });

  const pickOnce = () => DateTimePickerAndroid.open({
    value: onceAt, mode:"date",
    onChange:(e,date)=>{
      if(e.type!=="set"||!date) return;
      DateTimePickerAndroid.open({
        value: date, mode:"time", is24Hour:true,
        onChange:(e2,time)=>{
          if(e2.type!=="set"||!time) return;
          const merged=new Date(date); merged.setHours(time.getHours(),time.getMinutes(),0,0); setOnceAt(merged);
        }
      });
    }
  });

  const submit = async () => {
    if(!title.trim()) return Alert.alert("กรุณาใส่ชื่อ");
    if(kind==="once"&&onceAt.getTime()<=Date.now()) return Alert.alert("เวลาผ่านไปแล้ว");
    if(kind==="weekly"&&weekdays.length===0) return Alert.alert("เลือกอย่างน้อย 1 วัน");
    if(kind==="hours"&&(!Number.isInteger(everyHours)||everyHours<1||everyHours>168)) return Alert.alert("จำนวนชั่วโมงไม่ถูกต้อง","1-168");
    if(kind==="minutes"&&everyMinutes < 0.166) return Alert.alert("น้อยเกินไป","ต้องมากกว่า 10 วินาที");

    await onSave({
      title: title.trim(),
      description: description.trim(),
      priority, kind,
      onceAt: onceAt.toISOString(),
      everyHours,
      everyMinutes, // ใหม่
      everySeconds: Math.round(everyMinutes * 60), // เผื่อเอาไปตั้ง notification
      hour, minute,
      weekday: weekdays[0]?? 2,
      weekdays,
      monthDay,
    } as TodoInput);
  };

  const TimeButton = () => (
    <Pressable className="rounded-xl bg-zinc-100 p-3" onPress={pickTime}><Text>⏰ {hhmm(hour,minute)}</Text></Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerClassName="p-5 pt-14" keyboardShouldPersistTaps="handled">
        <Text className="text-3xl font-black">{editing?"แก้ไขรายการ":"เพิ่มรายการ"}</Text>

        <Text className="mb-1.5 mt-4 font-bold">ชื่อ</Text>
        <TextInput className="rounded-xl bg-zinc-100 p-3" value={title} onChangeText={setTitle} placeholder="เช่น กินยา" />

        <Text className="mb-1.5 mt-4 font-bold">รายละเอียด</Text>
        <TextInput className="h-20 rounded-xl bg-zinc-100 p-3" style={{textAlignVertical:"top"}} value={description} onChangeText={setDescription} multiline placeholder="รายละเอียดเพิ่มเติม" />

        <Text className="mb-1.5 mt-4 font-bold">ความสำคัญ</Text>
        <View className="flex-row gap-2">
          {(["high","medium","low"] as Priority[]).map(p=>(
            <Pressable key={p} onPress={()=>setPriority(p)} className={`${chip} ${priority===p?PRIORITY_BG[p]:"border-zinc-300"}`}>
              <Text className={`font-bold ${priority===p?"text-white":"text-black"}`}>{PRIORITY_LABEL[p]}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="mb-1.5 mt-4 font-bold">การแจ้งเตือน</Text>
        <View className="flex-row flex-wrap gap-2">
          {KINDS.map(k=>(
            <Pressable key={k} onPress={()=>setKind(k)} className={`${chip} ${kind===k?"border-black bg-black":"border-zinc-300"}`}>
              <Text className={`font-bold ${kind===k?"text-white":"text-black"}`}>{KIND_LABEL[k]}</Text>
            </Pressable>
          ))}
          {/* เพิ่ม chip นาที ถ้า KINDS คุณยังไม่มี */}
          {!KINDS.includes("minutes" as any) && (
            <Pressable onPress={()=>setKind("minutes" as Kind)} className={`${chip} ${kind==="minutes"?"border-black bg-black":"border-zinc-300"}`}>
              <Text className={`font-bold ${kind==="minutes"?"text-white":"text-black"}`}>ทุกๆ นาที/วินาที</Text>
            </Pressable>
          )}
        </View>

        {kind==="once"&&<><Text className="mb-1.5 mt-4 font-bold">วันและเวลา</Text><Pressable className="rounded-xl bg-zinc-100 p-3" onPress={pickOnce}><Text>📅 {fmtDateTime(onceAt.toISOString())}</Text></Pressable></>}

        {kind==="hours"&&(
          <>
            <Text className="mb-1.5 mt-4 font-bold">เตือนทุกกี่ชั่วโมง</Text>
            <View className="flex-row flex-wrap gap-2">
              {[1,2,3,4,6,8,12,24].map(h => (
                <Pressable key={h} onPress={()=>setEveryHours(h)} className={`rounded-full border px-4 py-2.5 ${everyHours===h?"border-black bg-black":"border-zinc-300"}`}>
                  <Text className={`font-bold ${everyHours===h?"text-white":"text-black"}`}>{h} ชม.</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* ใหม่: โหมดนาที/วินาที */}
        {kind==="minutes"&&(
          <>
            <Text className="mb-1.5 mt-4 font-bold">เตือนทุกกี่นาที</Text>
            <View className="flex-row flex-wrap gap-2">
              {[0.166, 0.5, 1, 1.5, 2, 3, 5, 10, 15, 30].map(m => (
                <Pressable key={m} onPress={()=>setEveryMinutes(m)} className={`rounded-full border px-4 py-2.5 ${everyMinutes===m?"border-black bg-black":"border-zinc-300"}`}>
                  <Text className={`font-bold ${everyMinutes===m?"text-white":"text-black"}`}>
                    {formatMinLabel(m)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="mt-3 flex-row items-center gap-3">
              <Pressable onPress={()=>setEveryMinutes(Math.max(0.166, +(everyMinutes-0.5).toFixed(2)))} className="h-12 w-12 items-center justify-center rounded-xl bg-zinc-200"><Text className="text-xl font-black">-</Text></Pressable>
              <View className="flex-1 items-center rounded-xl bg-zinc-100 p-3">
                <Text className="text-lg font-bold">{formatMinLabel(everyMinutes)} • {Math.round(everyMinutes*60)} วิ</Text>
              </View>
              <Pressable onPress={()=>setEveryMinutes(+(everyMinutes+0.5).toFixed(2))} className="h-12 w-12 items-center justify-center rounded-xl bg-zinc-200"><Text className="text-xl font-black">+</Text></Pressable>
            </View>
            <Text className="mt-2 text-xs text-zinc-500">เช่น 0.30 นาที = 30 วิ, 1.30 นาที = 90 วิ • เริ่มนับจากตอนบันทึก</Text>
          </>
        )}

        {kind==="daily"&&<><Text className="mb-1.5 mt-4 font-bold">เวลาทุกวัน</Text><TimeButton/></>}

        {kind==="weekly"&&(
          <>
            <Text className="mb-1.5 mt-4 font-bold">เลือกได้หลายวัน ({weekdays.length} วัน)</Text>
            <View className="flex-row flex-wrap gap-2">
              {WEEKDAY_SHORT.map((w,i)=>{
                const id=i+1; const active=weekdays.includes(id);
                return (
                  <Pressable key={w} onPress={()=>toggleWeekday(id)} className={`h-11 w-11 items-center justify-center rounded-full border ${active?"border-black bg-black":"border-zinc-300"}`}>
                    <Text className={`font-bold ${active?"text-white":"text-black"}`}>{w}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className="mb-1.5 mt-4 font-bold">เวลา</Text><TimeButton/>
          </>
        )}

        {kind==="monthly"&&(
          <>
            <Text className="mb-1.5 mt-4 font-bold">เลือกวันที่</Text>
            <View className="flex-row flex-wrap gap-2">
              {Array.from({length:31},(_,i)=>i+1).map(d=>(
                <Pressable key={d} onPress={()=>setMonthDay(d)} className={`h-11 w-11 items-center justify-center rounded-full border ${monthDay===d?"border-black bg-black":"border-zinc-300"}`}>
                  <Text className={`font-bold ${monthDay===d?"text-white":"text-black"}`}>{d}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={()=>setMonthDay(99)} className={`mt-2 rounded-full border px-4 py-2.5 ${monthDay===99?"border-black bg-black":"border-zinc-300"}`}>
              <Text className={`font-bold ${monthDay===99?"text-white":"text-black"}`}>วันสิ้นเดือน</Text>
            </Pressable>
            <Text className="mb-1.5 mt-4 font-bold">เวลา</Text><TimeButton/>
          </>
        )}

        <View className="mt-6 flex-row gap-2">
          <Pressable className="flex-1 items-center rounded-xl bg-zinc-400 p-3.5" onPress={onClose}><Text className="font-bold text-white">ยกเลิก</Text></Pressable>
          <Pressable className="flex-1 items-center rounded-xl bg-black p-3.5" onPress={submit}><Text className="font-bold text-white">บันทึก</Text></Pressable>
        </View>
        <View className="h-10" />
      </ScrollView>
    </Modal>
  );
}