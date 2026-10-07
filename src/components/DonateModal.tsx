import { Modal, View, Text, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DonateModal({ visible, onClose }: { visible: boolean; onClose: ()=>void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 p-6">
        <View className="w-full max-w- rounded- bg-white p-5">
          <Text className="text-center text-xl font-black">สนับสนุนผู้พัฒนา ❤️</Text>
          <Text className="mt-1 text-center text-sm text-zinc-500">สแกน QR เพื่อ Donate ได้เลย ขอบคุณครับ</Text>

          <View className="mt-4 items-center rounded-2xl bg-zinc-100 p-3">
            {/* เอาไฟล์ qr ของคุณใส่ assets/qr-donate.png */}
            <Image
              source={require("../../assets/qr-code.png")}
              style={{ width: 260, height: 260, borderRadius: 16 }}
              resizeMode="contain"
            />
          </View>

          <Text className="mt-3 text-center text-xs text-zinc-400">PromptPay / TrueMoney / ธนาคาร</Text>

          <Pressable onPress={onClose} className="mt-4 items-center rounded-xl bg-black p-3.5">
            <Text className="font-bold text-white">ปิด</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}