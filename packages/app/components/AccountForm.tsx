import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { FinanceCard } from "./FinanceCard";
import { ACCENT_COLORS, DEFAULT_ACCOUNT_COLOR, DEFAULT_ACCOUNT_TYPE } from "../lib/accountColors";
import CardIcon from "../assets/svg/card.svg";
import BagIcon from "../assets/svg/bag.svg";
import type { ComponentType } from "react";

type AccountType = "card" | "physical";

export interface AccountFormValues {
  name: string;
  balance: string;
  type: AccountType;
  color: string;
}

interface AccountFormProps {
  heading: string;
  buttonLabel: string;
  initialValues?: Partial<AccountFormValues>;
  returnTo?: string;
  resetOnSubmit?: boolean;
  onSubmit: (values: {
    name: string;
    balance: number;
    type: AccountType;
    color: string;
  }) => Promise<void>;
}

export function AccountForm({
  heading,
  buttonLabel,
  initialValues,
  returnTo,
  resetOnSubmit = false,
  onSubmit,
}: AccountFormProps) {
  const router = useRouter();
  const goBack = () => {
    if (returnTo) {
      router.navigate(returnTo as any);
    } else {
      router.navigate("/(app)/accounts");
    }
  };

  const [name, setName] = useState(initialValues?.name ?? "New Account");
  const [balance, setBalance] = useState(initialValues?.balance ?? "");
  const [type, setType] = useState<AccountType>(initialValues?.type ?? DEFAULT_ACCOUNT_TYPE);
  const [color, setColor] = useState(initialValues?.color ?? DEFAULT_ACCOUNT_COLOR);
  const [submitting, setSubmitting] = useState(false);

  const parsedBalance = parseFloat(balance) || 0;
  const IconComponent: ComponentType<{ width: number; height: number }> =
    type === "physical" ? BagIcon : CardIcon;

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter an account name.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        balance: parsedBalance,
        type,
        color,
      });
      if (resetOnSubmit) {
        setName("New Account");
        setBalance("");
        setType(DEFAULT_ACCOUNT_TYPE);
        setColor(DEFAULT_ACCOUNT_COLOR);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }, [name, parsedBalance, type, color, onSubmit]);

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
            title={name || "New Account"}
            amount={parsedBalance}
            accentColor={color}
            SvgIcon={IconComponent as ComponentType<{ width: number; height: number }>}
            showIconBg
            showChevron={false}
          />

          {/* Account Type */}
          <Text className="font-body-bold text-dark mt-4 mb-2" style={{ fontSize: 15 }}>
            Account Type
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
              onPress={() => setType("card")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: type === "card" ? "#FFFFFF" : "transparent",
              }}
            >
              <CardIcon width={20} height={20} color="#3E3BF1" />
              <Text className="font-body-medium text-dark ml-2" style={{ fontSize: 15 }}>
                Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setType("physical")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: type === "physical" ? "#FFFFFF" : "transparent",
              }}
            >
              <BagIcon width={20} height={20} color="#3E3BF1" />
              <Text className="font-body-medium text-dark ml-2" style={{ fontSize: 15 }}>
                Physical
              </Text>
            </TouchableOpacity>
          </View>

          {/* Color picker */}
          <Text className="font-body-bold text-dark mt-5 mb-2" style={{ fontSize: 15 }}>
            Color
          </Text>
          <View className="flex-row" style={{ gap: 10 }}>
            {ACCENT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                activeOpacity={0.8}
                onPress={() => setColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: c,
                  borderWidth: color === c ? 3 : 0,
                  borderColor: "#FFFFFF",
                  // Outer ring via shadow for selected
                  ...(color === c
                    ? {
                        shadowColor: c,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 4,
                        elevation: 4,
                      }
                    : {}),
                }}
              />
            ))}
          </View>

          {/* Title */}
          <Text className="font-body-medium text-dark mt-5 mb-2" style={{ fontSize: 15 }}>
            Title
          </Text>
          <View style={{ position: "relative" }}>
            <TextInput
              className="font-mono text-dark"
              value={name}
              onChangeText={setName}
              placeholder="New Account"
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
            {name.length > 0 && (
              <TouchableOpacity
                onPress={() => setName("")}
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

          {/* Balance */}
          <Text className="font-body-medium text-dark mt-5 mb-2" style={{ fontSize: 15 }}>
            {initialValues ? "Balance" : "Starting Balance"}
          </Text>
          <TextInput
            className="font-mono text-dark"
            value={balance}
            onChangeText={setBalance}
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

          {/* Submit button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={submitting}
            style={{
              backgroundColor: "#3E3BF1",
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              marginTop: 24,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            <Text className="font-body-bold" style={{ fontSize: 17, color: "#FFFFFF" }}>
              {submitting ? "Saving..." : buttonLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
