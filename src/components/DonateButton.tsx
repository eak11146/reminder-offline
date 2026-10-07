import { Pressable, Text } from "react-native";

export default function DonateButton({ onPress }: { onPress: ()=>void }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-9 flex-row items-center gap-1 rounded-full border border-pink-200 bg-pink-50 px-3"
    >
      <Text className="text-">❤️</Text>
      <Text className="text- font-bold text-pink-600">Donate</Text>
    </Pressable>
  );
}