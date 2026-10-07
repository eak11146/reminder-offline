import { View, Text, Pressable } from "react-native";
import { Todo } from "../lib/types";
import { PRIORITY_BORDER, PRIORITY_LABEL, describe } from "../lib/format";

type Props = { todo: Todo; onToggle: () => void; onEdit: () => void; onDelete: () => void };

export default function TodoCard({ todo, onToggle, onEdit, onDelete }: Props) {
  return (
    <View
      className={`mb-3 flex-row items-center rounded-2xl border-l-4 bg-white p-3.5 ${
        PRIORITY_BORDER[todo.priority]
      } ${todo.done ? "opacity-50" : ""}`}
    >
      <Pressable
        onPress={onToggle}
        className={`mr-3 h-7 w-7 items-center justify-center rounded-full border-2 ${
          todo.done ? "border-green-500 bg-green-500" : "border-zinc-300"
        }`}
      >
        {todo.done && <Text className="font-black text-white">✓</Text>}
      </Pressable>

      <View className="flex-1">
        <Text className={`text-base font-bold ${todo.done ? "line-through" : ""}`}>{todo.title}</Text>
        {!!todo.description && <Text className="mt-0.5 text-zinc-600">{todo.description}</Text>}
        <Text className="mt-1.5 text-xs text-zinc-500">
          🔁 {describe(todo)} · {PRIORITY_LABEL[todo.priority]}
        </Text>
        {todo.done && <Text className="text-xs text-zinc-400">จะถูกลบอัตโนมัติหลัง 30 วัน</Text>}
      </View>

      <View className="items-end gap-3 pl-2">
        <Pressable onPress={onEdit}><Text className="font-bold text-blue-600">แก้ไข</Text></Pressable>
        <Pressable onPress={onDelete}><Text className="font-bold text-red-500">ลบ</Text></Pressable>
      </View>
    </View>
  );
}