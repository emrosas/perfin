import { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { triggerSubmit, subscribeSubmitting, getSubmitting } from "../lib/newTransactionSubmit";
import HomeIcon from "../assets/svg/home.svg";
import AccountsIcon from "../assets/svg/accounts.svg";
import SettingsIcon from "../assets/svg/settings.svg";
import PlusIcon from "../assets/svg/plus.svg";
import CheckIcon from "../assets/svg/check.svg";

const TAB_ICONS = {
  index: HomeIcon,
  accounts: AccountsIcon,
  settings: SettingsIcon,
} as const;

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const [isSubmitting, setIsSubmitting] = useState(getSubmitting);

  useEffect(() => {
    return subscribeSubmitting(setIsSubmitting);
  }, []);

  const currentRoute = state.routes[state.index]?.name;
  const isTransactionForm =
    currentRoute === "new-transaction" || currentRoute === "edit-transaction";

  /** The three main tabs (exclude transaction form screens) */
  const mainRoutes = state.routes.filter(
    (r) => r.name in TAB_ICONS
  );

  const handleFabPress = () => {
    if (isTransactionForm) {
      triggerSubmit();
    } else {
      navigation.navigate("new-transaction");
    }
  };

  return (
    <LinearGradient
      colors={["rgba(254,250,254,0)", "rgba(254,250,254,0.9)", "#FEFAFE"]}
      locations={[0, 0.3, 1]}
      style={[styles.gradientBg, { paddingBottom: Math.max(insets.bottom, 12) }]}
      pointerEvents="box-none"
    >
      <View style={styles.container}>
        {/* Pill-shaped tab bar — 3-column grid */}
        <View style={styles.pill}>
          {mainRoutes.map((route) => {
            const routeIndex = state.routes.indexOf(route);
            const isFocused = state.index === routeIndex;
            const IconComponent = TAB_ICONS[route.name as keyof typeof TAB_ICONS];

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.8}
                style={styles.tabButton}
              >
                {isFocused && !isTransactionForm ? (
                  <View style={styles.activeBackground}>
                    {IconComponent && (
                      <IconComponent width={24} height={24} color="#FFFFFF" />
                    )}
                  </View>
                ) : (
                  <View style={styles.inactiveBackground}>
                    {IconComponent && (
                      <IconComponent width={24} height={24} color="#0E0844" />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Floating Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.fab, isSubmitting && { opacity: 0.7 }]}
          onPress={handleFabPress}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : isTransactionForm ? (
            <CheckIcon width={48} height={48} color="#FFFFFF" />
          ) : (
            <PlusIcon width={48} height={48} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const PILL_PADDING = 8;
const PILL_GAP = 8;

const styles = StyleSheet.create({
  gradientBg: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 20,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 16,
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#E2E2E9",
    borderRadius: 9999,
    padding: PILL_PADDING,
    gap: PILL_GAP,
    alignItems: "center",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBackground: {
    width: "100%",
    height: 48,
    borderRadius: 9999,
    backgroundColor: "#3E3BF1",
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveBackground: {
    width: "100%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 9999,
    backgroundColor: "#3E3BF1",
    alignItems: "center",
    justifyContent: "center",
  },
});
