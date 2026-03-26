import { useQuery } from "convex/react";
import { api } from "@perfin/backend/convex";
import { Text, View, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useConvexAuth } from "convex/react";
import { FinanceCard } from "../../components/FinanceCard";
import { DEFAULT_ACCOUNT_COLOR, DEFAULT_ACCOUNT_TYPE } from "../../lib/accountColors";
import BagIcon from "../../assets/svg/bag.svg";
import CardIcon from "../../assets/svg/card.svg";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentType } from "react";

export default function AccountsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const accounts = useQuery(api.accounts.getCurrentUserAccounts, isAuthenticated ? undefined : "skip");

  return (
    <View className="flex-1 bg-transparent pt-top px-page">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-2xl font-bold text-gray-900">
          Accounts
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(app)/new-account")}
          hitSlop={12}
        >
          <Ionicons name="add-circle" size={28} color="#3E3BF1" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        {!accounts ? (
          <ActivityIndicator size="small" color="#3E3BF1" />
        ) : accounts.length === 0 ? (
          <Text className="text-gray-400 text-center mt-8">
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
    </View>
  );
}
