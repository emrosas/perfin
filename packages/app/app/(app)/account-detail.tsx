import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@perfin/backend/convex";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FinanceCard, type CardColor } from "../../components/FinanceCard";
import { DEFAULT_ACCOUNT_COLOR, DEFAULT_ACCOUNT_TYPE, getCardStyleFromHex } from "../../lib/accountColors";
import { getCategoryLabel } from "../../lib/categories";
import CardIcon from "../../assets/svg/card.svg";
import BagIcon from "../../assets/svg/bag.svg";
import IncomeIcon from "../../assets/svg/income.svg";
import ExpenseIcon from "../../assets/svg/expense.svg";
import type { ComponentType } from "react";

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatCurrency(amount: number): string {
  return (
    "$" +
    Math.abs(amount).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

export default function AccountDetailScreen() {
  const router = useRouter();
  const { id, name, balance, type, color } = useLocalSearchParams<{
    id: string;
    name: string;
    balance: string;
    type: string;
    color: string;
  }>();

  const accountColor = color ?? DEFAULT_ACCOUNT_COLOR;
  const accountType = (type as "card" | "physical") ?? DEFAULT_ACCOUNT_TYPE;
  const accountBalance = parseFloat(balance ?? "0");
  const cardStyle = getCardStyleFromHex(accountColor);

  const IconSvg = accountType === "physical" ? BagIcon : CardIcon;

  const { isAuthenticated } = useConvexAuth();
  const transactions = useQuery(
    api.transactions.listByAccount,
    isAuthenticated && id ? { accountId: id as any } : "skip"
  );

  return (
    <View className="flex-1 bg-transparent">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-page pt-top">
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.navigate("/(app)/accounts")}
            hitSlop={12}
            style={{ alignSelf: "flex-start", marginBottom: 16 }}
          >
            <Ionicons name="chevron-back" size={24} color="#0E0844" />
          </TouchableOpacity>

          {/* Account icon + name */}
          <View className="items-center">
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                backgroundColor: cardStyle.iconBg,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <IconSvg width={44} height={44} color="#FFFFFF" />
            </View>

            <Text
              className="font-body-bold text-dark"
              style={{ fontSize: 22 }}
            >
              {name}
            </Text>

            {/* Balance */}
            <Text
              className="font-mono-bold text-dark"
              style={{ fontSize: 48, lineHeight: 56, marginTop: 4 }}
            >
              {formatCurrency(accountBalance)}
            </Text>
          </View>

          {/* Edit button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/(app)/edit-account",
                params: { id, name, balance, type: accountType, color: accountColor },
              })
            }
            style={{
              backgroundColor: "#E2E2E9",
              borderRadius: 12,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 20,
            }}
          >
            <Ionicons name="pencil" size={18} color="#0E0844" style={{ marginRight: 8 }} />
            <Text className="font-body-medium text-dark" style={{ fontSize: 16 }}>
              Edit
            </Text>
          </TouchableOpacity>

          {/* Transactions header */}
          <Text
            className="font-body-bold text-dark mt-6 mb-4"
            style={{ fontSize: 18 }}
          >
            Transactions
          </Text>

          {/* Transaction list */}
          {!transactions ? (
            <ActivityIndicator size="small" color="#3E3BF1" />
          ) : transactions.length === 0 ? (
            <Text
              className="font-body text-gray-400 text-center mt-4"
              style={{ fontSize: 14 }}
            >
              No transactions for this account.
            </Text>
          ) : (
            transactions.map((tx) => {
              if (!tx) return null;
              const isIncome = tx.category === "income";

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
                        expenseCategory: (tx as any).expenseCategory ?? "",
                      },
                    })
                  }
                >
                  <FinanceCard
                    title={tx.description}
                    amount={tx.amount}
                    color={isIncome ? "blue" : "red"}
                    subtitle={[
                      isIncome ? "Income" : getCategoryLabel((tx as any).expenseCategory),
                      formatDate(tx.date),
                      name ?? "Unknown",
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
