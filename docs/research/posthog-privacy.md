# PostHog on Expo under the privacy promise

Research for [#13](https://github.com/emrosas/perfin/issues/13), part of map [#8](https://github.com/emrosas/perfin/issues/8). Sources checked on 2026-10-17. This is not legal advice. Open questions for a lawyer are at the end.

## Short answer

Yes. PostHog can run in the Expo app without breaking the privacy promise, but the defaults are wrong for Perfin and five settings have to change:

1. Start opted out (`defaultOptIn: false`) and call `optIn()` only after the user says yes on a consent screen. Apple requires consent for usage analytics even when the data is anonymous, so this is not optional on iOS.
2. Never create person profiles (`personProfiles: 'never'`) and never call `identify()` with the sync account ID.
3. Leave touch autocapture off. It sends the text of whatever the user tapped, which in Perfin means amounts and descriptions.
4. Leave session replay off.
5. Turn off GeoIP in the SDK and set the project to discard client IPs. Use the `$locale` and `$timezone` the SDK already sends to split MX from US users.

Use PostHog Cloud US on the free tier. Self-hosting buys nothing here. Under Mexico's new LFPDPPP, Perfin needs a privacy notice (aviso de privacidad) with the Article 15 contents, a short version at the point of consent, and a way to revoke consent. CCPA almost certainly does not apply to Perfin yet, but the same notice and opt-out cover it if it ever does.

## The SDK on Expo

**Install.** PostHog documents an Expo path. Run `npx expo install posthog-react-native expo-file-system expo-application expo-device expo-localization` ([PostHog React Native docs](https://posthog.com/docs/libraries/react-native)). The SDK is `posthog-react-native`, version 4.81.2 at the time of writing ([package.json](https://github.com/PostHog/posthog-js/blob/main/packages/react-native/package.json)).

**Opt-in mode.** `defaultOptIn` defaults to `true`. The source says "If set to false the SDK will not track until the `optIn` function is called" ([core types](https://github.com/PostHog/posthog-js/blob/main/packages/core/src/types.ts)). `optOut()` and the `optedOut` property handle withdrawal ([PostHog React Native docs](https://posthog.com/docs/libraries/react-native)). PostHog's privacy guide recommends exactly this pattern: load opted out, opt in after consent ([Controlling data collection](https://posthog.com/docs/privacy/data-collection)).

**Anonymous mode.** The React Native SDK shares the core option `personProfiles: 'always' | 'identified_only' | 'never'`, default `'identified_only'`. With `'never'`, "identify(), alias(), and group() will be no-ops" ([core types](https://github.com/PostHog/posthog-js/blob/main/packages/core/src/types.ts)). PostHog's anonymous-events page doesn't list React Native, but the option is in the shared core config, so it applies. Anonymous events can cost up to 4x less than identified ones once you pass the free tier ([Anonymous vs identified events](https://posthog.com/docs/data/anonymous-vs-identified-events)). One catch: mobile config ships inside the app binary, so changing `personProfiles` later only reaches users who update (same page).

Anonymous does not mean "no identifier". The SDK still stores a random distinct ID on the device and sends it with every event. That matters for the store labels and for deletion requests below.

**What every event carries.** From the Expo path the SDK adds app name, bundle ID, version and build, device manufacturer, device model (`$device_name` is `expo-device`'s `modelName`, like "iPhone 15", not the user-set device name), OS name and version, emulator flag, locale and timezone ([native-deps.tsx](https://github.com/PostHog/posthog-js/blob/main/packages/react-native/src/native-deps.tsx)). None of that is financial data.

**Touch autocapture leaks screen text.** `captureTouches` is off by default ([types.ts](https://github.com/PostHog/posthog-js/blob/main/packages/react-native/src/types.ts)). If turned on, it records each touched element's props, including `children`, and writes string children to `$el_text` ([autocapture.tsx, around line 150 and 218](https://github.com/PostHog/posthog-js/blob/main/packages/react-native/src/autocapture.tsx)). Tapping a transaction row would send its amount and description. Keep it off. `ph-no-capture` exists to exclude subtrees, but one forgotten wrapper breaks the promise, so I wouldn't rely on it.

**Screen autocapture.** `captureScreens` defaults to `true` in `PostHogProvider` and sends `$screen` events ([PostHog React Native docs](https://posthog.com/docs/libraries/react-native)). Route names are fine. I'd still turn it off and call `posthog.screen('Wallet')` by hand with fixed names, so no route param, like an account name, ever ends up in a screen name.

**Session replay.** Off unless `enableSessionReplay` is set. Its masking defaults to masking all text and images ([types.ts](https://github.com/PostHog/posthog-js/blob/main/packages/react-native/src/types.ts)), but screenshots of a finance app are exactly what the promise rules out. Don't enable it.

**Last line of defence.** The core config has `before_send`, which can edit or drop any event before it leaves the device ([core types](https://github.com/PostHog/posthog-js/blob/main/packages/core/src/types.ts)). PostHog's data-collection page calls it web-only, but the React Native SDK inherits it from core. An allowlist of event names and property keys in `before_send` turns the privacy promise into code.

**Location.** `disableGeoip` defaults to `false` ([core types](https://github.com/PostHog/posthog-js/blob/main/packages/core/src/types.ts)). Separately, each project has an "IP data capture configuration" setting that captures or discards client IPs. EU organizations default to discard ([Controlling data collection](https://posthog.com/docs/privacy/data-collection)). With GeoIP off and IPs discarded, PostHog stores no location at all. This keeps "Location" off both store labels. I didn't find a PostHog doc that says whether GeoIP still runs when the project discards IPs, so the SDK flag is the setting to rely on.

### Suggested config

```ts
export const posthog = new PostHog(POSTHOG_KEY, {
  host: 'https://us.i.posthog.com',
  defaultOptIn: false,          // nothing is sent until optIn()
  personProfiles: 'never',      // identify/alias/group become no-ops
  disableGeoip: true,
  captureAppLifecycleEvents: true,
  enableSessionReplay: false,
  before_send: allowlistOnly,   // drop unknown events and properties
})

// <PostHogProvider client={posthog} autocapture={{ captureTouches: false, captureScreens: false }}>
```

Plus, in the PostHog project settings, set IP data capture to discard.

## Cloud or self-hosted, US or EU

**Self-hosted.** PostHog offers a free Docker Compose "hobby" deployment under MIT. It is "officially unsupported", gets no customer support, and PostHog only suggests it below roughly 300k events and 1k recordings a month. PostHog calls its Cloud "far and away the best experience" ([Self-host docs](https://posthog.com/docs/self-host)). For a one-person team that would run, patch and back up the server alone, self-hosting adds work and risk without changing what leaves the phone. The privacy promise rests on what the app sends, not on who hosts the database.

**Regions.** Cloud US and Cloud EU are separate instances. You pick one at signup. AWS hosts the data in the US for US Cloud and in Germany for EU Cloud ([Subprocessors](https://posthog.com/subprocessors)). EU Cloud runs in Frankfurt, AWS eu-central-1 ([Introducing PostHog Cloud EU](https://posthog.com/blog/posthog-cloud-eu)).

Perfin sells in Mexico and the US, not the EU. PostHog's own CCPA guide recommends Cloud US ([CCPA guide](https://posthog.com/docs/privacy/ccpa-compliance)). I found no data-localization rule in the LFPDPPP text. Go with US Cloud. The only thing EU gives you is IP discard on by default, and you can set that yourself.

**Contract.** Every Cloud customer can sign PostHog's DPA, free plan included, self-serve from the legal page in the app ([Privacy docs](https://posthog.com/docs/privacy)). The DPA names CCPA plus the Colorado, Connecticut, Utah and Virginia laws, says PostHog "acknowledges that it is a Service Provider", and commits it to "not directly or indirectly sell or share any Personal Data" ([DPA](https://posthog.com/dpa)). Sign it before launch.

## Free tier

Per month, free with no card: 1M analytics events, 5K session recordings, 1M feature flag requests, 1,500 survey responses, 100K exceptions. The free plan has 1 project and 1-year data retention. "Usage stops at the free tier limits, so you can't be charged by surprise" ([Pricing](https://posthog.com/pricing)). The 1M events count anonymous and identified events alike ([Anonymous vs identified events](https://posthog.com/docs/data/anonymous-vs-identified-events)).

Rough budget: at 30 events per active user per day, 1M events covers about 1,100 daily active users who opted in. A short event list goes a long way. The free plan's single project also means dev and prod share one project unless you filter by build, or add a card to get more projects.

Surveys could cover the in-app feedback item on the map. That is a separate ticket.

## Mexico: the 2025 LFPDPPP

**The law changed.** A new Ley Federal de Protección de Datos Personales en Posesión de los Particulares was published in the DOF on 20 March 2025, in force the next day. It repealed the 2010 law. Last amended DOF 14-11-2025, which only changed Article 4 ([official text, Cámara de Diputados](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf), Transitorios Primero and Segundo).

**The regulator changed.** INAI is gone. Article 2 XV names the Secretaría Anticorrupción y Buen Gobierno as the authority, and the transitorios move INAI's files and pending cases to it ([official text](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf), Art. 2 XV and Transitorios). The law still refers to a "Reglamento". I couldn't confirm whether a new one has been published or whether the 2011 one still applies.

**Is analytics data personal data?** Personal data is "any information concerning an identified or identifiable person", and a person is identifiable if their identity "can be determined directly or indirectly through any information" (Art. 2 V). A persistent device ID plus device model and locale probably qualifies. Treat it as personal data.

**Consent.** Tacit consent is the general rule. It exists when the privacy notice was made available and the person didn't object. Financial or patrimonial data needs express consent (Art. 7). Perfin's analytics carry no amounts or account names, so tacit consent may be enough under Mexican law. Apple requires an explicit opt-in anyway (see below), and that also meets the express standard, so the question is moot in practice. Consent must be revocable, and the notice must say how (Art. 7, last paragraph).

**What the aviso de privacidad must contain** (Art. 15):

- identity and address of the responsable;
- the personal data processed, marking any sensitive data;
- the purposes, separating those that need consent;
- options to limit use or disclosure;
- how to exercise ARCO rights (access, rectification, cancellation, opposition);
- how changes to the notice will be communicated.

Data collected electronically gets a simplified notice at the point of collection with items I to IV and a link to the full notice (Art. 16 II). The consent screen is that point.

**PostHog's role.** The law calls a processor a "persona encargada" (Art. 2 XII). A "transferencia" is a communication to anyone other than the data subject, the responsable or the encargado (Art. 2 XX). The transfer rules in Articles 35 and 36 target "terceros... distintos de la persona encargada". So sending analytics to PostHog as processor is not a transfer, but the notice should still name the purpose and say a US provider processes the data. Article 20 requires confidentiality controls for everyone involved in processing, which the signed DPA covers.

**ARCO deadlines.** Respond within 20 business days of the request and carry it out within 15 days after that (Art. 31; "días" means business days per Art. 2 VIII).

**Personal-use exception does not apply.** Article 1 excludes only people who collect data "for exclusively personal use, without... commercial use". Perfin is a paid product.

**Fines** run from 100 to 320,000 times the UMA, depending on the infraction (Art. 59). Collecting data without required express consent is one of the higher-tier infractions (Art. 58 XIII).

## United States

**CCPA/CPRA probably doesn't apply yet.** It covers for-profit businesses that do business in California and meet one of three tests: over $25M gross annual revenue, buying, selling or sharing personal information of 100,000+ California residents or households, or 50%+ of revenue from selling personal information ([California AG](https://oag.ca.gov/privacy/ccpa)). The revenue threshold is CPI-adjusted to $26,625,000 from 1 January 2025 ([CPPA monetary thresholds](https://cppa.ca.gov/regulations/cpi_adjustment.html)). Perfin is far below the revenue test. Sending data to PostHog under a service-provider contract is not "selling" or "sharing", per the DPA terms above. If CCPA ever applies, the extra duties are a notice at collection that lists categories of personal information and links to the privacy policy ([California AG](https://oag.ca.gov/privacy/ccpa)), and deletion responses within 45 days ([PostHog CCPA guide](https://posthog.com/docs/privacy/ccpa-compliance)). CCPA's "sensitive personal information" covers financial account numbers combined with credentials ([California AG](https://oag.ca.gov/privacy/ccpa)). Perfin's analytics carry none.

**CalOPPA applies regardless of size.** An operator of an online service that collects personally identifiable information from California consumers must post a privacy policy. It must list the categories collected and the third parties that receive them, explain how changes are announced, and say how the service responds to Do Not Track signals ([Bus. & Prof. Code § 22575](https://california.public.law/codes/ca_bus_and_prof_code_section_22575)). Whether a random device ID counts as PII under CalOPPA is a lawyer question. Writing the policy costs little either way.

**Other state laws.** About 20 states now have comprehensive privacy laws, and most use consumer-count thresholds similar to California's ([IAPP key dates](https://iapp.org/resources/article/key-dates-from-us-comprehensive-state-privacy-laws/)). Texas is the odd one. It applies to anyone who is not a small business as defined by the SBA, and small businesses only have to get consent before selling sensitive data ([Texas HB 4, Bus. & Com. Code §§ 541.002, 541.107](https://capitol.texas.gov/tlodocs/88R/billtext/html/HB00004F.htm)). Texas's "sensitive data" list doesn't include financial data. Perfin sells no data, so it's fine there either way.

**GLBA.** Several state laws exempt GLBA financial institutions (Texas § 541.002(b)(2), same source). The FTC rule defines a financial institution by Bank Holding Company Act activities, with examples like tax preparers, credit counselors and check printers ([16 CFR 314.2](https://www.ecfr.gov/current/title-16/part-314/section-314.2)). A manual expense tracker isn't on that list. Whether it counts is a lawyer question, and it matters more for the sync service than for analytics.

## App Store privacy label

**Consent is required.** Guideline 5.1.1(ii): "Apps that collect user or usage data must secure user consent for the collection, even if such data is considered to be anonymous at the time of or immediately following collection. Paid functionality must not be dependent on or require a user to grant access to this data. Apps must also provide the customer with an easily accessible and understandable way to withdraw consent" ([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)). So: an opt-in screen, a Settings toggle that calls `optOut()`, and no unlock or sync feature gated on saying yes. Guideline 5.1.1(i) also requires a privacy policy link in App Store Connect and in the app. The policy must name third parties like analytics tools, explain retention and deletion, and say how to revoke consent (same source).

**What counts.** "Collect" means sending data off the device in a way that lets you or a partner access it longer than the real-time request needs. Third-party SDK data counts. Opt-in data is not exempt: "data collected on an ongoing basis after an initial request for permission must be disclosed" ([App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)).

**What Perfin declares**, with the config above:

| Apple data type | Why | Purpose |
|---|---|---|
| Usage Data > Product Interaction | app launches, screen views, feature events | Analytics |
| Identifiers > Device ID | PostHog's persistent random distinct ID ("other device-level ID") | Analytics |
| Diagnostics > Crash Data, if PostHog error tracking is on | `$exception` events | App Functionality / Analytics |

Not declared: Financial Info, Location (GeoIP off), User ID (no `identify()`). Tracking: no. Tracking means linking app data with third-party data for ads or sharing it with a data broker, and Perfin does neither (same source), so App Tracking Transparency isn't needed.

**Linked or not linked.** Apple says data is linked unless direct identifiers are stripped before collection and never re-linked. It adds that "'Personal Information' and 'Personal Data', as defined under relevant privacy laws, are considered linked to the user" (same source). A persistent device ID is likely personal data under the LFPDPPP's identifiability test, so declare these as Data Linked to You. "Not linked" is defensible only if a lawyer agrees the ID isn't personal data.

**Privacy manifest.** `posthog-ios` ships a `PrivacyInfo.xcprivacy`. In the `posthog-js` repo, manifests appear only in example apps, not in the React Native package itself ([posthog-ios tree](https://github.com/PostHog/posthog-ios/tree/main/PostHog/Resources), [posthog-js tree](https://github.com/PostHog/posthog-js/tree/main/examples)). Check the prebuilt Expo iOS project for required-reason API declarations before the first submission.

## Google Play Data safety

**What counts.** "Collect" means sending data off the device. Data sent by SDKs counts. Sending data to a service provider that processes it only for you isn't "sharing". Collection can be marked optional only if every user can opt out ([Data safety help](https://support.google.com/googleplay/android-developer/answer/10787469)).

**What Perfin declares:**

| Play data type | Collected | Shared | Optional | Purpose |
|---|---|---|---|---|
| App activity > App interactions | yes | no (PostHog is a service provider) | yes | Analytics |
| Device or other IDs | yes | no | yes | Analytics |
| App info and performance > Crash logs / Diagnostics, if error tracking is on | yes | no | yes | Analytics |

Not declared: Approximate location. Google says location inferred from IP must be disclosed, so this holds only with GeoIP off. Also not declared: Financial info, because the analytics carry none. Answer "encrypted in transit" yes, since PostHog ingest is HTTPS. For "users can request deletion" the form accepts yes if you offer a way to request deletion (same source).

Once sync ships, both labels need a second pass. Synced transactions are Financial Info collected for App Functionality. That belongs to the sync ticket, not this one.

## What the consent screen and privacy policy say

**Consent screen.** Shown once, before any event is sent. It is also the simplified aviso under LFPDPPP Art. 16 II. Two equal buttons, no pre-ticked box:

- who you are: Perfin, legal name and address of the responsable;
- what is sent: which screens you open and which features you use, plus device model, OS, app version, language and timezone, tied to a random ID made on this phone;
- what is never sent: amounts, descriptions, account names, or anything you type;
- why: to see which features people use and fix what breaks;
- who processes it: PostHog, in the US;
- how to say no later: Settings > Privacy > Share usage stats;
- a link to the full privacy policy.

Saying no changes nothing else in the app, which Apple 5.1.1(ii) requires.

**Privacy policy.** One document, in Spanish and English, covering:

- the Art. 15 items;
- the Apple 5.1.1(i) items: third parties, retention, deletion, how to revoke;
- the CalOPPA items: categories, third parties, change process, effective date, Do Not Track answer.

Retention is 1 year on PostHog's free plan ([Pricing](https://posthog.com/pricing)). Policy text should match whatever the PostHog project is set to.

**Deletion and ARCO with an anonymous ID.** Without `identify()`, Perfin can't find a user's events from their email. Show the analytics ID in Settings, with a "Reset analytics ID" button that calls `posthog.reset()`, and accept deletion requests that quote it. That gives a working path for ARCO cancellation, CCPA deletion and the Play form's deletion question without linking analytics to accounts.

## Open questions for a lawyer

1. Is a random persistent device ID, sent with device model, locale and timezone, "personal data" under LFPDPPP Art. 2 V? The answer decides whether the App Store label says "linked" or "not linked".
2. Do product-usage events in a finance app, like "created a transaction", count as "datos financieros o patrimoniales" needing express consent under Art. 7? We get express consent anyway, but the policy wording depends on it.
3. Has a new Reglamento for the 2025 LFPDPPP been published? If not, which parts of the 2011 Reglamento still apply, for example any rules on remission contracts with encargados?
4. Must the aviso de privacidad be in Spanish for Mexican users, and can one bilingual policy serve both markets?
5. If Perfin is run by an individual developer rather than a company, what goes in the "identity and address" field of Art. 15 I, and does a home address have to be published?
6. Does CalOPPA treat a random device ID as "personally identifiable information"?
7. Could Perfin, or its future sync service, count as a GLBA "financial institution" under 16 CFR 314.2? That would bring the FTC Safeguards Rule and change which state-law exemptions apply.
8. Does PostHog's DPA, written around GDPR and US state laws, meet the encargado obligations of the new LFPDPPP, or does Perfin need an addendum?
