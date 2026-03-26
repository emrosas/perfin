import { useConvexAuth } from "convex/react";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { CustomTabBar } from "../../components/CustomTabBar";

export default function AppLayout() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-transparent">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="accounts" />
      <Tabs.Screen name="settings" />
      <Tabs.Screen
        name="new-transaction"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="edit-transaction"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="new-account"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="edit-account"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="account-detail"
        options={{ href: null }}
      />
    </Tabs>
  );
}
