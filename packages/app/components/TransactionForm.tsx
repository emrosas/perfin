import { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@perfin/backend/convex";
import { FinanceCard } from "./FinanceCard";
import IncomeIcon from "../assets/svg/income.svg";
import ExpenseIcon from "../assets/svg/expense.svg";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { setOnSubmit, setSubmitting as setGlobalSubmitting } from "../lib/newTransactionSubmit";
import { EXPENSE_CATEGORIES, DEFAULT_EXPENSE_CATEGORY, getCategoryLabel } from "../lib/categories";

type Category = "income" | "expense";

export function formatDateDisplay(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function toISODate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export interface TransactionFormValues {
  category: Category;
  title: string;
  amount: string;
  date: Date;
  accountId: string | null;
  expenseCategory: string;
}

interface TransactionFormProps {
  /** Screen title */
  heading: string;
  /** Initial values for the form */
  initialValues?: Partial<TransactionFormValues>;
  /** Called when the FAB checkmark is pressed and validation passes */
  onSubmit: (values: {
    category: Category;
    title: string;
    amount: number;
    date: string;
    accountId: string;
    expenseCategory?: string;
  }) => Promise<void>;
  /** Whether to reset the form after successful submit */
  resetOnSubmit?: boolean;
  /** Route to navigate back to (defaults to home) */
  returnTo?: string;
  /** Called when the delete button is pressed (only shown when provided) */
  onDelete?: () => Promise<void>;
}

export function TransactionForm({
  heading,
  initialValues,
  onSubmit,
  resetOnSubmit = false,
  returnTo,
  onDelete,
}: TransactionFormProps) {
  const router = useRouter();
  const goBack = () => {
    if (returnTo) {
      router.navigate(returnTo as any);
    } else {
      router.navigate("/(app)/");
    }
  };
  const { isAuthenticated } = useConvexAuth();
  const accounts = useQuery(api.accounts.getCurrentUserAccounts, isAuthenticated ? undefined : "skip");

  // Fetch current month budgets & spending for over-budget indicators
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);
  const monthBounds = useMemo(() => {
    const [year, m] = currentMonth.split("-").map(Number);
    const start = `${year}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(year, m, 0).getDate();
    const end = `${year}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { start, end };
  }, [currentMonth]);

  const budgets = useQuery(
    api.categoryBudgets.getBudgets,
    isAuthenticated ? { month: currentMonth } : "skip"
  );
  const spending = useQuery(
    api.categoryBudgets.getCategorySpending,
    isAuthenticated ? { monthStart: monthBounds.start, monthEnd: monthBounds.end } : "skip"
  );

  // Build maps for quick lookup
  const budgetMap = useMemo(() => {
    if (!budgets) return {};
    return Object.fromEntries(budgets.map((b) => [b.category, b.budget]));
  }, [budgets]);

  const overBudgetSet = useMemo(() => {
    if (!spending || !budgets) return new Set<string>();
    const set = new Set<string>();
    for (const b of budgets) {
      const spent = spending[b.category] ?? 0;
      if (spent >= b.budget) set.add(b.category);
    }
    return set;
  }, [spending, budgets]);

  const [category, setCategory] = useState<Category>(initialValues?.category ?? "income");
  const [title, setTitle] = useState(initialValues?.title ?? "New Transaction");
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [date, setDate] = useState(initialValues?.date ?? new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(initialValues?.accountId ?? null);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState(initialValues?.expenseCategory ?? DEFAULT_EXPENSE_CATEGORY);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedAccount = useMemo(
    () => accounts?.find((a) => a._id === accountId),
    [accounts, accountId]
  );

  const parsedAmount = parseFloat(amount) || 0;

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a transaction title.");
      return;
    }
    if (parsedAmount <= 0) {
      Alert.alert("Invalid amount", "Please enter an amount greater than 0.");
      return;
    }
    if (!accountId) {
      Alert.alert("No account", "Please select an account.");
      return;
    }

    setSubmitting(true);
    setGlobalSubmitting(true);
    try {
      await onSubmit({
        category,
        title: title.trim(),
        amount: parsedAmount,
        date: toISODate(date),
        accountId,
        expenseCategory: category === "expense" ? expenseCategory : undefined,
      });
      if (resetOnSubmit) {
        setCategory("income");
        setTitle("New Transaction");
        setAmount("");
        setDate(new Date());
        setAccountId(null);
        setExpenseCategory(DEFAULT_EXPENSE_CATEGORY);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
      setGlobalSubmitting(false);
    }
  }, [title, parsedAmount, accountId, category, date, expenseCategory, onSubmit, resetOnSubmit]);

  // Register submit handler for FAB checkmark
  useEffect(() => {
    setOnSubmit(handleSubmit);
    return () => setOnSubmit(null);
  }, [handleSubmit]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-transparent"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-page pt-top">
          {/* Header with back button */}
          <View style={{ position: "relative", alignItems: "center", marginBottom: 24 }}>
            <TouchableOpacity
              onPress={goBack}
              hitSlop={12}
              style={{ position: "absolute", left: 0, top: 0, bottom: 0, justifyContent: "center" }}
            >
              <Ionicons name="chevron-back" size={24} color="#0E0844" />
            </TouchableOpacity>
            <Text
              className="font-body-bold text-dark"
              style={{ fontSize: 22 }}
            >
              {heading}
            </Text>
          </View>

          {/* Live preview card */}
          <FinanceCard
            title={title || "New Transaction"}
            amount={category === "expense" ? -parsedAmount : parsedAmount}
            color={category === "income" ? "blue" : "red"}
            subtitle={[
              category === "income" ? "Income" : getCategoryLabel(expenseCategory),
              formatDateDisplay(date),
              selectedAccount?.name ?? "—",
            ]}
            SvgIcon={category === "income" ? IncomeIcon : ExpenseIcon}
            showChevron={false}
          />

          {/* Transaction Type */}
          <Text className="font-body-bold text-dark mt-4 mb-2" style={{ fontSize: 15 }}>
            Transaction Type
          </Text>
          <View
            className="flex-row"
            style={{
              backgroundColor: "#E2E2E9",
              borderRadius: 16,
              padding: 4,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCategory("income")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: category === "income" ? "#FFFFFF" : "transparent",
              }}
            >
              <IncomeIcon width={20} height={20} />
              <Text
                className="font-body-medium text-dark ml-2"
                style={{ fontSize: 15 }}
              >
                Income
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setCategory("expense")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: category === "expense" ? "#FFFFFF" : "transparent",
              }}
            >
              <ExpenseIcon width={20} height={20} />
              <Text
                className="font-body-medium text-dark ml-2"
                style={{ fontSize: 15 }}
              >
                Expense
              </Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text className="font-body-medium text-dark mt-5 mb-2" style={{ fontSize: 15 }}>
            Title
          </Text>
          <View style={{ position: "relative" }}>
            <TextInput
              className="font-mono text-dark"
              value={title}
              onChangeText={setTitle}
              placeholder="New Transaction"
              placeholderTextColor="#9ca3af"
              style={{
                backgroundColor: "#E2E2E9",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                paddingRight: 44,
              }}
            />
            {title.length > 0 && (
              <TouchableOpacity
                onPress={() => setTitle("")}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Amount */}
          <Text className="font-body-medium text-dark mt-5 mb-2" style={{ fontSize: 15 }}>
            Amount
          </Text>
          <TextInput
            className="font-mono text-dark"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
            style={{
              backgroundColor: "#E2E2E9",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 15,
            }}
          />

          {/* Expense Category — only shown when type is "expense" */}
          {category === "expense" && (
            <>
              <Text className="font-body-medium text-dark mt-5 mb-2" style={{ fontSize: 15 }}>
                Category
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowCategoryPicker(true)}
                style={{
                  backgroundColor: "#E2E2E9",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    className="font-mono text-dark"
                    style={{ fontSize: 15 }}
                  >
                    {getCategoryLabel(expenseCategory)}
                  </Text>
                  {overBudgetSet.has(expenseCategory) && (
                    <Text style={{ fontSize: 12, color: "#EF4444", fontWeight: "500", marginTop: 2 }}>
                      Over Budget
                    </Text>
                  )}
                </View>
                {overBudgetSet.has(expenseCategory) ? (
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                ) : (
                  <Ionicons name="chevron-down" size={20} color="#0E0844" />
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Date */}
          <Text className="font-body-medium text-dark mt-5 mb-2" style={{ fontSize: 15 }}>
            Date
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowDatePicker(true)}
            style={{
              backgroundColor: "#E2E2E9",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text className="font-mono text-dark" style={{ fontSize: 15 }}>
              {formatDateDisplay(date)}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#0E0844" />
          </TouchableOpacity>

          {/* Date picker modal */}
          <Modal
            visible={showDatePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.35)",
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingTop: 16,
                  paddingBottom: 40,
                  paddingHorizontal: 16,
                }}
              >
                <Text
                  className="font-body-bold text-dark text-center mb-4"
                  style={{ fontSize: 17 }}
                >
                  Select Date
                </Text>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  themeVariant="light"
                  textColor="#0E0844"
                  onChange={(_, selectedDate) => {
                    if (selectedDate) setDate(selectedDate);
                  }}
                  style={{ height: 200 }}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Account */}
          <Text className="font-body-bold text-dark mt-5 mb-2" style={{ fontSize: 15 }}>
            Account
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowAccountPicker(true)}
            style={{
              backgroundColor: "#E2E2E9",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              className="font-mono"
              style={{
                fontSize: 15,
                color: selectedAccount ? "#0E0844" : "#9ca3af",
              }}
            >
              {selectedAccount?.name ?? "Select Account"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#0E0844" />
          </TouchableOpacity>

          {/* Delete button (edit mode only) */}
          {onDelete && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert(
                  "Delete Transaction",
                  "Are you sure you want to delete this transaction? This action cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        setDeleting(true);
                        try {
                          await onDelete();
                        } catch (err: any) {
                          Alert.alert("Error", err.message ?? "Something went wrong.");
                          setDeleting(false);
                        }
                      },
                    },
                  ]
                );
              }}
              disabled={deleting}
              style={{
                backgroundColor: "#FEE2E2",
                borderRadius: 12,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 24,
                opacity: deleting ? 0.6 : 1,
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 16, color: "#DC2626", fontWeight: "600" }}>
                {deleting ? "Deleting..." : "Delete Transaction"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Category picker modal */}
          <Modal
            visible={showCategoryPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCategoryPicker(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowCategoryPicker(false)}
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.35)",
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingTop: 16,
                  paddingBottom: 40,
                  paddingHorizontal: 16,
                }}
              >
                <Text
                  className="font-body-bold text-dark text-center mb-4"
                  style={{ fontSize: 17 }}
                >
                  Select Category
                </Text>
                <FlatList
                  data={EXPENSE_CATEGORIES}
                  keyExtractor={(item) => item.key}
                  renderItem={({ item }) => {
                    const isOver = overBudgetSet.has(item.key);
                    return (
                      <TouchableOpacity
                        onPress={() => {
                          setExpenseCategory(item.key);
                          setShowCategoryPicker(false);
                        }}
                        style={{
                          paddingVertical: 14,
                          paddingHorizontal: 12,
                          borderRadius: 10,
                          backgroundColor:
                            expenseCategory === item.key ? "#EEF2FF" : "transparent",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons name={item.icon as any} size={20} color="#1e1b4b" style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                          <Text className="font-body-medium text-dark" style={{ fontSize: 16 }}>
                            {item.label}
                          </Text>
                          {isOver && (
                            <Text style={{ fontSize: 12, color: "#EF4444", fontWeight: "500", marginTop: 2 }}>
                              Over Budget
                            </Text>
                          )}
                        </View>
                        {isOver && (
                          <Ionicons name="alert-circle" size={18} color="#EF4444" />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Account picker modal */}
          <Modal
            visible={showAccountPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAccountPicker(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowAccountPicker(false)}
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.35)",
                justifyContent: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingTop: 16,
                  paddingBottom: 40,
                  paddingHorizontal: 16,
                }}
              >
                <Text
                  className="font-body-bold text-dark text-center mb-4"
                  style={{ fontSize: 17 }}
                >
                  Select Account
                </Text>
                <FlatList
                  data={accounts ?? []}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setAccountId(item._id);
                        setShowAccountPicker(false);
                      }}
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        backgroundColor:
                          accountId === item._id ? "#EEF2FF" : "transparent",
                      }}
                    >
                      <Text className="font-body-medium text-dark" style={{ fontSize: 16 }}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
