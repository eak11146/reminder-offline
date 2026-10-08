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
import { filterExpired } from "./src/lib/expire";

function Main() {
  const insets = useSafeAreaInsets();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);
  const [donateOpen, setDonateOpen] = useState(false);

  useEffect(() => {
    (async () => {
      await setupNotifications();
      const all = await loadAll();
      const cleaned = filterExpired(all);
      if (cleaned.length!== all.length) {
        await saveAll(cleaned);
      }
      setTodos(cleaned);
      setLoaded(true);
    })();

    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        loadAll().then(all => setTodos(filterExpired(all)));
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(async () => {
      const cleaned = filterExpired(todos);
      if (cleaned.length!== todos.length) {
        for (const t of todos) {
          if (!cleaned.find(c => c.id === t.id)) {
            await cancel(t.notificationIds || []);
          }
        }
        setTodos(cleaned);
      }
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [todos, loaded]);

  useEffect(() => { if (loaded) saveAll(todos); }, [todos, loaded]);

  const sorted = useMemo(() => [...todos].sort(
    (a,b) => Number(a.done)-Number(b.done) || PRIORITY_ORDER[a.priority]-PRIORITY_ORDER[b.priority] || Number(a.id)-Number(b.id)
  ), [todos]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = sorted.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const save = async (input: TodoInput) => {
    try {
      const autoDeleteAt =!input.isRepeating
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      if (editing) {
        await cancel(editing.notificationIds || []);
        const next: Todo = {
        ...editing,
        ...input,
          autoDeleteAt,
          notificationIds: [] as string[],
          updatedAt: new Date().toISOString()
        } as Todo;
        next.notificationIds = await schedule(next);
        setTodos(l => l.map(x => x.id === next.id? next : x));
      } else {
        const t: Todo = {
        ...(input as any),
          id: Date.now().toString(),
          autoDeleteAt,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          done: false,
          notificationIds: [],
        } as Todo;
        t.notificationIds = await schedule(t);
        setTodos(l => [...l, t]);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (e: any) { Alert.alert("บันทึกไม่สำเร็จ", e.message); }
  };

  const toggle = async (t: Todo) => {
    await cancel(t.notificationIds || []);
    const next: Todo = {
     ...t,
      done:!t.done,
      notificationIds: [],
      updatedAt: new Date().toISOString(),
      autoDeleteAt:!t.done &&!t.isRepeating
       ? t.autoDeleteAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : t.autoDeleteAt
    } as Todo;

    next.notificationIds = await schedule(next);
    setTodos(l => l.map(x => x.id === next.id? next : x));
  };

  const remove = (t: Todo) => Alert.alert("ลบรายการ", `ลบ "${t.title}"?`, [
    { text: "ยกเลิก", style: "cancel" },
    { text: "ลบ", style: "destructive", onPress: async () => {
      await cancel(t.notificationIds || []);
      setTodos(l => l.filter(x => x.id!== t.id));
    }},
  ]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-100" edges={["top","left","right"]}>
      <View className="flex-1 px-4 pt-2">
        <View>
          <Text className="text-2xl font-black pt-2 pb-2">Reminder / เดี๋ยวเค้าเตือนเองนะ ✨</Text>
          <Text className="text- text-zinc-500 mb-3">มี {todos.length} เรื่องต้องจำ • ครั้งเดียวลบใน 7 วัน</Text>
        </View>
        <View className="flex-row justify-between">
          <DonateButton onPress={()=> setDonateOpen(true)} />
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ marginTop:10, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {pageItems.length === 0 && <Text className="mt-10 text-center text- text-zinc-400">ยังไม่มีรายการ กด + เพื่อเพิ่ม</Text>}
          {/* ไม่ซ้ำแล้ว - ให้ TodoCard โชว์สถานะเอง */}
          {pageItems.map((t) => (
            <TodoCard
              key={t.id}
              todo={t}
              onToggle={()=>toggle(t)}
              onEdit={()=>{ setEditing(t); setFormOpen(true); }}
              onDelete={()=>remove(t)}
            />
          ))}
        </ScrollView>

        <View className="flex-row items-center justify-between border-t border-zinc-200 bg-zinc-100 py-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <Pressable disabled={currentPage===0} onPress={()=>setPage(currentPage-1)} className={`rounded-lg bg-black px-3.5 py-2.5 ${currentPage===0?"opacity-30":""}`}><Text className="text- font-bold text-white">◀ ก่อนหน้า</Text></Pressable>
          <Text className="text- font-bold">{currentPage+1} / {totalPages}</Text>
          <Pressable disabled={currentPage>=totalPages-1} onPress={()=>setPage(currentPage+1)} className={`rounded-lg bg-black px-3.5 py-2.5 ${currentPage>=totalPages-1?"opacity-30":""}`}><Text className="text- font-bold text-white">ถัดไป ▶</Text></Pressable>
        </View>
      </View>

      <Pressable className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg" style={{ bottom: insets.bottom + 70 }} onPress={()=>{ setEditing(null); setFormOpen(true); }}>
        <Text className="-mt-0.5 text-3xl text-white">+</Text>
      </Pressable>

      <TodoForm visible={formOpen} editing={editing} onClose={()=>{ setFormOpen(false); setEditing(null); }} onSave={save} />
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