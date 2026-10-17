# Competitor prices for expense trackers in MX and US

Research for [#20](https://github.com/emrosas/perfin/issues/20), part of map [#8](https://github.com/emrosas/perfin/issues/8).

All prices seen on 2026-10-17. App Store prices come from the "In-App Purchases" list on each app's US and MX product page (`apps.apple.com/us/app/id<ID>` and `apps.apple.com/mx/app/id<ID>`) and from the iTunes lookup API (`itunes.apple.com/lookup?id=<ID>&country=us|mx`) for upfront prices. Google Play figures come from the "per item" range on `play.google.com/store/apps/details?id=<pkg>&gl=US|MX`. Exchange rate on the same day was 18.47 MXN per USD ([open.er-api.com](https://open.er-api.com/v6/latest/USD)).

Caveats. The App Store page shows at most ten IAPs and often omits the billing period, so some rows say "period not shown". Apps run price tests, so one product name can show several prices. MX App Store prices include 16% IVA. US prices exclude sales tax.

## How the stores price MX against US

The App Store has 800 price points by default, plus 100 higher ones on request ([Set a price](https://developer.apple.com/help/app-store-connect/manage-app-pricing/set-a-price/)). Points start at $0.29 and step every $0.10 up to $10 and every $0.50 from $10 to $50 ([Apple Newsroom, Dec 2022](https://www.apple.com/newsroom/2022/12/apple-announces-biggest-upgrade-to-app-store-pricing-adding-700-new-price-points/)). You set a base storefront price. Apple then generates prices for the other 174 storefronts from exchange rates and taxes, using each country's common price endings. You can also set any storefront by hand, and Apple stops adjusting it ([Set a price](https://developer.apple.com/help/app-store-connect/manage-app-pricing/set-a-price/)). Apple's periodic FX and tax updates skip auto-renewable subscriptions and manually priced storefronts ([Apple Developer news](https://developer.apple.com/news/?id=74739r1y)). When Mexico added 16% VAT in 2020, Apple raised MX prices and kept proceeds on the tax-exclusive price ([9to5Mac](https://9to5mac.com/2020/09/01/app-store-prices-increase-chile-mexico-saudi-arabia-turkey/)).

The same US-to-MX pairs show up across many unrelated apps below, so these look like Apple's equalized defaults today:

| US | MX | MXN per USD |
|---|---|---|
| $0.99 | MX$19 | 19.2 |
| $1.99 | MX$39 | 19.6 |
| $2.99 | MX$69 | 23.1 |
| $3.99 | MX$79 | 19.8 |
| $4.99 | MX$99 | 19.8 |
| $5.99 | MX$129 | 21.5 |
| $9.99 | MX$199 | 19.9 |
| $11.99 | MX$249 | 20.8 |
| $14.99 | MX$299 | 19.9 |
| $19.99 | MX$399 | 20.0 |
| $29.99 | MX$599 | 20.0 |
| $49.99 | MX$999 | 20.0 |
| $59.99 | MX$1,299 | 21.7 |

The FX rate plus IVA gives 18.47 × 1.16 = 21.4 MXN per USD. So the default is a straight conversion plus tax, rounded to a MX$9 ending. It has no purchasing-power discount. A Mexican buyer pays about the same in dollars as a US buyer, and IVA puts them a bit above the US list price. After IVA comes out, the developer gets about 7% less per sale than in the US. MX$99 ex-IVA is MX$85.34, or $4.62, against $4.99.

Some developers set MX by hand:

- Cheaper in MX. Money Manager (Remove Ads) is $5.99 in the US and MX$69, 47% under the default MX$129. Spendee Premium monthly is MX$99 against a default of MX$129. Toshl Pro monthly is MX$55 against a default of MX$69. MoneyWiz Standard yearly is MX$499 against a default of MX$599.
- Dearer in MX. YNAB monthly is MX$349 against a default of MX$299. Money Manager's sync subscription is MX$479 a year for $19.99, against a default of MX$399.

On Google Play, Mexico is a tax-inclusive country. With auto-converted pricing you enter a tax-exclusive default price ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/138000?hl=en)). Play's official per-currency ranges live on the [supported locations page](https://support.google.com/googleplay/android-developer/answer/10532353?hl=en), which renders the tables client-side, so I could not read the MXN row. Observed floor: Money Lover lists an MX$5.00 item on Play MX. That matches the MX$5.00 minimum Google set in 2015 ([Android Developers Blog](https://android-developers.googleblog.com/2015/11/minimum-purchase-price-for-apps-and-in.html)). Play's top limit is $8,000 or the local equivalent for eligible developers ([Increased price limit](https://support.google.com/googleplay/android-developer/answer/16247119?hl=en)). Observed Play ranges run a bit under the App Store in MX. Cashew is $1.49 to $19.99 in the US and MX$29 to MX$385 in MX, against MX$399 on iOS. Monarch is MX$305 for its $14.99 monthly plan.

## App-by-app prices

Annual discount compares the yearly price with 12 months at the monthly price.

### One-time unlock or lifetime

| App | Model | US | MX | Source |
|---|---|---|---|---|
| Cashew, code on GitHub | Pro lifetime | $19.99 | MX$399 | [App Store id6463662930](https://apps.apple.com/us/app/id6463662930) |
| Money Lover | Premium lifetime, excludes bank sync | $19.99 | MX$399 | [App Store id486312413](https://apps.apple.com/us/app/id486312413) |
| Bluecoins | "Bluecoins +" | $15.99 | MX$349 | [App Store id1590297575](https://apps.apple.com/us/app/id1590297575) |
| Bluecoins on Android | Premium items | $4.49 to $10.99 | MX$99 to MX$245 | [Play](https://play.google.com/store/apps/details?id=com.rammigsoftware.bluecoins) |
| Daily Budget Original, on-device data, Dropbox sync | All features | $9.99 or $11.99 | MX$199 or MX$249 | [App Store id651896614](https://apps.apple.com/us/app/id651896614) |
| Daily Budget Original | Single features such as Dropbox sync, PIN, CSV | $2.99 each | MX$69 each | same |
| Today's Budget, on-device + iCloud | One-time purchase | $49.99 | MX$999 | [App Store id1593868439](https://apps.apple.com/us/app/id1593868439) |
| Money Pro | Paid upfront, plus optional subs | $9.99 | MX$199 | [App Store id918609651](https://apps.apple.com/us/app/id918609651) |
| Money Manager by Realbyte | Remove Ads app, paid upfront | $5.99 | MX$69 | [App Store id564730202](https://apps.apple.com/us/app/id564730202) |
| Gastos Diarios | License | $5.99 | MX$129 | [App Store id1414523287](https://apps.apple.com/us/app/id1414523287) |
| Fleur | Lifetime, three tested prices | $9.99 to $25.99 | MX$199 to MX$599 | [App Store id1621020173](https://apps.apple.com/us/app/id1621020173) |
| Spendee | Lifetime Premium | $44.99 or $59.99 | MX$999 | [App Store id635861140](https://apps.apple.com/us/app/id635861140) |
| Wallet by BudgetBakers | Lifetime Premium | $49.99 | MX$999 | [App Store id1032467659](https://apps.apple.com/us/app/id1032467659) |
| Pennies | Premium Lifetime | not in top-10 list | MX$1,799 | [App Store id916741290](https://apps.apple.com/mx/app/id916741290) |
| MoneyCoach | Lifetime Premium | $199.99 | not in top-10 list | [App Store id989642198](https://apps.apple.com/us/app/id989642198) |
| Buckets, desktop | One license, unlimited trial | $64 | n/a, USD only | [budgetwithbuckets.com](https://www.budgetwithbuckets.com/) |
| Actual Budget, open source | Free. Self-host sync or PikaPods from ~$2/month | $0 | $0 | [actualbudget.org](https://actualbudget.org/), [PikaPods](https://www.pikapods.com/apps) |

### Subscriptions

| App | Plan | US monthly | US yearly | US annual discount | MX monthly | MX yearly | MX annual discount | Source |
|---|---|---|---|---|---|---|---|---|
| Money Manager by Realbyte | Data Sync Service only | $2.49 | $19.99 | 33% | MX$59 | MX$479 | 32% | [App Store id560481810](https://apps.apple.com/us/app/id560481810) |
| MoneyWiz | Standard, multi-device sync only | n/a | $29.99 | n/a | n/a | MX$499 | n/a | [App Store id1511185140](https://apps.apple.com/us/app/id1511185140) |
| MoneyWiz | Premium, bank sync + device sync | $5.99 | $59.99 | 17% | MX$129 | MX$1,299 | 16% | same |
| MOZE, sells themes and icons | Premium | $1.99 | $19.99 | 16% | MX$39 | MX$399 | 15% | [App Store id1460011387](https://apps.apple.com/us/app/id1460011387) |
| Cashew | Pro | $1.49 | $11.99 | 33% | MX$29 | MX$249 | 28% | [App Store id6463662930](https://apps.apple.com/us/app/id6463662930) |
| Toshl | Pro | $2.99 | $19.99 | 44% | MX$55 | MX$379 | 43% | [App Store id921590251](https://apps.apple.com/us/app/id921590251) |
| Toshl | Medici, bank sync | $4.99 | $39.99 | 33% | MX$95 | MX$749 | 34% | same |
| Today's Budget | Premium | $3.99 | $24.99 | 48% | MX$79 | MX$399 | 58% | [App Store id1593868439](https://apps.apple.com/us/app/id1593868439) |
| Spendee | Premium | $5.99 | $35.99 | 50% | MX$99 or MX$129 | MX$599 or MX$799 | about 50% | [spendee.com/pricing](https://www.spendee.com/pricing), [App Store](https://apps.apple.com/mx/app/id635861140) |
| Spendee | Plus | $1.99 | $14.99 | 37% | not shown | not shown | | [spendee.com/pricing](https://www.spendee.com/pricing) |
| Wallet by BudgetBakers | Premium, period not shown | $5.99 / $14.99 / $29.99 | | | MX$129 / MX$299 / MX$599 | | | [App Store id1032467659](https://apps.apple.com/us/app/id1032467659) |
| Pennies | Monthly and annual, tested prices | $1.99 to $3.99 | $19.99 to $49.99 | | MX$39 to MX$89 | MX$399 to MX$899 | | [App Store id916741290](https://apps.apple.com/us/app/id916741290) |
| Goodbudget | Plus, tested prices | $5.99 to $7.99 | $49.99 to $69.99 | about 30% | MX$115 to MX$189 | MX$969 to MX$1,699 | | [App Store id471112395](https://apps.apple.com/us/app/id471112395) |
| YNAB | Subscription, 34-day trial | $14.99 | $109 | 39% | MX$349 | MX$2,299 | 45% | [ynab.com/pricing](https://www.ynab.com/pricing), [App Store](https://apps.apple.com/mx/app/id1010865877) |
| Monarch | Subscription | $14.99 | $99.99 | 44% | not on MX App Store. Play MX from MX$305 | | | [App Store id1459319842](https://apps.apple.com/us/app/id1459319842) |
| Copilot | Subscription | $13 | $95 | 39% | not on MX App Store | | | [App Store id1447330651](https://apps.apple.com/us/app/id1447330651) |
| Lunch Money | Annual | n/a | $150 | n/a | n/a | MX$2,999 | n/a | [App Store id6739028463](https://apps.apple.com/us/app/id6739028463) |

YNAB says it is "priced in US dollars. Exchange rates are not reflected in the price" for web sign-ups ([ynab.com/pricing](https://www.ynab.com/pricing)).

### Cosmetics

| App | Item | US | MX | Source |
|---|---|---|---|---|
| MOZE | Watercolor Theme Vol. 1 | not in top-10 list | MX$99 | [App Store id1460011387](https://apps.apple.com/mx/app/id1460011387) |
| MOZE | Account icon sets, one by one | some free, paid ones not in top-10 list | MX$19 each, some free | same |
| Money Lover | Icon packs such as Xmas, Party, Brasil 2014 | $1.99 | MX$39 | [App Store id486312413](https://apps.apple.com/us/app/id486312413) |
| Money Lover | Summer icon / Icon Life Style | $4.99 | MX$99 / MX$89 | same |
| Gastos Diarios | Category icon packs, sold one by one | $0.99 each | MX$19 each | [App Store id1414523287](https://apps.apple.com/us/app/id1414523287) |
| Daily Budget Original | More category icons | $2.99 | MX$69 | [App Store id651896614](https://apps.apple.com/us/app/id651896614) |
| Bluecoins | Tip jar: coffee, lunch, pizza | $4.99 / $6.99 / $9.99 | MX$99 / MX$149 / MX$199 | [App Store id1590297575](https://apps.apple.com/us/app/id1590297575) |
| Pennies | Tip jar | $1.99 / $4.99 / $9.99 | MX$39 / MX$99 / MX$199 | [App Store id916741290](https://apps.apple.com/us/app/id916741290) |

None of the apps I checked sells alternate app icons as a separate IAP. Cashew and MOZE list themes and icons as part of the app or Pro. Paid cosmetics in this category are icon packs and themes in the $0.99 to $4.99 range.

### Mexican apps

Fintonic, Copilot and Monarch are not in the MX App Store (iTunes lookup with `country=mx` returns zero results). The top MX results for "control de gastos" and "finanzas personales" are global apps priced at Apple's defaults. Zenfi, a Mexican finance app, is free and sells credit-bureau reports for MX$39 to MX$49 plus "SAT Plus" and "Buró Plus" subs at MX$69 to MX$89 a month and MX$390 to MX$890 a year ([App Store id1525003695](https://apps.apple.com/mx/app/id1525003695)). Gastos Diarios, which shows up for Spanish searches, uses Perfin's shape: a MX$129 license plus MX$19 icon packs.

## What this means for Perfin

Costs, from #8: 15% store fee, Apple withholds 2.5% ISR on MX sales, RevenueCat 1% above $2.5k/month, sync server $0.002 to $0.025 per user per month.

1. **Unlock.** Local-first lifetime unlocks sit at $9.99 to $19.99. Examples are Cashew $19.99, Money Lover $19.99, Bluecoins $15.99, Daily Budget $9.99 to $11.99 and Money Pro $9.99. Above $40 you are in Today's Budget, Spendee and Wallet land, and those bundle more. $9.99 to $14.99 US with MX$199 to MX$299 fits. Net on $9.99 US is about $8.49. Net on MX$199 is MX$171.55 ex-IVA, or $9.29, then $7.90 after 15%, then about $7.67 after ISR.
2. **Sync.** Sync-only subs are cheap. Money Manager charges $2.49/$19.99, MoneyWiz Standard $29.99/yr, MOZE $1.99/$19.99, Cashew Pro $1.49/$11.99. $1.99 monthly and $14.99 to $19.99 yearly is in line. At the top server cost of $0.30 per user per year, margin stays above 97% at any of these prices. Bank-sync apps charge $5 to $15 a month, and Perfin should not price against them.
3. **Annual discount.** Range is 16% to 50%. Sync-only products cluster at 16% to 33%. Bigger apps sit near 40%. Pricing yearly at 8 to 10 months of monthly, about 17% to 33% off, matches the sync-only group.
4. **Mexico.** Apple's default MX price is FX plus IVA, with no local discount. A few apps cut MX prices by 20% to 50% by hand. For the Unlock and Sync, set MX by hand to a local round tier such as MX$149, MX$199, MX$29 or MX$39. Hand-set storefronts don't follow FX changes, so review them now and then. Subscriptions never get auto-adjusted anyway.
5. **Cosmetics.** Single themes and icon packs go for $0.99 to $1.99, or MX$19 to MX$39. Themes top out near $4.99 / MX$99 (MOZE). A theme at $0.99 to $1.99 and an App Icons pack at $1.99 to $2.99 sit in the observed band. Nobody in this set sells app icons alone, so the pack has no direct comparable.
