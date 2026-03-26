import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@perfin/backend/convex";
import { TransactionForm } from "../../components/TransactionForm";
import { View, ActivityIndicator } from "react-native";

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id, category, title, amount, date, accountId } = useLocalSearchParams<{
    id: string;
    category: string;
    title: string;
    amount: string;
    date: string;
    accountId: string;
  }>();

  const updateTransaction = useMutation(api.transactions.updateTransaction);
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);

  // Parse date string (YYYY-MM-DD) into a Date object
  const initialDate = date ? new Date(date + "T00:00:00") : new Date();

  return (
    <TransactionForm
      key={id}
      heading="Edit Transaction"
      initialValues={{
        category: (category as "income" | "expense") ?? "income",
        title: title ?? "",
        amount: amount ? String(Math.abs(parseFloat(amount))) : "",
        date: initialDate,
        accountId: accountId ?? null,
      }}
      onSubmit={async (values) => {
        await updateTransaction({
          id: id as any,
          amount: values.amount,
          description: values.title,
          category: values.category,
          date: values.date,
          accountId: values.accountId as any,
        });
        router.navigate("/(app)/");
      }}
      onDelete={async () => {
        await deleteTransaction({ id: id as any });
        router.navigate("/(app)/");
      }}
    />
  );
}
