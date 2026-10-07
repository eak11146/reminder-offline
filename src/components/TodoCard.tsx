import { View, Text, Pressable } from "react-native";
import { Todo } from "../lib/types";
import { PRIORITY_BORDER, PRIORITY_LABEL, describe } from "../lib/format";
import { getExpireInfo } from "../lib/expire";

type Props = { todo: Todo; onToggle: () => void; onEdit: () => void; onDelete: () => void };

export default function TodoCard({ todo, onToggle, onEdit, onDelete }: Props) {
  const expire = getExpireInfo(todo);

  return (
    <View
      className={`mb-3 flex-row items-center rounded-2xl border-l-4 bg-white p-3.5 ${
        PRIORITY_BORDER[todo.priority]
      } ${todo.done? "opacity-50" : ""}`}
    >
      <Pressable
        onPress={onToggle}
        className={`mr-3 h-7 w-7 items-center justify-center rounded-full border-2 ${
          todo.done? "border-green-500 bg-green-500" : "border-zinc-300"
        }`}
      >
        {todo.done && <Text className="font-black text-white">✓</Text>}
      </Pressable>

      <View className="flex-1">
        <Text className={`text-base font-bold ${todo.done? "line-through" : ""}`}>{todo.title}</Text>
        {!!todo.description && <Text className="mt-0.5 text-zinc-600">{todo.description}</Text>}

        <Text className="mt-1.5 text-xs text-zinc-500">
          🔁 {describe(todo)} · {PRIORITY_LABEL[todo.priority]}
        </Text>

        {/* 1. ถ้างานเลยเวลา 15 วัน */}
        {expire &&!todo.done && (
          <View className={`mt-1.5 self-start rounded-full px-2 py-1 ${expire.daysLeft <= 3? 'bg-red-100' : 'bg-amber-100'}`}>
            <Text className={`text- font-bold ${expire.daysLeft <= 3? 'text-red-600' : 'text-amber-700'}`}>
              ⏳ {expire.label}
            </Text>
          </View>
        )}

        {/* 2. ถ้างานทำเสร็จแล้ว 30 วัน */}
        {todo.done && todo.doneAt && (
          <Text className="mt-1 text- text-zinc-400">
            ✅ เสร็จแล้ว • จะถูกลบอัตโนมัติหลัง 30 วัน
          </Text>
        )}
      </View>

      <View className="items-end gap-3 pl-2">
        <Pressable onPress={onEdit}><Text className="font-bold text-blue-600">แก้ไข</Text></Pressable>
        <Pressable onPress={onDelete}><Text className="font-bold text-red-500">ลบ</Text></Pressable>
      </View>
    </View>
  );
}