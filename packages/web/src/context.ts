import { createContext } from 'svelte';
import { api } from '@perfin/backend/convex/_generated/api';
import { useQuery } from 'convex-svelte';

type AccountsQuery = ReturnType<typeof useQuery<typeof api.accounts.getCurrentUserAccounts>>;

export const [getUserAccounts, setUserAccounts] = createContext<AccountsQuery>();
