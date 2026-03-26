import { Text, View, TouchableOpacity } from "react-native";
import { authClient } from "../../lib/authClient";

export default function SettingsScreen() {
  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <View className="flex-1 bg-transparent pt-top px-page">
      <Text className="text-2xl font-bold text-gray-900 mb-8">Settings</Text>

      <TouchableOpacity
        onPress={handleSignOut}
        className="bg-red-50 rounded-2xl p-4"
      >
        <Text className="text-red-500 font-semibold text-center text-base">
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}
