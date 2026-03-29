import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";

interface SectionCardProps {
  children: ReactNode;
}

/**
 * A reusable container card with a subtle gradient background.
 * Used to group related items (e.g. category budgets) inside a single card.
 */
export function SectionCard({ children }: SectionCardProps) {
  return (
    <View style={styles.outerWrapper}>
      <LinearGradient
        colors={["#f3f4f6", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e5e7eb20",
    marginBottom: 12,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
