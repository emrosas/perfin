import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@perfin/backend/convex";
import { TransactionForm } from "../../components/TransactionForm";
import { View, ActivityIndicator } from "react-native";

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id, category, title, amount, date, accountId, expenseCategory } = useLocalSearchParams<{
    id: string;
    category: string;
    title: string;
    amount: string;
    date: string;
    accountId: string;
    expenseCategory: string;
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
        expenseCategory: expenseCategory ?? "miscellaneous",
      }}
      onSubmit={async (values) => {
        await updateTransaction({
          id: id as any,
          amount: values.amount,
          description: values.title,
          category: values.category,
          date: values.date,
          accountId: values.accountId as any,
          expenseCategory: values.expenseCategory,
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
