import { Modal, View, Text, Pressable, Image, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

export default function DonateModal({ visible, onClose }: { visible: boolean; onClose: ()=>void }) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      // 1. ขอสิทธิ์
      /* const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status!== 'granted') {
        Alert.alert('ต้องอนุญาตเข้าถึงรูปก่อนนะ', 'ไปที่ตั้งค่า > รูปภาพ');
        return;
      } */

      // ขอแค่สิทธิ์เขียน ไม่เอา AUDIO
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (perm.status !== 'granted') {
        Alert.alert('ต้องอนุญาตก่อนนะ', 'เปิดให้แอปเข้าถึงรูปภาพก่อนครับ');
        return;
      }

      // 2. โหลดไฟล์ qr จาก assets ที่คุณใส่ไว้
      const asset = Asset.fromModule(require("../../assets/qr-code.png"));
      await asset.downloadAsync();

      // 3. ก๊อปไปไฟล์ชั่วคราว แล้วเซฟลงเครื่อง
      // asset.localUri จะได้เป็น file://...
      if (!asset.localUri) throw new Error('โหลด QR ไม่ได้');

      const fileUri = FileSystem.cacheDirectory + 'qr-donate.png';
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: fileUri
      });

       // ใช้ createAsset แล้วสร้างอัลบั้มก็ได้ จะเสถียรกว่า
    const createdAsset = await MediaLibrary.createAssetAsync(fileUri);
    await MediaLibrary.createAlbumAsync('Download', createdAsset, false);

      /* await MediaLibrary.saveToLibraryAsync(fileUri); */
      Alert.alert('เซฟแล้ว ✓', 'QR อยู่ในแกลเลอรี่แล้ว ไปสแกนในแอปธนาคารได้เลยครับ ❤️');

    } catch (e: any) {
      Alert.alert('เซฟไม่ได้', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 p-6">
        <View className="w-full max-w- rounded- bg-white p-5">
          <Text className="text-center text-xl font-black">สนับสนุนผู้พัฒนา ❤</Text>
          <Text className="text-center text- font-Regular mt-1">Reminder v1.0.0</Text>
          <Text className="text-center text-">พัฒนาโดย Eakawee</Text>
          <Text className="text-center text- text-zinc-500">ติดต่อ: eakcub@gmail.com</Text>
          <Text className="mt-2 text-center text-sm text-zinc-500">สแกน QR เพื่อ Donate ได้เลย ขอบคุณครับ</Text>

          <View className="mt-4 items-center rounded-2xl bg-zinc-100 p-3">
            <Image
              source={require("../../assets/qr-code.png")}
              style={{ width: 260, height: 260, borderRadius: 16 }}
              resizeMode="contain"
            />
          </View>

          <Text className="mt-3 text-center text-xs text-zinc-400">PromptPay / TrueMoney / ธนาคาร</Text>

          {/* ปุ่มใหม่ 2 ปุ่ม */}
          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="flex-1 items-center rounded-xl bg-zinc-900 p-3.5 active:opacity-80"
            >
              {saving? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-bold text-white">⬇️ เซฟ QR</Text>
              )}
            </Pressable>

            <Pressable onPress={onClose} className="flex-1 items-center rounded-xl bg-zinc-100 p-3.5 border border-zinc-200">
              <Text className="font-bold text-zinc-900">ปิด</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}