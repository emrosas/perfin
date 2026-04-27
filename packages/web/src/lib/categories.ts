export interface CategoryDef {
  key: string;
  label: string;
  icon: string; // lucide-svelte icon name
  color: string;
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { key: "food", label: "Food", icon: "utensils", color: "#6366F1" },
  { key: "utilities", label: "Utilities", icon: "zap", color: "#6366F1" },
  { key: "fun", label: "Fun", icon: "star", color: "#6366F1" },
  { key: "living", label: "Living", icon: "home", color: "#6366F1" },
  { key: "transportation", label: "Transportation", icon: "car", color: "#6366F1" },
  { key: "health", label: "Health", icon: "heart", color: "#6366F1" },
  { key: "shopping", label: "Shopping", icon: "shopping-cart", color: "#6366F1" },
  { key: "education", label: "Education", icon: "graduation-cap", color: "#6366F1" },
  { key: "subscriptions", label: "Subscriptions", icon: "credit-card", color: "#6366F1" },
  { key: "miscellaneous", label: "Miscellaneous", icon: "grid-2x2", color: "#6366F1" },
];

export const CATEGORY_MAP: Record<string, CategoryDef> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.key, c])
);

export const DEFAULT_EXPENSE_CATEGORY = "miscellaneous";

export function getCategoryLabel(key: string | undefined): string {
  if (!key) return "General";
  return CATEGORY_MAP[key]?.label ?? key;
}
