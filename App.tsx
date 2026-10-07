import "./global.css";
import { useEffect, useMemo, useState } from "react";
import { AppState, View, Text, Pressable, Alert, ScrollView } from "react-native";
import type { Todo, TodoInput } from  "./src/lib/types";
import { PAGE_SIZE, PRIORITY_ORDER } from "./src/lib/format";
import { cancel, schedule, setupNotifications } from "./src/lib/schedule";
import { loadAll, saveAll } from "./src/lib/store";
import TodoCard from  "./src/components/TodoCard";
import TodoForm from  "./src/components/TodoForm";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Todo | null>(null);

  useEffect(() => {
    (async () => {
      await setupNotifications();
      setTodos(await loadAll());
      setLoaded(true);
    })();
    // กลับเข้าแอป: ลบของหมดอายุ + ต่ออายุแจ้งเตือนรายเดือน
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") loadAll().then(setTodos);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (loaded) saveAll(todos);
  }, [todos, loaded]);

  // ยังไม่เสร็จก่อน -> priority -> ลำดับที่สร้าง
  const sorted = useMemo(
    () =>
      [...todos].sort(
        (a, b) =>
          Number(a.done) - Number(b.done) ||
          PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
          Number(a.id) - Number(b.id)
      ),
    [todos]
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = sorted.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const save = async (input: TodoInput) => {
    try {
      if (editing) {
        await cancel(editing.notifIds);
        const next: Todo = { ...editing, ...input, notifIds: [] };
        next.notifIds = await schedule(next);
        setTodos((l) => l.map((x) => (x.id === next.id ? next : x)));
      } else {
        const t: Todo = { ...input, id: Date.now().toString(), done: false, doneAt: null, notifIds: [] };
        t.notifIds = await schedule(t);
        setTodos((l) => [...l, t]);
      }
      setFormOpen(false);
    } catch (e: any) {
      Alert.alert("บันทึกไม่สำเร็จ", e.message);
    }
  };

  const toggle = async (t: Todo) => {
    await cancel(t.notifIds);
    const next: Todo = t.done
      ? { ...t, done: false, doneAt: null, notifIds: [] }
      : { ...t, done: true, doneAt: new Date().toISOString(), notifIds: [] };
    next.notifIds = await schedule(next); // done = ไม่ตั้ง, ยกเลิกติ๊ก = ตั้งใหม่
    setTodos((l) => l.map((x) => (x.id === next.id ? next : x)));
  };

  const remove = (t: Todo) =>
    Alert.alert("ลบรายการ", `ลบ "${t.title}" และยกเลิกการแจ้งเตือน?`, [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          await cancel(t.notifIds);
          setTodos((l) => l.filter((x) => x.id !== t.id));
        },
      },
    ]);

  return (
    <View className="flex-1 bg-zinc-100 px-4 pt-14">
      <Text className="text-3xl font-black">Reminder</Text>
      <Text className="mb-3 text-zinc-500">{todos.length} รายการ</Text>

      <ScrollView className="flex-1">
        {pageItems.length === 0 && (
          <Text className="mt-10 text-center text-zinc-400">ยังไม่มีรายการ กด + เพื่อเพิ่ม</Text>
        )}
        {pageItems.map((t) => (
          <TodoCard
            key={t.id}
            todo={t}
            onToggle={() => toggle(t)}
            onEdit={() => { setEditing(t); setFormOpen(true); }}
            onDelete={() => remove(t)}
          />
        ))}
      </ScrollView>

      <View className="flex-row items-center justify-between py-3">
        <Pressable
          disabled={currentPage === 0}
          onPress={() => setPage(currentPage - 1)}
          className={`rounded-lg bg-black px-3.5 py-2.5 ${currentPage === 0 ? "opacity-30" : ""}`}
        >
          <Text className="font-bold text-white">◀ ก่อนหน้า</Text>
        </Pressable>
        <Text className="font-bold">{currentPage + 1} / {totalPages}</Text>
        <Pressable
          disabled={currentPage >= totalPages - 1}
          onPress={() => setPage(currentPage + 1)}
          className={`rounded-lg bg-black px-3.5 py-2.5 ${currentPage >= totalPages - 1 ? "opacity-30" : ""}`}
        >
          <Text className="font-bold text-white">ถัดไป ▶</Text>
        </Pressable>
      </View>

      <Pressable
        className="absolute bottom-20 right-5 h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg"
        onPress={() => { setEditing(null); setFormOpen(true); }}
      >
        <Text className="-mt-0.5 text-3xl text-white">+</Text>
      </Pressable>

      <TodoForm visible={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSave={save} />
    </View>
  );
}