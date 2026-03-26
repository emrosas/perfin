import "../global.css";
import { StyleSheet } from "react-native";
import { Slot } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts as useGoogleSans } from "@expo-google-fonts/google-sans";
import { useFonts as useGoogleSansCode } from "@expo-google-fonts/google-sans-code";
import {
  GoogleSans_400Regular,
  GoogleSans_500Medium,
  GoogleSans_600SemiBold,
  GoogleSans_700Bold,
} from "@expo-google-fonts/google-sans";
import {
  GoogleSansCode_400Regular,
  GoogleSansCode_700Bold,
} from "@expo-google-fonts/google-sans-code";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import ConvexClientProvider from "../providers/ConvexProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [sansLoaded, sansError] = useGoogleSans({
    GoogleSans_400Regular,
    GoogleSans_500Medium,
    GoogleSans_600SemiBold,
    GoogleSans_700Bold,
  });

  const [codeLoaded, codeError] = useGoogleSansCode({
    GoogleSansCode_400Regular,
    GoogleSansCode_700Bold,
  });

  useEffect(() => {
    if ((sansLoaded || sansError) && (codeLoaded || codeError)) {
      SplashScreen.hideAsync();
    }
  }, [sansLoaded, sansError, codeLoaded, codeError]);

  if ((!sansLoaded && !sansError) || (!codeLoaded && !codeError)) {
    return null;
  }

  return (
    <LinearGradient
      colors={["#FFFFFF", "#FEFAFE"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      <ConvexClientProvider>
        <Slot />
      </ConvexClientProvider>
    </LinearGradient>
  );
}
