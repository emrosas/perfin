# Auto-import Transactions from bank and shopping apps on the phone

Research for [#22](https://github.com/emrosas/perfin/issues/22), part of map [#8](https://github.com/emrosas/perfin/issues/8). Sources checked on 2026-10-17. Prices in USD.

## Short answer

Android can do it. A NotificationListenerService sees every notification from the apps the user picks, the app parses the text on the device, and nothing leaves the phone. In Mexico this covers most users, because the big banks and fintechs now send purchase alerts by push, not SMS. Play review risk is moderate. SMS reading is allowed only through a temporary Play exception that reviewers grant case by case, so it should not be the main path.

iOS cannot do it in general. No public API lets an app read other apps' notifications or SMS. What iOS does offer is narrower:

- A Shortcuts automation on Wallet "Transaction" (Apple Pay taps only) or on incoming "Message" (SMS by sender) can call a Perfin App Intent and create a Transaction. The user has to build the automation by hand.
- The share sheet can send a receipt, screenshot or text into Perfin.
- FinanceKit reads Apple Card, Apple Cash and Savings in the US only. It does nothing in Mexico.

Open banking aggregators are the other route. They don't fit the privacy promise because every one of them routes data through its servers and, except SimpleFIN, through ours. They also barely exist for Mexico: Mexico never published the transactional-data rules for open finance, and Belvo's current docs no longer list Mexican banks.

Parsing should be deterministic templates per bank, run on the device, with an on-device model as a fallback for text the templates miss. A server-side LLM costs about $0.01 to $0.02 per user per month but breaks the privacy promise.

Auto-import from on-device sources is a single-device feature, so it belongs to the Unlock, not Perfin Plus. A server-based bank feed could be a Perfin Plus perk later, but it would be US-only.

## What each platform allows

### Android: notification listener

- An app declares a `NotificationListenerService` with the `BIND_NOTIFICATION_LISTENER_SERVICE` permission. The user turns access on in system Settings; the app can only deep-link there ([NotificationListenerService reference](https://developer.android.com/reference/android/service/notification/NotificationListenerService)).
- Each notification arrives as a `StatusBarNotification` with the sending app's package name, plus title, text and big text in its extras. The package name lets the user choose which apps Perfin reads, which is what the ticket asks for.
- Android 15 hides the content of notifications where the system detects a one-time password from untrusted listeners: "Android will stop untrusted apps that implement a NotificationListenerService from reading unredacted content from notifications where an OTP has been detected" ([Android 15 behavior changes](https://developer.android.com/about/versions/15/behavior-changes-all)). Purchase alerts are not OTPs, so they pass through. A bank alert that bundles an OTP into the same text would be redacted.
- Android 13 and later block notification access for sideloaded apps under "restricted settings". Installs from Play are not affected.
- Play has no form or special policy for notification listeners. I checked the [Permissions and APIs that Access Sensitive Information](https://support.google.com/googleplay/android-developer/answer/16558241) page and found no section for it. The general [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311) still applies. Perfin needs an in-app prominent disclosure right before it asks for access, and financial data counts as personal and sensitive.
- Data processed only on the device and never sent off it does not have to be declared as collected in the Play Data safety form ([Data safety help](https://support.google.com/googleplay/android-developer/answer/10787469)). That matches the privacy promise.

### Android: SMS

- Play restricts `READ_SMS` and `RECEIVE_SMS` to the default SMS, Phone or Assistant app. The [SMS and Call Log policy](https://support.google.com/googleplay/android-developer/answer/10208820) lists an exception for "SMS-based money management", for example "apps that track and manage budget". It covers READ_SMS, RECEIVE_SMS, RECEIVE_MMS and RECEIVE_WAP_PUSH.
- The exception is temporary. Google grants it only "when there's currently no alternative method to provide the core functionality", it is "subject to Google Play review and approval", and it needs the Permissions Declaration Form. Budgeting apps "may not exfiltrate or share non-financial or personal SMS history."
- One developer reports a rejection because manual entry counts as an alternative ([dev.to post](https://dev.to/zeta_byte/ive-been-working-on-a-personal-finance-app-called-finvantage-and-i-recently-hit-a-roadblock-4mjh)). That is an anecdote, not policy, but it shows how much is left to the reviewer.
- Android 17 holds any SMS that contains an OTP for 3 hours from apps targeting API 37 ([Android 17 behavior changes](https://developer.android.com/about/versions/17/behavior-changes-17)). Plain purchase alerts are not affected.
- In Mexico, SMS is the weaker source anyway. See the bank table below.

### iOS: FinanceKit

- FinanceKit reads accounts, balances and transactions from Apple Wallet on the device. A transaction has a merchant name, amount, MCC and dates ([FinanceKit docs](https://developer.apple.com/documentation/financekit)).
- Coverage per [Apple's FinanceKit page](https://developer.apple.com/financekit/): in the US on iOS 17.4 and later, Apple Card, Apple Cash and Savings. In the UK on iOS 18.4 and later, open-banking accounts at Barclays, HSBC, Monzo, Santander and others. Mexico is not listed.
- The entitlement is managed. The Account Holder requests it per bundle ID. The app must be in the Finance category, be distributed on the US or UK App Store, and provide money-management tools. That fits Perfin.
- iOS 26 added a background delivery extension, so new Apple Card transactions can arrive without opening the app ([background delivery](https://developer.apple.com/documentation/financekit/implementing-a-background-delivery-extension)).
- I found no sign that iOS 26 opened FinanceKit to other US banks.

### iOS: Shortcuts automations

- The Wallet [Transaction trigger](https://support.apple.com/guide/shortcuts/transaction-trigger-apd65c67538a/ios) runs when the user taps a chosen card with Apple Pay. Transaction and Message automations can run without asking for confirmation ([personal automations](https://support.apple.com/guide/shortcuts/create-a-new-personal-automation-apdfbdbd7123/ios)).
- Apple does not document which fields the trigger passes. Third-party guides say merchant, amount and card name. Developers report the merchant and amount sometimes arrive blank or zero, and the trigger misfiring on iOS 18 ([forum thread](https://developer.apple.com/forums/thread/797233), [forum thread](https://developer.apple.com/forums/thread/758053)).
- It only fires on Apple Pay taps, never on a physical card swipe or an online purchase. Apple Pay supports BBVA, Banorte, Santander, HSBC, Nu, Hey Banco, Klar, RappiPay and others in Mexico, but not Stori, Spin or Mercado Pago ([Apple Pay issuers in Mexico](https://support.apple.com/en-us/109524)).
- The [Message trigger](https://support.apple.com/guide/shortcuts/communication-triggers-apdd711f9dff/ios) filters by sender and "Message Contains" and can pass the SMS text to an App Intent. This catches bank SMS on iOS, but only for banks that still send SMS.
- Both need Perfin to expose an App Intent. Since iOS 26, `supportedModes` lets an intent run in the background without opening the app ([supportedModes](https://developer.apple.com/documentation/appintents/appintent/supportedmodes)).
- The weak point is setup. The user builds each automation in the Shortcuts app; Perfin can only explain the steps or ship a shared shortcut.

### iOS: notifications, SMS and filters

- There is no public API to read another app's notifications or the user's SMS on iOS.
- A Message Filter extension sees SMS only from unknown senders, cannot reach the network, and "can't write data to containers shared with the containing app" ([SMS and MMS message filtering](https://developer.apple.com/documentation/identitylookup/sms-and-mms-message-filtering)). It can't feed Perfin.

### Both: share sheet

- A share extension on iOS and an intent filter on Android let the user send text, a screenshot or a PDF receipt into Perfin. [expo-share-intent](https://github.com/achorein/expo-share-intent) handles both platforms. This is manual, one item at a time, but it has no review risk and works with every app.

### Both: email receipts

- Reading Gmail needs the `gmail.readonly` or full mail scope, both restricted ([Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)). Restricted scopes need Google's OAuth verification. The security assessment is required only "if you store restricted scope data on servers (or transmit)", so an on-device-only client probably skips it but still goes through verification. The assessment renews every 12 months ([restricted scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification)).
- Apple Mail has no API. Shortcuts has an Email trigger by sender or subject, with the same setup burden as the Message trigger.
- Email covers shopping receipts (Amazon, Uber Eats) better than bank purchases. Nu México, for example, emails SPEI transfers but not card purchases ([Nu community thread](https://comunidad.nu.com.mx/t/notificaciones-por-email/26398)). Not worth it for a first version.

## Which banks and shops send alerts

No bank or shop publishes the exact alert wording. Parsers need real, redacted samples from users. "Not stated" below means the official page doesn't say whether the text includes amount and merchant.

### Mexico

| Institution | Push | SMS | Email | Amount and merchant in text | Default | Source |
|---|---|---|---|---|---|---|
| BBVA México | Yes, any amount | Older channel | Not mentioned | Not stated | Opt-in, free | [BBVA notificaciones](https://www.bbva.mx/personas/servicios-digitales/notificaciones.html) |
| Nu México | Yes, per purchase | Not mentioned | Transfers only | Not stated | On when app notifications are allowed | [Nu blog](https://blog.nu.com.mx/personaliza-tu-experiencia-en-la-app-nu/) |
| Santander México | Yes | Unverified | Yes, via Santander Web | Not stated | Unverified | Santander security center page blocked fetches; search snippet only |
| Banorte | Yes, per card charge | Yes, unusual purchases | Yes | Not stated | Opt-in | Banorte help page timed out; search snippet only. One snippet says alerts start at MXN 1,300, unverified |
| Banamex | Yes, purchases, withdrawals, deposits | Turned off when app alerts are on | Yes | Not stated | Opt-in, free | [Banamex app notifications](https://www.banamex.com/es/centro-de-ayuda/servicios-digitales/app-banamex/notificaciones-app.htm) |
| HSBC México | Yes, per purchase or withdrawal | Yes | Yes | Not stated | Opt-in | HSBC México quick-guide PDFs |
| RappiCard | Yes | Unknown | Unknown | Yes, "con el monto y el comercio" | Appears on | [RappiCard blog](https://rappicard.mx/2026/07/31/como-controlar-mis-gastos-desde-la-app-con-rappicard/) |
| Klar | Yes | Unknown | Unknown | Yes for Apple Pay: merchant, amount, time | Unknown | [Klar and Apple Pay](https://klar.mx/post/klar-y-apple-pay-como-configurar-tu-tarjeta-y-pagar-sin-contacto) |
| Stori | Yes, per purchase | Unknown | Unknown | Not stated | Unknown | [Stori blog](https://storicard.com/blog/como-evitar-fraude) |
| Hey Banco | Yes, per charge | May send | Unknown | Not stated | Set in app | [Hey Banco](https://banco.hey.inc/Smart-features) |
| Mercado Pago | Likely | Unknown | Likely | Unverified | Unknown | Help pages blocked fetches |
| Amazon MX | No | No | Order emails | Yes, in the email | On | Not verified against an Amazon MX page |

Mexico has moved purchase alerts to in-app push. Banamex switches SMS off when the user turns on app alerts, BBVA delivers to its own customers by push, and the fintechs are push-only. On Android, the notification listener reaches more Mexican users than SMS would.

### United States

| Institution | Push | SMS | Email | What triggers it | Default | Source |
|---|---|---|---|---|---|---|
| Chase | Yes | Yes | Yes | Charges, refunds, other transactions. Some immediate, some end of day | Transaction alerts opt-in | [Chase alerts](https://www.chase.com/digital/alerts) |
| Amex | Yes | Yes | Yes | Large purchase over a threshold, card not present | Opt-in | Amex alerts page, search snippet only |
| Bank of America | Yes | Yes | Yes | Card charges over a threshold | Opt-in | [BofA alerts](https://info.bankofamerica.com/en/digital-banking/alerts) |
| Capital One | Yes | Yes | Yes | Any purchase over a threshold, $1 suggested | Opt-in | [Capital One security](https://www.capitalone.com/learn-grow/privacy-security/your-security-matters/) |
| Wells Fargo | Yes | Yes | Yes | Purchase over a threshold, sent at authorization | Opt-in | [Wells Fargo alerts FAQ](https://www.wellsfargo.com/help/credit-cards/credit-card-alerts-faqs/) |
| Apple Card | Yes, every use | No | No | Every transaction. Also readable through FinanceKit | Opt-in | [Apple Card notifications](https://support.apple.com/en-us/120361) |
| Cash App | Not stated | Yes | Yes | Every transaction | Recommended | [Cash App security](https://cash.app/security) |
| Venmo, PayPal | Yes | Partly | Yes | Payments | Mixed | [Venmo settings](https://help.venmo.com/cs/articles/notification-settings-vhel258) |
| Uber Eats, Amazon US | Order push | No | Receipts | Each order | On | Uber help, Amazon help |

US banks send alerts on all three channels, but most per-purchase alerts are opt-in with a dollar threshold. Perfin's onboarding would have to tell users to turn on "every purchase" alerts in their bank app.

## Parsing the text into a Transaction

| Method | Where it runs | Cost per user | Works in background | Coverage | Notes |
|---|---|---|---|---|---|
| Templates per bank and app | Device | $0 | Yes | Only known formats | Deterministic. Package name plus regex for amount, currency, merchant, last four digits. Needs real samples and upkeep when banks change wording |
| Apple Foundation Models | Device | $0 | Rate-limited in background and extensions | iPhone 15 Pro, iPhone 16 and later, with Apple Intelligence on | 4,096-token context, structured output with `@Generable`, Spanish supported. Off when the system language isn't supported ([TN3193](https://developer.apple.com/tutorials/data/documentation/technotes/tn3193-managing-the-on-device-foundation-model-s-context-window.md), [devices](https://support.apple.com/en-us/121115)) |
| Gemini Nano via ML Kit Prompt API | Device | $0 | No | Mostly flagships such as Pixel 9 and later, Galaxy S26 | Prompt API is beta, structured output alpha. "GenAI API inference is permitted only when the app is the top foreground application" ([ML Kit GenAI](https://developers.google.com/ml-kit/genai)) |
| Small local model via llama.rn or ExecuTorch | Device | $0 | Possible, heavy | Any phone with the RAM | Qwen2.5 0.5B is a 491 MB download ([model card](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF)). Several seconds per alert on mid-range phones. Too heavy for this job |
| Server LLM | Our server and the model vendor | About $0.014 to $0.023 a month | Yes | All | Breaks the privacy promise unless Sync is on |

Server cost assumes 300 alerts a month, each about 450 input tokens (300 prompt, 150 alert) and 60 output tokens. That is 135k input and 18k output tokens per user per month.

| Model | Input / output per million tokens | Per user per month |
|---|---|---|
| GPT-5 nano | $0.05 / $0.40 | $0.014, before reasoning tokens |
| Gemini 2.5 Flash-Lite | $0.10 / $0.40 | $0.021 |
| Claude Haiku 5.5 | $0.10 / $0.50 | $0.023 |
| Claude Haiku 4.5 | $1 / $5 | $0.225 |

Prices from [OpenAI](https://developers.openai.com/api/docs/pricing), [Google](https://ai.google.dev/gemini-api/docs/pricing) and [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing).

The answer for Perfin is templates first. They run inside the Android notification listener with the app closed, which no on-device model allows on Android. Alerts that no template matches go into an "Unrecognized" inbox. When the user opens the app, an on-device model, where the phone has one, proposes a parse for the user to confirm. This also keeps every auto-import a suggestion the user confirms, the same way [ADR 0004](../adr/0004-recurring-payment-confirm-not-auto-create.md) handles RecurringPayments.

Expo has an official on-device model module, [expo-ai](https://docs.expo.dev/versions/unversioned/sdk/ai). It wraps Apple Foundation Models and Gemini Nano with schema-validated output. It is alpha and "will frequently experience breaking changes". [@react-native-ai/apple](https://github.com/callstackincubator/ai) from Callstack is the alternative on iOS.

## Open banking aggregators

| Provider | Markets | Per-user cost | Needs our backend | Source |
|---|---|---|---|---|
| Plaid | US, Canada, UK, EU. Mexico not listed | Transactions billed monthly per connected login; prices not public | Yes. The secret and token exchange live on a server, updates come by webhook | [Plaid pricing](https://plaid.com/pricing/), [billing](https://plaid.com/docs/account/billing/), [quickstart](https://plaid.com/docs/quickstart/) |
| Teller | US | $0.30 per connection per month for Transactions, 100 free | Yes. mTLS key must not be embedded in the app | [Teller](https://teller.io), [auth docs](https://teller.io/docs/api/authentication) |
| SimpleFIN Bridge | US | $1.50 a month or $15 a year, paid by the user | No. The user pastes a setup token, the app calls the API directly | [SimpleFIN Bridge](https://beta-bridge.simplefin.org/), [protocol](https://www.simplefin.org/protocol.html) |
| Belvo | Mexico, Brazil, Colombia | Launch plan $1,000 a month minimum | Yes | [Belvo pricing](https://belvo.com/plans-and-pricing/), [institutions](https://developers.belvo.com/apis/belvoopenapispec/institutions) |
| Finerio Connect, Syncfy, Prometeo | Mexico and LatAm | Not public | Yes | [Finerio](https://finerioconnect.com/), [Syncfy](https://syncfy.com/products) |
| MX, Finicity, Akoya | US | Negotiated | Yes | [Akoya pricing](https://akoya.com/pricing) |

Mexico. The Ley Fintech (art. 76) created a transactional-data tier, but CNBV only published rules for the open-data tier, in 2020. Startups filed an amparo over the missing rules in late 2025 ([El Financiero, 2026-01-07](https://www.elfinanciero.com.mx/opinion/colaborador-invitado/2026/01/07/el-emprendimiento-demanda-open-finance-lleva-a-la-cnbv-ante-el-juez/)). Belvo's institutions API now lists Mexico only for SAT, IMSS and payments, with banking listed for Brazil. I found no deprecation notice, so this needs a question to Belvo sales. Any Mexican bank feed today would rely on stored bank credentials.

US. The CFPB's section 1033 rule took effect in January 2025, but a court has stayed compliance and the CFPB is rewriting it. The new proposal reached OIRA review on 2026-08-04 and covers whether banks can charge fees ([CFPB reconsideration](https://www.consumerfinance.gov/rules-policy/rules-under-development/personal-financial-data-rights-reconsideration/), [OIRA entry](https://www.reginfo.gov/public/do/eoDetails?rrid=1495765)). JPMorgan started charging aggregators in 2025 and signed a fee deal with Plaid ([Bloomberg Law](https://news.bloomberglaw.com/banking-law/jpmorgan-plaid-data-fee-deal-shifts-open-banking-battlefield)). Expect per-user prices to rise.

Privacy promise. With an aggregator, financial data passes through the aggregator's servers. With Plaid, Teller and Belvo it also passes through ours. That conflicts with "financial data never leaves the device unless the user turns on Sync". It could only work as an opt-in that a Sync user turns on with its own disclosure. SimpleFIN is the one US option where the device talks to the provider directly with no Perfin server. The user pays SimpleFIN, so Perfin pays nothing. Its docs never mention mobile clients, so this needs a device test.

## Store review risk

| Approach | Apple | Google Play |
|---|---|---|
| Notification listener | n/a | Medium. No form, but it must be a core feature with a prominent disclosure, and the listing should say so |
| SMS reading | n/a | High. Temporary exception, declaration form, reviewer discretion |
| FinanceKit | Low once the entitlement is granted. Apple decides who gets it | n/a |
| Shortcuts plus App Intents | Low | n/a |
| Share sheet | Low | Low |
| Gmail on device | n/a | Google OAuth restricted-scope verification, separate from Play review |
| Aggregators | Low for review. Privacy labels must list financial data as collected | Same, in the Data safety form |

App Store guideline 5.1.1(ix) says apps in "highly regulated fields such as banking and financial services" should come from a legal entity, not an individual ([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)). A budgeting app that offers no financial service is normally outside that rule. FinanceKit and aggregators make Perfin look more like a financial service, so expect more questions if Perfin ships from a persona física account.

## Expo feasibility

Everything here needs a development build. Expo Go can't load custom native code ([development builds](https://docs.expo.dev/develop/development-builds/introduction/)).

- Android notification listener. Write a small local Expo module in Kotlin with a config plugin that adds the service to the manifest. [react-native-android-notification-listener](https://github.com/leandrosimoes/react-native-android-notification-listener) exists and uses Headless JS, but it has no config plugin and little upkeep. Parsing should happen in Kotlin or in a headless JS task that writes straight to the local store, because the app is usually closed when alerts arrive.
- Android SMS. [react-native-get-sms-android](https://github.com/briankabiro/react-native-get-sms-android) plus a config plugin for the permissions. Only worth it if Play grants the exception.
- iOS App Intents for Shortcuts. Swift App Intent in the main app target through a local Expo module, or an extension target through [@bacons/apple-targets](https://github.com/EvanBacon/expo-apple-targets).
- iOS FinanceKit. Local Expo module in Swift, a config plugin for the entitlement and `NSFinancialDataUsageDescription`, and an extension target for background delivery.
- Share sheet. [expo-share-intent](https://github.com/achorein/expo-share-intent) on both platforms.
- On-device model fallback. [expo-ai](https://docs.expo.dev/versions/unversioned/sdk/ai), alpha.

## Perfin Plus or Unlock

The map sets two rules: financial data never leaves the device unless the user turns on Sync, and Perfin Plus never takes a single-device feature away from the Unlock.

- The notification listener, Shortcuts intents, share sheet and FinanceKit all run on one device with no server. They are single-device features, so they belong to the Unlock. Putting them behind Perfin Plus would break the second rule.
- A server-based bank feed, through an aggregator or a server LLM parser, needs a server, costs money per user every month, and sends financial data off the device. That only fits for users who already turned on Sync and consented. It could be a Perfin Plus perk later. It would be US-only, since Mexico has no workable aggregator, and Teller's $0.30 a month per connection is the clearest public price.

## Open questions

- Real alert texts from BBVA, Nu, Santander, Banorte, Mercado Pago, Rappi and Amazon MX. No institution publishes its wording.
- Whether Belvo still aggregates Mexican bank data.
- Which fields the Shortcuts Wallet Transaction trigger passes, in which countries.
- How OEM battery savers in Mexico (Xiaomi, Motorola, Samsung) treat a notification listener. I found no official source.
- Whether Play has rejected notification-listener budgeting apps. I found no official precedent.
