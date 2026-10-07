import "./global.css";
import { useEffect, useMemo, useState } from "react";
import { AppState, View, Text, Pressable, Alert, ScrollView } from "react-native";
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import type { Todo, TodoInput } from "./src/lib/types";
import { PAGE_SIZE, PRIORITY_ORDER } from "./src/lib/format";
import { cancel, schedule, setupNotifications } from "./src/lib/schedule";
import { loadAll, saveAll } from "./src/lib/store";
import TodoCard from "./src/components/TodoCard";
import TodoForm from "./src/components/TodoForm";
import DonateButton from "./src/components/DonateButton";
import DonateModal from "./src/components/DonateModal";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { filterExpired } from "./src/lib/expire";


function Main() {
  const insets = useSafeAreaInsets();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);

  // ใน Main เพิ่ม state
  const [donateOpen, setDonateOpen] = useState(false);


   useEffect(() => {
    const loadTodos = async () => {
      const json = await AsyncStorage.getItem("todos");
      if (!json) return;
      let parsed: Todo[] = JSON.parse(json);
      const cleaned = filterExpired(parsed);
      if (cleaned.length !== parsed.length) {
        await AsyncStorage.setItem("todos", JSON.stringify(cleaned));
      }
      setTodos(cleaned);
    };
    loadTodos();
  }, []);



  useEffect(() => {
    (async () => {
      await setupNotifications();
      setTodos(await loadAll());
      setLoaded(true);
    })();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") loadAll().then(setTodos);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => { if (loaded) saveAll(todos); }, [todos, loaded]);

  const sorted = useMemo(() => [...todos].sort(
    (a,b) => Number(a.done)-Number(b.done) || PRIORITY_ORDER[a.priority]-PRIORITY_ORDER[b.priority] || Number(a.id)-Number(b.id)
  ), [todos]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = sorted.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const save = async (input: TodoInput) => {
    try {
      if (editing) {
        await cancel(editing.notifIds);
        const next = {...editing,...input, notifIds: [] as string[] };
        next.notifIds = await schedule(next as any);
        setTodos(l => l.map(x => x.id === next.id? next as any : x));
      } else {
        const t: any = {...input, id: Date.now().toString(), done: false, doneAt: null, notifIds: [] };
        t.notifIds = await schedule(t);
        setTodos(l => [...l, t]);
      }
      setFormOpen(false);
    } catch (e: any) { Alert.alert("บันทึกไม่สำเร็จ", e.message); }
  };

 

  const toggle = async (t: any) => {
    await cancel(t.notifIds);
    const next = t.done? {...t, done: false, doneAt: null, notifIds: [] } : {...t, done: true, doneAt: new Date().toISOString(), notifIds: [] };
    next.notifIds = await schedule(next);
    setTodos(l => l.map(x => x.id === next.id? next : x));
  };

  const remove = (t: any) => Alert.alert("ลบรายการ", `ลบ "${t.title}"?`, [
    { text: "ยกเลิก", style: "cancel" },
    { text: "ลบ", style: "destructive", onPress: async () => { await cancel(t.notifIds); setTodos(l => l.filter(x => x.id!== t.id)); } },
  ]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-100" edges={["top","left","right"]}>
      <View className="flex-1 px-4 pt-2">
        
         <View>
          <Text className="text-3xl font-black">Reminder</Text>
           <Text className="mb-3 text-zinc-500">{todos.length} รายการ</Text>
         </View>
         <View className="flex-row  justify-between"  > 
          <DonateButton onPress={()=> setDonateOpen(true)}  />
          </View>
           
         

        <ScrollView className="flex-1" contentContainerStyle={{ marginTop:10, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {pageItems.length === 0 && <Text className="mt-10 text-center text-zinc-400">ยังไม่มีรายการ กด + เพื่อเพิ่ม</Text>}
          {pageItems.map((t:any) => (
            <TodoCard key={t.id} todo={t} onToggle={()=>toggle(t)} onEdit={()=>{ setEditing(t); setFormOpen(true); }} onDelete={()=>remove(t)} />
          ))}
        </ScrollView>

        <View className="flex-row items-center justify-between border-t border-zinc-200 bg-zinc-100 py-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <Pressable disabled={currentPage===0} onPress={()=>setPage(currentPage-1)} className={`rounded-lg bg-black px-3.5 py-2.5 ${currentPage===0?"opacity-30":""}`}><Text className="font-bold text-white">◀ ก่อนหน้า</Text></Pressable>
          <Text className="font-bold">{currentPage+1} / {totalPages}</Text>
          <Pressable disabled={currentPage>=totalPages-1} onPress={()=>setPage(currentPage+1)} className={`rounded-lg bg-black px-3.5 py-2.5 ${currentPage>=totalPages-1?"opacity-30":""}`}><Text className="font-bold text-white">ถัดไป ▶</Text></Pressable>
        </View>
      </View>

      <Pressable className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg" style={{ bottom: insets.bottom + 70 }} onPress={()=>{ setEditing(null); setFormOpen(true); }}>
        <Text className="-mt-0.5 text-3xl text-white">+</Text>
      </Pressable>

      <TodoForm visible={formOpen} editing={editing} onClose={()=>setFormOpen(false)} onSave={save} />

        {/*   // ล่างสุดก่อนปิด SafeAreaView */}
    <DonateModal visible={donateOpen} onClose={()=> setDonateOpen(false)} />

    </SafeAreaView>
  );
}

export default function App(){
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  )
}