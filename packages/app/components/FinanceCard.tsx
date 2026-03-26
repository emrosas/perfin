import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentType } from "react";
import { getCardStyleFromHex } from "../lib/accountColors";

/**
 * Color presets for transaction cards.
 */
const COLOR_PRESETS = {
  blue: {
    borderColor: "#4f6ef714",
    gradientColors: ["#eef2ff", "#ffffff"] as [string, string],
    iconBg: "#4f6ef7",
    amountColor: "#34d399",
  },
  red: {
    borderColor: "#ef444414",
    gradientColors: ["#fef2f2", "#ffffff"] as [string, string],
    iconBg: "#ef4444",
    amountColor: "#ef4444",
  },
  green: {
    borderColor: "#22c55e14",
    gradientColors: ["#f0fdf4", "#ffffff"] as [string, string],
    iconBg: "#22c55e",
    amountColor: "#34d399",
  },
  purple: {
    borderColor: "#8b5cf614",
    gradientColors: ["#f5f3ff", "#ffffff"] as [string, string],
    iconBg: "#8b5cf6",
    amountColor: "#34d399",
  },
} as const;

export type CardColor = keyof typeof COLOR_PRESETS;

interface FinanceCardProps {
  /** Primary label — account name, transaction description, etc. */
  title: string;
  /** Dollar amount to display */
  amount: number;
  /** Color theme for the card (transaction presets) */
  color?: CardColor;
  /** Accent hex color — overrides `color` preset when provided (for account cards) */
  accentColor?: string;
  /** Optional subtitle segments shown pipe-separated */
  subtitle?: string[];
  /** SVG component to render as the icon */
  SvgIcon?: ComponentType<{ width: number; height: number; color?: string }>;
  /** When true, render the icon inside a rounded accent-colored holder */
  showIconBg?: boolean;
  /** When true, show the chevron arrow indicating the card is tappable */
  showChevron?: boolean;
}

export function FinanceCard({
  title,
  amount,
  color = "blue",
  accentColor,
  subtitle,
  SvgIcon,
  showIconBg = false,
  showChevron = true,
}: FinanceCardProps) {
  // Use accentColor (hex) if provided, otherwise fall back to preset
  const style = accentColor
    ? getCardStyleFromHex(accentColor)
    : COLOR_PRESETS[color];

  const formattedAmount = `$${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <View style={[styles.outerWrapper, { borderColor: style.borderColor }]}>
      <LinearGradient
        colors={[...style.gradientColors]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0.5, y: 0.5 }}
        style={styles.gradient}
      >
        {/* Icon */}
        {SvgIcon && showIconBg && (
          <View style={[styles.iconHolder, { backgroundColor: style.iconBg }]}>
            <SvgIcon width={30} height={30} color="#FFFFFF" />
          </View>
        )}
        {SvgIcon && !showIconBg && (
          <View style={styles.iconPlain}>
            <SvgIcon width={40} height={40} />
          </View>
        )}

        {/* Content area — two rows */}
        <View style={styles.contentArea}>
          {/* Top row: title + amount */}
          <View style={styles.topRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.amount, { color: style.amountColor }]}>
              {formattedAmount}
            </Text>
          </View>

          {/* Bottom row: subtitle + chevron */}
          {subtitle && subtitle.length > 0 && (
            <View style={styles.bottomRow}>
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle.join("  |  ")}
              </Text>
              {showChevron && (
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              )}
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    overflow: "hidden",
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconHolder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 12,
  },
  iconPlain: {
    marginRight: 12,
  },
  contentArea: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  title: {
    fontSize: 17,
    fontFamily: "GoogleSans_500Medium",
    color: "#1e1b4b",
    flex: 1,
    marginRight: 12,
  },
  subtitle: {
    fontSize: 13,
    color: "#9ca3af",
    flex: 1,
  },
  amount: {
    fontSize: 18,
    fontFamily: "GoogleSansCode_400Regular",
    fontVariant: ["tabular-nums"],
  },
});
