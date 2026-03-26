import { useQuery } from "convex/react";
import { api } from "@perfin/backend/convex";
import {
  Image,
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { FinanceCard, type CardColor } from "../../components/FinanceCard";
import { useMemo, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import IncomeIcon from "../../assets/svg/income.svg";
import ExpenseIcon from "../../assets/svg/expense.svg";
import { DEFAULT_ACCOUNT_COLOR } from "../../lib/accountColors";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatCurrency(amount: number): string {
  return (
    "$" +
    Math.abs(amount).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

/** Get month boundaries as YYYY-MM-DD strings for a given offset from current month */
function getMonthRange(offset: number) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const label =
    offset === 0
      ? "This Month"
      : `${MONTH_NAMES[month]} ${year}`;
  return { start, end, label };
}

export default function HomeScreen() {
  const router = useRouter();
  const accounts = useQuery(api.accounts.getCurrentUserAccounts);
  const [monthOffset, setMonthOffset] = useState(0);

  const { start, end, label } = useMemo(() => getMonthRange(monthOffset), [monthOffset]);

  const transactions = useQuery(api.transactions.listMonthlyTransactions, {
    monthStart: start,
    monthEnd: end,
  });

  const totalBalance = accounts
    ? accounts.reduce((sum, a) => sum + a.balance, 0)
    : 0;

  const accountMap = useMemo(() => {
    if (!accounts) return {};
    return Object.fromEntries(accounts.map((a) => [a._id, a.name]));
  }, [accounts]);

  const goBack = useCallback(() => setMonthOffset((o) => o - 1), []);
  const goForward = useCallback(() => setMonthOffset((o) => Math.min(o + 1, 0)), []);

  return (
    <View className="flex-1 bg-transparent">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-page pt-top">
          {/* Logo */}
          <Image
            source={require("../../assets/images/logo.png")}
            style={{ width: 130, height: 48 }}
            resizeMode="contain"
          />

          {/* Balance section */}
          <View className="items-center mt-16">
            <Text
              className="font-body-bold text-dark"
              style={{ fontSize: 24 }}
            >
              Balance
            </Text>
            <Text
              className="font-mono-bold text-dark"
              style={{ fontSize: 56, lineHeight: 64 }}
            >
              {!accounts ? "..." : formatCurrency(totalBalance)}
            </Text>
          </View>

          {/* Account distribution bar */}
          {!accounts ? (
            <ActivityIndicator size="small" color="#3E3BF1" className="mt-6" />
          ) : accounts.length > 0 && totalBalance > 0 ? (
            <View className="flex-row mt-6" style={{ gap: 4 }}>
              {accounts.map((account) => {
                const fraction = account.balance / totalBalance;
                if (fraction <= 0) return null;
                const isSmall = fraction < 0.1;
                return (
                  <View
                    key={account._id}
                    style={{ flex: fraction, minWidth: isSmall ? 32 : undefined }}
                  >
                    <View
                      style={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: account.color ?? DEFAULT_ACCOUNT_COLOR,
                      }}
                    />
                    <Text
                      className="font-body text-dark mt-1"
                      style={{ fontSize: 13 }}
                      numberOfLines={1}
                    >
                      {isSmall ? account.name.slice(0, 3) : account.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>

        {/* Transactions section */}
        <View className="px-page mt-8">
          {/* Month navigator */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={goBack} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color="#0E0844" />
            </TouchableOpacity>

            <Text
              className="font-body-bold text-dark"
              style={{ fontSize: 18 }}
            >
              {label}
            </Text>

            <TouchableOpacity
              onPress={goForward}
              hitSlop={12}
              disabled={monthOffset >= 0}
              style={{ opacity: monthOffset >= 0 ? 0.25 : 1 }}
            >
              <Ionicons name="chevron-forward" size={22} color="#0E0844" />
            </TouchableOpacity>
          </View>

          {/* Transaction list */}
          {!transactions ? (
            <ActivityIndicator size="small" color="#3E3BF1" />
          ) : transactions.length === 0 ? (
            <Text
              className="font-body text-gray-400 text-center mt-4"
              style={{ fontSize: 14 }}
            >
              No transactions this month.
            </Text>
          ) : (
            transactions.map((tx) => {
              if (!tx) return null;
              const isIncome = tx.category === "income";
              const color: CardColor = isIncome ? "blue" : "red";
              const accountName = accountMap[tx.accountId] ?? "Unknown";

              return (
                <TouchableOpacity
                  key={tx._id}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/edit-transaction",
                      params: {
                        id: tx._id,
                        category: tx.category,
                        title: tx.description,
                        amount: String(tx.amount),
                        date: tx.date,
                        accountId: tx.accountId,
                      },
                    })
                  }
                >
                  <FinanceCard
                    title={tx.description}
                    amount={tx.amount}
                    color={color}
                    subtitle={[
                      isIncome ? "Income" : "Expense",
                      formatDate(tx.date),
                      accountName,
                    ]}
                    SvgIcon={isIncome ? IncomeIcon : ExpenseIcon}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
