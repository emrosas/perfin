import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@perfin/backend/convex";
import { AccountForm } from "../../components/AccountForm";

export default function EditAccountScreen() {
  const router = useRouter();
  const { id, name, balance, type, color } = useLocalSearchParams<{
    id: string;
    name: string;
    balance: string;
    type: string;
    color: string;
  }>();

  const updateAccount = useMutation(api.accounts.updateAccount);

  return (
    <AccountForm
      key={id}
      heading="Edit Account"
      buttonLabel="Save"
      returnTo="/(app)/accounts"
      initialValues={{
        name: name ?? "",
        balance: balance ?? "",
        type: (type as "card" | "physical") ?? "card",
        color: color ?? "#3E3BF1",
      }}
      onSubmit={async (values) => {
        await updateAccount({
          id: id as any,
          name: values.name,
          balance: values.balance,
          type: values.type,
          color: values.color,
        });
        router.navigate("/(app)/accounts");
      }}
    />
  );
}
