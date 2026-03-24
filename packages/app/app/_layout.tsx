import "../global.css";
import { Slot } from "expo-router";
import ConvexClientProvider from "../providers/ConvexProvider";

export default function RootLayout() {
  return (
    <ConvexClientProvider>
      <Slot />
    </ConvexClientProvider>
  );
}
