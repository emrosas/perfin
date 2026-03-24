import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

const convexSiteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL!;

export const authClient = createAuthClient({
  baseURL: convexSiteUrl,
  plugins: [convexClient()],
});
