import { useQuery } from "convex/react";
import { api } from "@perfin/backend/convex";
import { Text, View, TouchableOpacity } from "react-native";
import { authClient } from "../../lib/authClient";

export default function HomeScreen() {
  const accounts = useQuery(api.accounts.getCurrentUserAccounts);

  const handleSignOut = async () => {
    await authClient.signOut();
    // (app)/_layout.tsx detects isAuthenticated=false and redirects to login
  };

  return (
    <View className="flex-1 bg-white pt-16 px-6">
      <View className="flex-row items-center justify-between mb-8">
        <Text className="text-2xl font-bold text-gray-900">Perfin</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text className="text-indigo-500 font-medium">Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-lg text-gray-600 mb-4">
        {!accounts
          ? "Loading accounts..."
          : `${accounts.length} account(s) found`}
      </Text>

      {accounts?.map((account) => (
        <View
          key={account._id}
          className="bg-gray-50 rounded-xl p-4 mb-3"
        >
          <Text className="text-base font-semibold text-gray-900">
            {account.name}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            Balance: ${account.balance.toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );
}
