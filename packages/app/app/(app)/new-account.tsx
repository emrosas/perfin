import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@perfin/backend/convex";
import { AccountForm } from "../../components/AccountForm";

export default function NewAccountScreen() {
  const router = useRouter();
  const createAccount = useMutation(api.accounts.createAccount);

  return (
    <AccountForm
      heading="New Account"
      buttonLabel="Create"
      resetOnSubmit
      onSubmit={async ({ name, balance, type, color }) => {
        await createAccount({ name, balance, type, color });
        router.navigate("/(app)/accounts");
      }}
    />
  );
}
