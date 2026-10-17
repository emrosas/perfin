# RevenueCat for the one-time unlock, sync subscription and Customizations

Research for [#11](https://github.com/emrosas/perfin/issues/11), part of the map [#8](https://github.com/emrosas/perfin/issues/8). Checked 2026-10-17 against RevenueCat, Apple, Google, Stripe and Paddle docs and pricing pages. Numbers in brackets point to the source list at the end.

## Question

Can RevenueCat handle a one-time unlock (non-consumable), a cloud-sync subscription and Customizations (Themes, App Icons) across iOS, Android, web and desktop? Covers fees, MXN/USD price points, store commissions, cross-platform entitlements, offline entitlement checks in a local-first app, restoring without an account, and alternatives.

## Short answer

Yes. All three product types fit RevenueCat's model, and at Perfin's likely revenue it costs nothing. RevenueCat is free below $2,500 a month in tracked revenue, then 1% [1][2]. Two things need care.

1. **Offline.** RevenueCat caches entitlements on the device, but its offline fallback doesn't cover one-time purchases [16], and the cache has a three-day grace rule whose effect on lifetime entitlements isn't spelled out [15]. Perfin should keep its own local copy of what the user owns and use RevenueCat to refresh it.
2. **Cross-platform needs an account.** Anonymous IDs can't share purchases across platforms [12]. That matches the map: local use stays anonymous, and when the user turns on sync and creates an account, `logIn()` merges the anonymous purchases into the account [12]. From then on the same entitlements show on iOS, Android, web and desktop.

## Product model in RevenueCat

| Perfin product | Store product type | RevenueCat setup |
|---|---|---|
| One-time unlock | Non-consumable | Attach to a `full` entitlement. RevenueCat's own recommendation for a "Lifetime Unlock" [4]. The entitlement's expiration date is null for lifetime access [16]. |
| Cloud sync | Auto-renewable subscription | Attach to a `sync` entitlement. Active for the product's duration [3]. |
| Each Theme, each App Icon pack | Non-consumable | One entitlement per item (or per pack). Products and entitlements are many-to-many, so a bundle product can unlock several entitlements [3]. |

Notes:

- Don't make Customizations consumables. A consumable attached to an entitlement unlocks it "forever" after one purchase, and consumables can't be restored without a custom App User ID [3][4][13].
- On Google Play, mark each one-time product as non-consumable in the RevenueCat dashboard. Otherwise the SDK consumes the purchase and Google lets the user buy it again [5]. Non-consumable support needs Android SDK 7.11.0 or later [4].
- Google Billing Client 8 can't query *consumed* one-time purchases, which breaks restores for anonymous users on `react-native-purchases` 9.0.0+ [13]. Correctly flagged non-consumables aren't consumed, so this only bites if a product is misconfigured.
- Apple requires in-app purchase to unlock features and a restore mechanism for restorable purchases (guideline 3.1.1) [22]. Themes and App Icons fall under that rule.
- Expo needs a development build. Expo Go runs `react-native-purchases` in a mock "Preview API Mode" where real purchases don't work [6].

## Fees

### RevenueCat

- Pro plan: free up to $2,500 monthly tracked revenue (MTR), then 1% of MTR [1][2].
- MTR counts all purchases and renewals, one-time products included, measured *before* store commission and tax. Example from the docs: $2,600 MTR costs $26 [2].
- If MTR drops back under $2,500, it's free again [2].
- RevenueCat Web (web checkout, Web SDK) adds no RevenueCat fee on top. You pay the payment processor [7].

### Store commissions

| Store | US | Mexico |
|---|---|---|
| Apple, App Store Small Business Program | 15% on paid apps and in-app purchases, for developers under $1M proceeds in the prior and current calendar year [20]. Not automatic: you enroll [18][20]. | Same program, same 15% [20]. |
| Apple, without the program | Subscriptions: you get 70% in year one, 85% after a subscriber has a year of paid service [21]. | Same [21]. |
| Google Play | Since 2026-06-30 the US uses a new regional structure. The row for the first $1M of annual earnings reads "10% + 5% billing fee", which is 15% total when the user pays with Google Play Billing [28]. Above that, one-time purchases cost 20% + 5% for installs after the rollout date and 25% + 5% for older installs; subscriptions stay 10% + 5% [28]. | Old structure still applies: 15% on the first $1M a year if you enroll in the 15% tier, 30% above; auto-renewing subscriptions 15% at any revenue [28]. Enrollment needs a payments profile and an account group [29]. |

The Google US table uses merged cells. I read the "First $1M" row as covering all transaction types. Check the Play Console earnings report after the first US sale.

In both stores the effective rate for Perfin at launch is 15%.

### Web and desktop processors

| Option | Fee | Merchant of record |
|---|---|---|
| RevenueCat Billing (Stripe underneath) | Stripe's fee. US: 2.9% + 30¢, +1.5% international cards, +1% currency conversion [33]. Mexico account: 3.6% + MXN 3, +0.5% international, +2% conversion [34]. Optional Stripe Tax 50¢ per transaction where registered (US pricing) [7]. | You. Tax collection is optional and your responsibility [7][11]. |
| Stripe Billing via RevenueCat | Above + 0.7% Billing fee [7]. | You. |
| Stripe Managed Payments | 3.5% on top of Stripe's processing fee [33]. | Stripe. Seller must be based in the US, Canada, Europe, Australia, Hong Kong, Japan or Singapore. Mexico isn't listed [35]. |
| Paddle via RevenueCat | 5% + 50¢ per transaction [36]. One product per purchase [38]. | Paddle. Handles tax collection and filing [36]. |

Fee per sale at two example US prices, before tax and before RevenueCat's 1%:

| Price | App Store / Play (15%) | Paddle (5% + 50¢) | Stripe US (2.9% + 30¢) |
|---|---|---|---|
| $2.99/month sync | $0.45 | $0.65 | $0.39 |
| $19.99 one-time unlock | $3.00 | $1.50 | $0.88 |

Paddle's fixed 50¢ makes it the most expensive option on a small monthly price. Stripe is cheapest but leaves tax to Perfin.

## MXN and USD price points

Prices for store products live in App Store Connect and Play Console. RevenueCat reads them; it doesn't set them.

- **Apple.** Pick a base storefront and price; Apple generates prices for the other 174 storefronts and 43 currencies, adjusting for exchange rates and tax over time. Apple never changes the base price [23]. You can set MXN by hand instead, and Apple then stops adjusting that storefront [23]. 800 price points by default, 100 more on request, up to $10,000 [23]. Steps are $0.10 up to $10 and $0.50 from $10 to $50 [24]. Auto-renewable subscriptions have their own pricing rules (not checked here).
- **Google.** Per-country prices within the min/max range Google publishes for each currency [30]. That table renders client-side and I couldn't extract the MXN and USD rows; read them in Play Console when setting prices.
- **RevenueCat Billing (web).** Set one price per currency per product. Minimums: USD $0.99, MXN $19.99 [10]. A default currency covers buyers whose location doesn't match a configured currency [10].

Perfin can set a round MXN price (e.g. $49) on each store rather than accept a converted one. Choosing the actual prices belongs to the pricing ticket.

## Cross-platform entitlements (buy on iOS, use on web)

How it works:

- An App User ID is the key for entitlements across devices and platforms. A user logged in with the same App User ID on different platforms gets entitlements bought on any of them [12].
- Anonymous IDs (`$RCAnonymousID:…`) can't share status across apps or platforms [12].
- Calling `logIn(customId)` from an anonymous ID merges the two when the custom ID is new or has no anonymous alias yet [12]. That's the moment a local user turns on sync: purchases they made anonymously follow them into the account.
- A subscription can only be *managed* (cancelled, changed) on the platform where it was bought [12].
- On web, `react-native-purchases` in an Expo web build needs RevenueCat Billing and the same `appUserID` as mobile. `getProducts`, `purchaseProduct` and `restorePurchases` don't work there [6]. The standalone Web SDK (`purchases-js`) supports identified and anonymous users [8]. Anonymous web buyers get a one-time Redemption Link, valid 60 minutes, that opens the app and attaches the purchase [9]. Perfin's web companion needs a sync account anyway, so it can always use the identified path.
- For desktop, macOS through the Mac App Store uses the same Apple SDK and supports universal purchases shared with iOS [39]. Windows or Linux has no store, so it would use the Web SDK with RevenueCat Billing or Paddle and an identified user.

Store rules that apply:

- Apple 3.1.3(b): a multiplatform app may let users access content bought on other platforms or the web, "provided those items are also available as in-app purchases within the app" [22]. So sync bought on the web can unlock sync on iOS, as long as the iOS app also sells it.
- Apple 3.1.2: an auto-renewable subscription must "be available across all of the user's devices" [22].
- Linking out to web checkout from iOS: allowed on the US storefront without an entitlement, still prohibited on other storefronts, Mexico included [22]. RevenueCat's app-to-web buttons respect per-storefront eligibility [7][19].

## Checking entitlements offline

What RevenueCat gives a local-first app:

- `CustomerInfo` and the App User ID are cached on disk and survive restarts [15]. `getCustomerInfo()` usually returns from cache without a network call [15][16].
- Offline, "CustomerInfo will be returned while offline forever if the user never goes online, unless something happens that invalidates the cache" [15].
- But: "If the user's entitlement was active at the time they went offline, it will remain active for up to three days" [15]. The page doesn't say whether this applies to entitlements with no expiration date. I couldn't confirm either way from the docs.
- `logOut()` clears the cache [15]. Reinstalling clears it and creates a new anonymous ID [12].
- The "Offline Entitlements" feature (granting access when RevenueCat's servers are down during a purchase) doesn't work for one-time purchases [16].
- Trusted Entitlements signs entitlement responses so the app can detect tampering. It's informational; the app decides what to do with an unverified result [17].
- Offline behavior of the Web SDK isn't documented.

Recommendation: store owned entitlements (`full`, `sync`, each Customization) in Perfin's local database, written whenever `CustomerInfo` updates and its verification passes. Gate features on the local copy. Only remove a lifetime item when RevenueCat reports it gone while online (refund). This keeps the app working on a plane, after RevenueCat outages, and on a desktop build with no documented cache.

For comparison, raw StoreKit 2 does this natively. `Transaction.currentEntitlements` lists every non-consumable and active subscription, excluding refunds [25], StoreKit verifies the signed transactions itself [27], and after reinstall or on a new device "the app automatically has all transactions available to it upon initial launch" [26].

## Restoring without an account

- `restorePurchases()` re-attaches purchases made with the same Apple or Google account [13]. Call it only from a button, because it can show an OS sign-in prompt [13]. Apple also expects a restore button [26].
- Set the project's restore behavior to "Transfer to new App User ID", the default. RevenueCat lists it as required for apps with no login or optional login, so a reinstall with a fresh anonymous ID can restore [14]. One-time purchases don't block transfers [14].
- Non-consumables and subscriptions restore this way. Consumables don't, because they disappear from the store receipt [13].
- Restore stays within one store. A lifetime unlock bought on iOS can't reach Android without an account, because anonymous IDs don't cross platforms [12]. Under the map's plan, that's acceptable: cross-device is what the sync account is for.

## Alternatives

**StoreKit 2 and Play Billing directly** (through an Expo module). No 1% fee and good offline behavior on iOS [25][26][27]. The costs:

- Android purchases must be acknowledged within three days or Google refunds them [31], and Google recommends verifying purchases on a backend [31][32].
- Cross-platform entitlements mean writing your own receipt verification, store server-notification handling and refund handling on the sync backend.
- Web and desktop checkout is a separate build.

Below $2,500 MTR RevenueCat is free [1], so going direct saves nothing until revenue passes that. At $10,000 MTR it saves $100 a month [2].

**Stripe directly** for web and desktop. Cheapest per transaction [33][34]. Perfin becomes merchant of record and handles US sales tax and Mexican IVA itself. RevenueCat Billing already wraps Stripe with no extra RevenueCat fee [7], so going direct only drops RevenueCat's entitlement sync.

**Paddle.** Merchant of record, handles tax [36], and plugs into RevenueCat for entitlements [38]. Costs more on small monthly prices.

**Lemon Squeezy.** Merchant of record at 5% + 50¢ [37]. RevenueCat's docs don't mention it, so entitlements would need your own glue. Its pricing page carries a "2026 Update: Lemon Squeezy + Stripe Managed Payments" banner and the footer reads "Sold through Link, LLC f/k/a Lemon Squeezy LLC" [37]. Its future as a separate product looks uncertain. Skip it.

## Recommendation

Use RevenueCat.

- Mobile: `react-native-purchases` in an Expo dev build, anonymous IDs for local users, restore behavior "Transfer to new App User ID", a Restore button in settings.
- Products: non-consumable `full` unlock, auto-renewable `sync` subscription, one non-consumable per Theme or App Icon pack. Flag all one-time products as non-consumable in the dashboard.
- When the user turns on sync: create the account, then `logIn(authUserId)` so earlier anonymous purchases merge into it.
- Web companion and future desktop: the same App User ID with RevenueCat Billing. Paddle is the fallback if handling sales tax becomes a burden. Stripe Managed Payments doesn't accept Mexico-based sellers [35].
- Mirror entitlements into the local database and gate features on that copy, not on a live RevenueCat call.
- Enroll in the Apple Small Business Program and Google's 15% tier before launch, and record the Apple entry date in RevenueCat so its charts use the right rate [18].

## Open questions

- Does the three-day offline grace [15] apply to lifetime entitlements? Test it: buy in sandbox, go offline, move the device clock forward a week, check `CustomerInfo`.
- Exact Google Play MXN/USD price limits [30]. Read them in Play Console.
- Where Perfin's business is registered (Mexico or US). That decides Stripe fees [33][34], eligibility for Stripe Managed Payments [35], and who owes tax on web sales. It belongs to the tax ticket.

## Sources

1. RevenueCat, Pricing. https://www.revenuecat.com/pricing/
2. RevenueCat, Billing and account settings (MTR definition). https://www.revenuecat.com/docs/welcome/set-up-revenuecat/account-management
3. RevenueCat, Entitlements. https://www.revenuecat.com/docs/getting-started/entitlements
4. RevenueCat, Non-Subscription Purchases. https://www.revenuecat.com/docs/platform-resources/non-subscriptions
5. RevenueCat, Google Play Product Setup (Add non-consumable products). https://www.revenuecat.com/docs/getting-started/entitlements/android-products
6. RevenueCat, Expo installation (Expo Go, React Native Web). https://www.revenuecat.com/docs/getting-started/installation/expo
7. RevenueCat, Getting Started With RevenueCat Web (billing engines, fee comparison). https://www.revenuecat.com/docs/web/overview
8. RevenueCat, Web SDK. https://www.revenuecat.com/docs/web/web-billing/web-sdk
9. RevenueCat, Redemption Links. https://www.revenuecat.com/docs/web/redemption-links
10. RevenueCat, Supporting Multiple Currencies. https://www.revenuecat.com/docs/web/web-billing/multi-currency-support
11. RevenueCat, Sales Tax & VAT. https://www.revenuecat.com/docs/web/web-billing/tax
12. RevenueCat, Identifying Customers. https://www.revenuecat.com/docs/customers/identifying-customers
13. RevenueCat, Restoring Purchases. https://www.revenuecat.com/docs/getting-started/restoring-purchases
14. RevenueCat, Restore Behavior. https://www.revenuecat.com/docs/projects/restore-behavior
15. RevenueCat, Caching. https://www.revenuecat.com/docs/test-and-launch/debugging/caching
16. RevenueCat, Getting Subscription Status (Offline Entitlements, entitlement fields). https://www.revenuecat.com/docs/customers/customer-info
17. RevenueCat, Trusted Entitlements. https://www.revenuecat.com/docs/customers/trusted-entitlements
18. RevenueCat, App Store Small Business Program. https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/app-store-small-business-program
19. RevenueCat, App-to-web purchases (store rules and fees). https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls/web-purchase-button
20. Apple, App Store Small Business Program. https://developer.apple.com/app-store/small-business-program/
21. Apple, Auto-renewable subscriptions. https://developer.apple.com/app-store/subscriptions/
22. Apple, App Review Guidelines (3.1.1, 3.1.1(a), 3.1.2, 3.1.3(b)). https://developer.apple.com/app-store/review/guidelines/
23. Apple, Set a price for an In-App Purchase. https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/set-a-price-for-an-in-app-purchase/
24. Apple, App Store pricing upgrades have expanded to all purchase types. https://developer.apple.com/news/?id=dbrszv62
25. Apple, `Transaction.currentEntitlements`. https://developer.apple.com/documentation/storekit/transaction/currententitlements
26. Apple, `AppStore.sync()`. https://developer.apple.com/documentation/storekit/appstore/sync()
27. Apple, `VerificationResult`. https://developer.apple.com/documentation/storekit/verificationresult
28. Google, Play Console Help: Service fees. https://support.google.com/googleplay/android-developer/answer/112622
29. Google, Play Console Help: Changes to Google Play's service fee in 2021 (15% tier enrollment). https://support.google.com/googleplay/android-developer/answer/10632485
30. Google, Supported locations for distribution (currency and price ranges). https://support.google.com/googleplay/android-developer/table/3541286
31. Android Developers, Integrate the Google Play Billing Library. https://developer.android.com/google/play/billing/integrate
32. Android Developers, `BillingClient.queryPurchasesAsync` reference. https://developer.android.com/reference/com/android/billingclient/api/BillingClient
33. Stripe, Pricing (US). https://stripe.com/us/pricing
34. Stripe, Pricing (Mexico). https://stripe.com/mx/pricing
35. Stripe, Managed Payments eligibility. https://docs.stripe.com/payments/managed-payments/eligibility
36. Paddle, Pricing. https://www.paddle.com/pricing
37. Lemon Squeezy, Pricing. https://www.lemonsqueezy.com/pricing
38. RevenueCat, Paddle Billing. https://www.revenuecat.com/docs/web/integrations/paddle
39. RevenueCat, iOS & Apple Platforms installation (universal purchases on macOS). https://www.revenuecat.com/docs/getting-started/installation/ios
