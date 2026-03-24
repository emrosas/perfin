import { useConvexAuth } from "convex/react";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { isAuthenticated } = useConvexAuth();

  // If the user just signed in, reactively redirect to the app
  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
