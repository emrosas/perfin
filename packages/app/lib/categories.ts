/**
 * Predefined expense categories with display metadata.
 * The Ionicons icon name is used on the accounts/wallet screen.
 */
export interface CategoryDef {
  key: string;
  label: string;
  icon: string; // Ionicons name
  color: string; // accent colour for the icon holder
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { key: "food", label: "Food", icon: "restaurant-outline", color: "#6366F1" },
  { key: "utilities", label: "Utilities", icon: "bulb-outline", color: "#6366F1" },
  { key: "fun", label: "Fun", icon: "star-outline", color: "#6366F1" },
  { key: "living", label: "Living", icon: "home-outline", color: "#6366F1" },
  { key: "transportation", label: "Transportation", icon: "car-outline", color: "#6366F1" },
  { key: "health", label: "Health", icon: "heart-outline", color: "#6366F1" },
  { key: "shopping", label: "Shopping", icon: "cart-outline", color: "#6366F1" },
  { key: "education", label: "Education", icon: "school-outline", color: "#6366F1" },
  { key: "subscriptions", label: "Subscriptions", icon: "card-outline", color: "#6366F1" },
  { key: "miscellaneous", label: "Miscellaneous", icon: "grid-outline", color: "#6366F1" },
];

/** Map from key → CategoryDef for quick lookup */
export const CATEGORY_MAP: Record<string, CategoryDef> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.key, c])
);

/** Default category for new expense transactions */
export const DEFAULT_EXPENSE_CATEGORY = "miscellaneous";

/** Returns the label for a category key, falling back to the key itself */
export function getCategoryLabel(key: string | undefined): string {
  if (!key) return "General";
  return CATEGORY_MAP[key]?.label ?? key;
}
