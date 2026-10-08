import { View, Text, Pressable } from "react-native";
import type { Todo } from "../lib/types";
import { fmtNext } from "../lib/format";
import { getExpireInfo } from "../lib/expire";

type Props = {
  todo: Todo;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function TodoCard({ todo, onToggle, onEdit, onDelete }: Props) {
  const expireInfo = getExpireInfo(todo);

  return (
    <View className={`mb-3 rounded-2xl border bg-white p-4 ${todo.done?"opacity-50 border-zinc-200":"border-zinc-200"}`}>
      <View className="flex-row items-start justify-between">
        <Pressable onPress={onToggle} className="flex-1">
          <Text className={`text-base font-bold ${todo.done?"line-through text-zinc-400":"text-black"}`}>{todo.title}</Text>
          {todo.description? <Text className="mt-1 text-zinc-500">{todo.description}</Text> : null}
          <Text className="mt-2 text-xs text-zinc-400">{fmtNext(todo)}</Text>
          {expireInfo && (
            <Text className={`mt-1 text- ${expireInfo.isExpired?"text-red-500":"text-orange-500"}`}>🗑️ {expireInfo.label}</Text>
          )}
          {!todo.isRepeating &&!expireInfo && todo.autoDeleteAt && (
            <Text className="mt-1 text- text-orange-500">🔔 ครั้งเดียว • ลบใน 7 วัน</Text>
          )}
          {todo.isRepeating && (
            <Text className="mt-1 text- text-blue-500">🔁 วนซ้ำ</Text>
          )}
        </Pressable>
        <View className="ml-3 flex-row gap-2">
          <Pressable onPress={onEdit} className="rounded-full bg-zinc-100 px-3 py-2"><Text>✏️</Text></Pressable>
          <Pressable onPress={onDelete} className="rounded-full bg-red-50 px-3 py-2"><Text>🗑️</Text></Pressable>
        </View>
      </View>
    </View>
  );
}