/** The 9 accent colors available for accounts */
export const ACCENT_COLORS = [
  "#71BD00",
  "#00B881",
  "#3086FF",
  "#3E3BF1",
  "#8A38F5",
  "#FFA1AF",
  "#FF4747",
  "#FF944D",
  "#FFBD38",
] as const;

export const DEFAULT_ACCOUNT_COLOR = "#3E3BF1";
export const DEFAULT_ACCOUNT_TYPE: "card" | "physical" = "card";

/**
 * Derive card styling from any hex accent color.
 * Produces a light-tinted gradient, a faint border, and green amount text.
 */
export function getCardStyleFromHex(hex: string) {
  // Parse hex → RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Light tint: mix with white at ~8% opacity for gradient start
  const tintR = Math.round(r + (255 - r) * 0.92);
  const tintG = Math.round(g + (255 - g) * 0.92);
  const tintB = Math.round(b + (255 - b) * 0.92);
  const tint = `rgb(${tintR}, ${tintG}, ${tintB})`;

  return {
    borderColor: hex + "14", // 8% opacity
    gradientColors: [tint, "#ffffff"] as [string, string],
    iconBg: hex,
    amountColor: "#34d399", // always green for accounts
  };
}
