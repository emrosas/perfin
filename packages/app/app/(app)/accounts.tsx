import { useQuery, useMutation } from "convex/react";
import { api } from "@perfin/backend/convex";
import {
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useConvexAuth } from "convex/react";
import { useMemo, useState } from "react";
import { FinanceCard } from "../../components/FinanceCard";
import { SectionCard } from "../../components/SectionCard";
import { DEFAULT_ACCOUNT_COLOR, DEFAULT_ACCOUNT_TYPE } from "../../lib/accountColors";
import { EXPENSE_CATEGORIES, CATEGORY_MAP } from "../../lib/categories";
import BagIcon from "../../assets/svg/bag.svg";
import CardIcon from "../../assets/svg/card.svg";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentType } from "react";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthBounds(month: string) {
  const [year, m] = month.split("-").map(Number);
  const start = `${year}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(year, m, 0).getDate();
  const end = `${year}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function formatBudget(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function WalletScreen() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();

  const accounts = useQuery(api.accounts.getCurrentUserAccounts, isAuthenticated ? undefined : "skip");

  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const { start, end } = useMemo(() => getMonthBounds(currentMonth), [currentMonth]);

  const budgets = useQuery(
    api.categoryBudgets.getBudgets,
    isAuthenticated ? { month: currentMonth } : "skip"
  );
  const spending = useQuery(
    api.categoryBudgets.getCategorySpending,
    isAuthenticated ? { monthStart: start, monthEnd: end } : "skip"
  );
  const setBudgetMutation = useMutation(api.categoryBudgets.setBudget);

  // Modal flow state: "pick" → choose a category, "budget" → enter budget amount
  const [modalStep, setModalStep] = useState<"closed" | "pick" | "budget">("closed");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Build a map of category → budget amount
  const budgetMap = useMemo(() => {
    if (!budgets) return {};
    return Object.fromEntries(budgets.map((b) => [b.category, b.budget]));
  }, [budgets]);

  // Only show categories that have a budget set
  const categoriesWithBudgets = useMemo(() => {
    return EXPENSE_CATEGORIES.filter((cat) => budgetMap[cat.key] !== undefined);
  }, [budgetMap]);

  // Categories without a budget (for the picker)
  const unbudgetedCategories = useMemo(() => {
    return EXPENSE_CATEGORIES.filter((cat) => budgetMap[cat.key] === undefined);
  }, [budgetMap]);

  const closeModal = () => {
    setModalStep("closed");
    setSelectedCategory(null);
    setBudgetInput("");
  };

  const handlePickCategory = (key: string) => {
    setSelectedCategory(key);
    setBudgetInput("");
    setModalStep("budget");
  };

  const handleEditExisting = (key: string) => {
    setSelectedCategory(key);
    setBudgetInput(String(budgetMap[key] ?? ""));
    setModalStep("budget");
  };

  const handleSaveBudget = async () => {
    if (!selectedCategory) return;
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid amount", "Please enter a budget amount greater than 0.");
      return;
    }
    setSaving(true);
    try {
      await setBudgetMutation({ category: selectedCategory, budget: amount, month: currentMonth });
      closeModal();
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const selectedCategoryDef = selectedCategory ? CATEGORY_MAP[selectedCategory] : null;

  return (
    <View className="flex-1 bg-transparent pt-top px-page">
      {/* Page heading */}
      <Text
        className="font-body-bold text-dark mb-6"
        style={{ fontSize: 48 }}
      >
        Wallet
      </Text>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* ─── Categories Section ─── */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-body-bold text-dark" style={{ fontSize: 22 }}>
            Categories
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (unbudgetedCategories.length === 0) {
                Alert.alert("All set", "All categories already have budgets.");
                return;
              }
              setModalStep("pick");
            }}
            hitSlop={12}
          >
            <Ionicons name="add-circle" size={28} color="#3E3BF1" />
          </TouchableOpacity>
        </View>

        {!budgets || !spending ? (
          <ActivityIndicator size="small" color="#3E3BF1" />
        ) : categoriesWithBudgets.length === 0 ? (
          <Text className="font-body text-gray-400 text-center mt-2 mb-4" style={{ fontSize: 14 }}>
            No category budgets set. Tap + to add one.
          </Text>
        ) : (
          <SectionCard>
            {categoriesWithBudgets.map((cat, index) => {
              const spent = spending[cat.key] ?? 0;
              const budget = budgetMap[cat.key] ?? 0;
              const progress = budget > 0 ? Math.min(spent / budget, 1) : 0;
              const isOverBudget = spent > budget && budget > 0;

              return (
                <TouchableOpacity
                  key={cat.key}
                  activeOpacity={0.7}
                  onPress={() => handleEditExisting(cat.key)}
                  style={{
                    paddingVertical: 14,
                    borderBottomWidth: index < categoriesWithBudgets.length - 1 ? 1 : 0,
                    borderBottomColor: "#e5e7eb40",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {/* Icon */}
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: "#E2E2E9",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name={cat.icon as any} size={22} color="#1e1b4b" />
                    </View>

                    {/* Name + progress */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text
                          className="font-body-medium text-dark"
                          style={{ fontSize: 16 }}
                        >
                          {cat.label}
                        </Text>
                        <Text
                          className="font-mono"
                          style={{
                            fontSize: 16,
                            color: isOverBudget ? "#EF4444" : "#1e1b4b",
                          }}
                        >
                          {formatBudget(spent)}
                        </Text>
                      </View>

                      {/* Progress bar */}
                      <View
                        style={{
                          height: 4,
                          backgroundColor: "#E2E2E9",
                          borderRadius: 2,
                          marginTop: 6,
                        }}
                      >
                        <View
                          style={{
                            height: 4,
                            borderRadius: 2,
                            width: `${progress * 100}%`,
                            backgroundColor: isOverBudget ? "#EF4444" : "#6366F1",
                          }}
                        />
                      </View>

                      {/* Budget label */}
                      <View style={{ flexDirection: "row", justifyContent: isOverBudget ? "space-between" : "flex-end", marginTop: 4 }}>
                        {isOverBudget && (
                          <Text style={{ fontSize: 12, color: "#EF4444", fontWeight: "500" }}>
                            Over Budget!
                          </Text>
                        )}
                        <Text className="font-mono" style={{ fontSize: 12, color: "#9ca3af" }}>
                          {formatBudget(budget)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </SectionCard>
        )}

        {/* ─── Accounts Section ─── */}
        <View className="flex-row items-center justify-between mb-3 mt-4">
          <Text className="font-body-bold text-dark" style={{ fontSize: 22 }}>
            Accounts
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(app)/new-account")}
            hitSlop={12}
          >
            <Ionicons name="add-circle" size={28} color="#3E3BF1" />
          </TouchableOpacity>
        </View>

        {!accounts ? (
          <ActivityIndicator size="small" color="#3E3BF1" />
        ) : accounts.length === 0 ? (
          <Text className="text-gray-400 text-center mt-2">
            No accounts yet. Create one to get started.
          </Text>
        ) : (
          accounts.map((account) => {
            const accountColor = account.color ?? DEFAULT_ACCOUNT_COLOR;
            const accountType = account.type ?? DEFAULT_ACCOUNT_TYPE;
            const IconSvg = accountType === "physical" ? BagIcon : CardIcon;

            return (
              <TouchableOpacity
                key={account._id}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/account-detail",
                    params: {
                      id: account._id,
                      name: account.name,
                      balance: String(account.balance),
                      type: accountType,
                      color: accountColor,
                    },
                  })
                }
              >
                <FinanceCard
                  title={account.name}
                  amount={account.balance}
                  accentColor={accountColor}
                  subtitle={["Edit / Adjust"]}
                  SvgIcon={IconSvg as ComponentType<{ width: number; height: number }>}
                  showIconBg
                />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ═══ Step 1: Pick Category — bottom sheet ═══ */}
      <Modal
        visible={modalStep === "pick"}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeModal}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingTop: 16,
                paddingBottom: 40,
                paddingHorizontal: 16,
                maxHeight: 500,
              }}
            >
              <Text
                className="font-body-bold text-dark text-center mb-4"
                style={{ fontSize: 17 }}
              >
                Add Category Budget
              </Text>

              <FlatList
                data={unbudgetedCategories}
                keyExtractor={(item) => item.key}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handlePickCategory(item.key)}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: "#E2E2E9",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name={item.icon as any} size={20} color="#1e1b4b" />
                    </View>
                    <Text className="font-body-medium text-dark" style={{ fontSize: 16 }}>
                      {item.label}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ═══ Step 2: Budget amount — floating card pushed above keyboard ═══ */}
      <Modal
        visible={modalStep === "budget"}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeModal}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "flex-start",
            paddingHorizontal: 16,
            paddingTop: 128,
          }}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                paddingTop: 24,
                paddingBottom: 24,
                paddingHorizontal: 16,
              }}
            >
              {/* Category header with icon */}
              {selectedCategoryDef && (
                <View style={{ alignItems: "center", marginBottom: 20 }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      backgroundColor: "#E2E2E9",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Ionicons name={selectedCategoryDef.icon as any} size={28} color="#1e1b4b" />
                  </View>
                  <Text
                    className="font-body-bold text-dark"
                    style={{ fontSize: 20 }}
                  >
                    {selectedCategoryDef.label}
                  </Text>
                  <Text
                    className="font-body text-gray-400"
                    style={{ fontSize: 14, marginTop: 2 }}
                  >
                    Set a monthly budget
                  </Text>
                </View>
              )}

              {/* Budget label */}
              <Text className="font-body-medium text-dark mb-2" style={{ fontSize: 15 }}>
                Budget Amount
              </Text>

              {/* Budget input */}
              <TextInput
                className="font-mono text-dark"
                value={budgetInput}
                onChangeText={setBudgetInput}
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                keyboardType="decimal-pad"
                autoFocus
                style={{
                  backgroundColor: "#E2E2E9",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  marginBottom: 16,
                }}
              />

              {/* Save button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSaveBudget}
                disabled={saving}
                style={{
                  backgroundColor: "#3E3BF1",
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                  {saving ? "Saving..." : "Save Budget"}
                </Text>
              </TouchableOpacity>

              {/* Back to category list */}
              {budgetMap[selectedCategory ?? ""] === undefined && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setModalStep("pick")}
                  style={{
                    paddingVertical: 12,
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: "#3E3BF1", fontSize: 15, fontWeight: "500" }}>
                    Choose a different category
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
