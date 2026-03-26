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
import { useQuery } from "convex/react";
import { api } from "@perfin/backend/convex";
import { FinanceCard } from "./FinanceCard";
import IncomeIcon from "../assets/svg/income.svg";
import ExpenseIcon from "../assets/svg/expense.svg";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { setOnSubmit, setSubmitting as setGlobalSubmitting } from "../lib/newTransactionSubmit";

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
  }) => Promise<void>;
  /** Whether to reset the form after successful submit */
  resetOnSubmit?: boolean;
}

export function TransactionForm({
  heading,
  initialValues,
  onSubmit,
  resetOnSubmit = false,
}: TransactionFormProps) {
  const router = useRouter();
  const accounts = useQuery(api.accounts.getCurrentUserAccounts);

  const [category, setCategory] = useState<Category>(initialValues?.category ?? "income");
  const [title, setTitle] = useState(initialValues?.title ?? "New Transaction");
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  const [date, setDate] = useState(initialValues?.date ?? new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(initialValues?.accountId ?? null);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      });
      if (resetOnSubmit) {
        setCategory("income");
        setTitle("New Transaction");
        setAmount("");
        setDate(new Date());
        setAccountId(null);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
      setGlobalSubmitting(false);
    }
  }, [title, parsedAmount, accountId, category, date, onSubmit, resetOnSubmit]);

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
              onPress={() => router.back()}
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
              category === "income" ? "Income" : "Expense",
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
