import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@perfin/backend/convex";
import { TransactionForm } from "../../components/TransactionForm";

export default function NewTransactionScreen() {
  const router = useRouter();
  const applyTransaction = useMutation(api.transactions.applyTransaction);

  return (
    <TransactionForm
      heading="New Transaction"
      resetOnSubmit
      onSubmit={async ({ category, title, amount, date, accountId, expenseCategory }) => {
        await applyTransaction({
          amount,
          description: title,
          category,
          date,
          accountId: accountId as any,
          expenseCategory,
        });
        router.navigate("/(app)/");
      }}
    />
  );
}
