# Selling Perfin in Mexico and the US: merchant of record, IVA/CFDI, US sales tax

Research for [#12](https://github.com/emrosas/perfin/issues/12), part of the map [#8](https://github.com/emrosas/perfin/issues/8). Researched 2026-10-17.

> This is not legal or tax advice. It is a reading of primary sources by a non-accountant so the developer can ask a contador better questions. Mexican rules for platforms changed on 2026-01-01 and SAT keeps adjusting them through the Resolución Miscelánea Fiscal (RMF). Confirm everything below with a contador before registering or pricing.

## Short answer

Sell through the App Store and Google Play (via RevenueCat) first, and use a merchant of record (MoR) such as Paddle for any web checkout. Don't sell through plain Stripe.

- **App Store.** Apple acts as your agent and handles the customer side. It collects and remits Mexican IVA and US sales tax. If you live in Mexico, Apple also withholds Mexican ISR on your payouts and part of the IVA, issues the tax statements, and charges IVA on its commission. You need an RFC (and a CURP and Constancia de Situación Fiscal) uploaded to App Store Connect. Without it, Apple applies the highest withholding rates. [Apple ASC][asc-mx], [Apple Schedule 2/3 exhibits][apple-exh]
- **Google Play.** Google collects US sales tax, but it says Mexico-based developers must charge and remit Mexican IVA on sales to Mexican customers themselves. Google lists no Mexican withholding. [Google VAT][gp-vat], [Google WHT][gp-wht]
- **Web with Stripe alone.** You become the seller of record in every country. That means Mexican IVA and a CFDI for every Mexican sale, US state sales tax registration once you pass a state's economic-nexus threshold, and everything else. Stripe Tax calculates the tax but does not register, file, or issue CFDIs. Stripe's own MoR product (Managed Payments) does not accept Mexican businesses. [Stripe MP eligibility][stripe-mp-elig], [Stripe Tax countries][stripe-tax-countries]
- **Web with Paddle.** Paddle resells the product, so it charges and remits customer-side tax (16% IVA in Mexico, US sales tax). It accepts sellers in Mexico, charges 5% + 50¢, and RevenueCat Web supports it directly. Your remaining paperwork is your own income tax and the invoices for your sales to Paddle. [Paddle countries][paddle-countries], [Paddle pricing][paddle-pricing], [RevenueCat Paddle][rc-paddle]
- **US obligations for a Mexican individual.** File a W-8BEN with Apple, Google and Paddle. You owe no US federal tax on business profits unless you have a US permanent establishment (US-Mexico treaty, Article 7). If the income counts as royalties, the treaty caps US withholding at 10% (Article 12). Your RFC can serve as the foreign TIN. You need no US company. [IRS W-8BEN instructions][irs-w8ben], [US-Mexico treaty][treaty]

## 2026 changes to know about

The *Ley de Ingresos de la Federación 2026* (DOF 2025-11-07, in force since 2026-01-01) changed the platform regime in Article 25 [LIF 2026][lif2026]:

- **Fraction VI.** Platforms now withhold ISR at **2.5%**, not 1%, from individuals who sell goods or services through them (this replaces the rate in LISR art. 113-A fr. III). The same 2.5% now applies to companies (personas morales), or 20% if they don't give the platform their RFC.
- **Fraction IX(a).** Intermediation platforms must now also withhold IVA from companies, not only from individuals.
- **Fraction IX(c).** The platform must withhold 100% of the IVA if the seller has the money deposited into a bank account outside Mexico. If you take Apple or Paddle payouts into a USD account abroad (Wise US, a US bank), ask your contador about this first.

The consolidated LISR and LIVA on diputados.gob.mx still show the pre-2026 rates (LISR last reform 2024-04-01, LIVA 2021-11-12) because the 2026 change sits in the LIF, not in those laws. [LISR][lisr], [LIVA][liva]

## 1. Selling through the app stores

### Apple App Store

**Who sells to the customer.** You appoint Apple as your agent. Apple Inc. sells to US customers and Apple Services LATAM LLC sells to Mexican customers. [Apple exhibits, Appendix A][apple-exh] Both the US and Mexico are on Apple's list of regions where Apple collects and remits the customer-side tax (Appendix B). [Apple exhibits, Appendix B][apple-exh]

**US sales tax.** Apple collects and remits it. You do nothing. [Apple exhibits, Appendix B][apple-exh]

**Mexican IVA on sales to Mexican customers.** The Mexico entry in Appendix B carries a footnote. Apple collects and remits all the IVA for developers who are not registered for IVA in Mexico. For individuals registered in Mexico, Apple remits "the amount of IVA applicable to local individuals" to SAT and pays the rest to you, and you must remit that to SAT. [Apple exhibits, Appendix B note ****][apple-exh] That split mirrors LIVA art. 18-J fr. II(a), under which an intermediation platform withholds 50% of the IVA it collects for an individual, or 100% if the individual gives no RFC. [LIVA art. 18-J][liva] App Store Connect states it in plain English: "Apple will collect and remit the VAT to you if you're tax-registered individuals based in Mexico", and "you'll then need to remit the VAT in the appropriate manner." [ASC Mexico][asc-mx]

**Mexican ISR withholding.** Section 9 (Mexico) of Appendix C says that if you reside in Mexico, Apple withholds the individual income-tax rate "on remittances for sales ... to end users inside or outside Mexico" and pays it to SAT. Apple also charges IVA on its commission and issues an invoice for it. If you give no proof of an RFC, Apple applies "the highest income-tax rate." [Apple exhibits, Appendix C §9][apple-exh] App Store Connect confirms the withholding is "on your total monthly worldwide sales before VAT," and that a VAT invoice on Apple's commission and a withholding statement are issued monthly. [ASC Mexico][asc-mx] For 2026 that rate is 2.5% with an RFC [LIF 2026 art. 25 fr. VI][lif2026] and 20% without one [LISR art. 113-C fr. IV][lisr].

**What you upload.** An individual uploads their RFC, CURP and *Cédula de Identificación Fiscal* (the Constancia de Situación Fiscal) in App Store Connect. [ASC Mexico][asc-mx]

**Contract date.** The Spanish Schedule 2/3 exhibits fetched for this note are dated 2026-08-27. [Apple exhibits][apple-exh]

### Google Play

**Who sells.** Under the Developer Distribution Agreement (effective 2025-09-15), you appoint Google as your agent or marketplace service provider. Google is the merchant of record only in the countries it lists, and you are the merchant of record everywhere else (sections 3.1 and 3.4). You are responsible for transaction taxes unless Google collects them (3.5). Google withholds taxes where the law requires (3.6). [Google Play DDA][gp-dda]

**US sales tax.** Google determines, charges and remits sales tax for Play billing purchases in the states it lists. [Google VAT and tax rates][gp-vat]

**Mexican IVA.** Google's help page says: "If you're located in Mexico, you're responsible for determining, charging, and remitting VAT" on Play purchases by Mexican customers. Google only collects the 16% itself for developers outside Mexico (since 2021-04-01). Google also charges 16% IVA on its service fee to Mexican developers (since 2020-08-01). [Google VAT and tax rates][gp-vat]

**Withholding.** Google's withholding-tax page lists Brazil, Egypt, India, Kenya, Kuwait, Myanmar, Sri Lanka, Taiwan, Tanzania and Vietnam. Mexico is not on the list. [Google WHT][gp-wht] Google's own pages don't reconcile this with the LIVA 18-J and LIF 2026 platform-withholding rules. Ask the contador (see the questions below).

**In practice.** On Android the developer files Mexican IVA on Mexican sales, while on iOS Apple handles most of it. Expect more monthly bookkeeping for Play revenue.

### US storefront: links to a web checkout

Since 2025-05-01, US storefront apps may include buttons and external links to a web purchase without the StoreKit External Purchase Link Entitlement. [Apple developer news][apple-us-links] A sale completed on the web is not an App Store sale, so the web seller (you, or your MoR) owes the tax on it.

## 2. Selling directly on web or desktop

### Plain Stripe: you are the merchant of record

- **Mexican customers.** You charge 16% IVA and issue a CFDI. If the buyer doesn't ask for an invoice, you can cover those sales with a *factura global* to RFC `XAXX010101000` ("PUBLICO EN GENERAL"). [SAT CFDI global guide][sat-global] RESICO taxpayers must issue CFDIs for all income and use the global CFDI for sales to the general public. [LISR art. 113-G fr. III, V][lisr]
- **Foreign customers.** Invoices to foreign residents without an RFC use the generic RFC `XEXX010101000` and tax regime 616. [SAT CFDI global guide][sat-global] Licensing an intangible for use abroad, or selling one to a foreign resident, counts as an export and is taxed at 0% IVA. [LIVA art. 29 fr. II, III][liva] Whether a sync subscription counts as an intangible license or as a service is a contador question. The IT-services export rule (fr. IV(i)) requires all infrastructure to be in Mexico, which a cloud sync backend won't meet. [LIVA art. 29 fr. IV(i)][liva]
- **US customers.** Since *South Dakota v. Wayfair* (2018), a state can make a remote seller collect its sales tax without any physical presence. [Wayfair][wayfair] Stripe states that US sales tax may apply "regardless of where the business is located," that each state sets its own economic-nexus threshold, and that you register with each state separately. [Stripe Tax US][stripe-tax-us]
- **Stripe Tax.** It accepts Mexico as a business location (since 2025-09-02). It calculates tax and monitors thresholds, but it does not issue CFDIs. Registration and filing are on you or a paid add-on. [Stripe Tax countries][stripe-tax-countries], [Stripe Tax US][stripe-tax-us]
- **Stripe Managed Payments** is Stripe's MoR product. Its supported business locations are CA, US, much of Europe, AU, HK, JP and SG. Mexico is not on the list. [Stripe MP eligibility][stripe-mp-elig]

A solo developer would carry a lot of overhead for little revenue on this route.

### Paddle (merchant of record)

- Paddle is the seller of record and resells your product, so it is responsible for collecting and paying the VAT or sales tax. [Paddle VAT][paddle-vat] It lists Mexico at 16% for digital goods. [Paddle tax countries][paddle-tax-countries]
- It works with software businesses anywhere except a short list of unsupported countries, and Mexico is not on that list. [Paddle countries][paddle-countries]
- Its fee is 5% + 50¢ per checkout transaction, with tax compliance included. [Paddle pricing][paddle-pricing]
- RevenueCat Web supports Paddle Billing, with Paddle as the merchant of record, covering Web Purchase Links, Web Paywalls and app-to-web purchases. It supports one product per purchase. [RevenueCat Paddle][rc-paddle]
- Your side: you sell to Paddle, a foreign company. You still declare that income in Mexico (residents pay ISR on worldwide income [LISR art. 1][lisr]) and likely issue CFDIs to Paddle using `XEXX010101000`. Whether that sale is a 0% IVA export when the end customer is in Mexico is a contador question.

### Lemon Squeezy

- Lemon Squeezy pays out to bank accounts in Mexico. [LS supported countries][ls-countries] Its fee is also 5% + 50¢. [LS pricing][ls-pricing]
- Stripe owns it. The 2026-01-28 update says the goal is "an easy way to migrate to Stripe Managed Payments," which "supports merchants in 35+ countries" with more promised "later this year." It sends businesses outside those countries to Stripe Atlas to form a US company. [LS 2026 update][ls-2026] Mexico is not yet a Managed Payments country, so a Mexican seller who picks Lemon Squeezy today risks a forced move later. Paddle is the safer choice.

## 3. SAT obligations for a solo developer (persona física)

**Registration.** You need an RFC registered for the right activity, an e.firma, and an active buzón tributario. [LISR art. 113-G fr. I, II][lisr] App Store Connect also asks for the CURP and the Constancia. [ASC Mexico][asc-mx]

**Regimes that apply.**

| Regime | Who / limit | ISR | Source |
| --- | --- | --- | --- |
| Plataformas tecnológicas (LISR Title IV, Ch. II, Sec. III) | Income received through a platform such as Apple | Platform withholds 2.5% (2026). Withholding is a provisional payment, or a final one if you opt in and earned ≤ MXN 300,000 the year before | [LISR 113-A, 113-B][lisr], [LIF 2026 art. 25 VI][lif2026] |
| RESICO (LISR 113-E) | Business or professional income ≤ MXN 3.5M a year. Not available to shareholders of a company or related parties | 1% to 2.5% of CFDI-backed income collected, no deductions | [LISR 113-E, 113-F][lisr] |
| Actividad empresarial y profesional | No limit | Normal rates on profit (deductions allowed) | [SAT regimes page][sat-regimes] |

- **The 300k final-payment option.** You can make the platform's withholding final if your platform income, plus wages and interest, was at most MXN 300,000 the year before. You file a notice within 30 days of the first payment. The choice locks for 5 years and gives up deductions. [LISR 113-B][lisr], [SAT regimes page][sat-regimes] LIVA 18-L and 18-M give a matching IVA option: the 50% withheld becomes final, and any amount you collected directly is taxed at 8%. [LIVA 18-L, 18-M][liva]
- **Mixing store income with direct sales.** If you also sell directly (Stripe, Paddle payouts), the 113-A last paragraph and 113-B conditions decide whether you can still treat withholding as final. Whether RESICO can cover both kinds of income is not settled by the primary text I found. Secondary sources disagree, so ask the contador.

**IVA.** You file a monthly IVA return covering what Apple handed over (the half it didn't withhold), the IVA on Google Play Mexican sales, and the IVA on any direct Mexican sales. You credit the IVA Apple and Google charge on their commissions. [ASC Mexico][asc-mx], [Google VAT][gp-vat]

**Who issues which CFDI.**

- Apple issues a monthly invoice for its commission plus a withholding statement. [ASC Mexico][asc-mx] Under LIVA 18-J fr. II(c) and LISR 113-C fr. II, platforms must issue a *CFDI de Retenciones e información de pagos* within five days after the month ends. [LIVA][liva], [LISR][lisr]
- If you sell directly as the seller of record, you issue CFDIs to your customers: a global CFDI for general-public sales and `XEXX010101000` invoices for foreign buyers. [SAT CFDI global guide][sat-global]
- If you sell through Paddle, Paddle invoices the customers. Whether your CFDI goes to Paddle, and how, needs the contador.

**Real-time SAT access.** The 2026 CFF reform (DOF 2025-11-07) added obligations for digital platforms to give SAT access to transaction data. It applies to the platforms, not to you. [CFF reform DOF 2025-11-07][cff-ref]

## 4. US obligations for a foreign seller

- **Income-tax forms.** Every developer completes a US tax form for the Paid Apps Agreement. Non-US developers are routed to the W-8BEN, W-8BEN-E or W-8ECI. [Apple US tax info][asc-us] Google says it may lower withholding if you provide a W-8. [Google Play DDA 3.6][gp-dda] An individual uses the W-8BEN. A foreign TIN (your RFC) on line 6a can support a treaty claim in place of a US TIN. Claiming "business profits not attributable to a permanent establishment" requires line 10. Without the form, the payer may withhold 30%. The form is valid through the end of the third calendar year after signing. [IRS W-8BEN instructions][irs-w8ben]
- **Treaty.** Business profits of a Mexican enterprise are taxable only in Mexico unless it has a US permanent establishment (Art. 7). US tax on royalties paid to a Mexican resident is capped at 10% of the gross (Art. 12). [US-Mexico treaty][treaty] Which article fits app proceeds depends on how the payer characterizes them. In practice the App Store Connect questionnaire decides that.
- **Sales tax.** On App Store and Play sales, Apple and Google handle it. [Apple exhibits][apple-exh], [Google VAT][gp-vat] Every US state with a sales tax also has a marketplace-facilitator law. [Stripe Tax US][stripe-tax-us] On web sales, an MoR handles it. On plain Stripe sales, you handle it state by state.
- **Entity.** Nothing in these sources requires a US LLC for the store or Paddle routes. Lemon Squeezy and Stripe only suggest a US company (via Atlas) to reach Stripe Managed Payments. [LS 2026 update][ls-2026]

## Fit with the map (#8)

- The purchase model in #8 (one-time unlock plus sync subscription and Customizations via RevenueCat) maps onto store in-app purchases, where Apple and Google act as agent or MoR. That covers US sales tax entirely and most Mexican IVA on iOS.
- For the web companion, add a web checkout only through an MoR. Paddle is the one that accepts Mexican sellers and plugs into RevenueCat. Plain Stripe is not worth it for a solo developer.
- On the Mexican side, register as a persona física. The contador picks the regime. Plan for 2.5% ISR withheld by Apple in 2026, monthly IVA returns (heavier if Android sells to Mexican users), and the annual return.

## Questions for a contador

1. Which regime should I register in: plataformas tecnológicas only, RESICO, or actividad empresarial? Can I combine them if I have App Store, Google Play and Paddle income? Does any company shareholding I hold rule out RESICO?
2. Can I take the 300k final-payment option (ISR 113-B, IVA 18-M) when part of the income comes through Paddle or Google, which do not withhold?
3. Google Play doesn't withhold for Mexico. How do I declare Play income and the IVA on Play's Mexican sales, and is Google obligated to withhold under LIVA 18-J or LIF 2026 art. 25?
4. For sales to Paddle, a foreign reseller, do I invoice Paddle with `XEXX010101000`, and is it a 0% export (LIVA 29 fr. II/III) even when the end customer is in Mexico?
5. Is a cloud-sync subscription an intangible license (0% when used abroad) or a service, for IVA?
6. If Apple or Paddle pays into a non-Mexican account, does the 100% IVA withholding in LIF 2026 art. 25 fr. IX(c) apply to me?
7. What do I need from Apple's monthly documents (commission invoice, withholding statement) to credit the IVA and ISR, and are they valid CFDIs?
8. On the W-8BEN, should I claim treaty Article 7 or Article 12, and do I need a US TIN at all?
9. Do I need to issue a CFDI global for App Store sales to Mexican customers, given that Apple acts as my agent?

## Sources

- [Apple, Anexos 2 y 3 (Spanish, Mexico), dated 2026-08-27](https://developer.apple.com/support/downloads/terms/exhibits/Exhibits-to-Schedule-2-and-3-Spanish-Mexico.pdf)
- [App Store Connect Help: Provide Mexico tax information](https://developer.apple.com/help/app-store-connect/provide-tax-information/provide-mexico-tax-information)
- [App Store Connect Help: Provide US tax information](https://developer.apple.com/help/app-store-connect/provide-tax-information/provide-us-tax-information)
- [Apple Developer News: Updated guidelines now available (2025-05-01)](https://developer.apple.com/news/?id=9txfddzf)
- [Play Console Help: Tax rates and value-added tax](https://support.google.com/googleplay/android-developer/answer/138000?hl=en)
- [Play Console Help: Withholding tax](https://support.google.com/googleplay/android-developer/answer/9384608?hl=en)
- [Google Play Developer Distribution Agreement (effective 2025-09-15)](https://play.google/developer-distribution-agreement.html)
- [Ley de Ingresos de la Federación 2026, DOF 2025-11-07, art. 25](https://www.diputados.gob.mx/LeyesBiblio/pdf/LIF_2026.pdf)
- [Ley del Impuesto sobre la Renta (consolidated, last reform DOF 2024-04-01)](https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf)
- [Ley del Impuesto al Valor Agregado (consolidated, last reform DOF 2021-11-12)](https://www.diputados.gob.mx/LeyesBiblio/pdf/LIVA.pdf)
- [Código Fiscal de la Federación, reform DOF 2025-11-07](https://www.diputados.gob.mx/LeyesBiblio/ref/cff/CFF_ref62_07nov25.pdf)
- [SAT, Guía de llenado del CFDI global v4.0](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/GuiallenadoCFDIglobal311221.pdf)
- [SAT, Emprendedor, conoce los regímenes fiscales de las personas físicas](https://wwwmat.sat.gob.mx/consulta/09788/emprendedor,-conoce-los-regimenes-fiscales-de-las-personas-fisicas)
- [Stripe Docs: Managed Payments eligibility](https://docs.stripe.com/payments/managed-payments/eligibility)
- [Stripe Docs: Countries supported by Stripe Tax](https://docs.stripe.com/tax/supported-countries)
- [Stripe Docs: Collect tax in the United States](https://docs.stripe.com/tax/supported-countries/united-states)
- [Paddle Help: Which countries are supported](https://www.paddle.com/help/start/intro-to-paddle/which-countries-are-supported-by-paddle)
- [Paddle Help: How Paddle takes on your VAT and tax responsibilities](https://www.paddle.com/help/start/intro-to-paddle/how-paddle-is-able-to-take-on-your-vat-and-tax-responsibilities)
- [Paddle Help: Which countries does Paddle charge sales tax or VAT for](https://www.paddle.com/help/sell/tax/which-countries-does-paddle-charge-sales-tax-or-vat-for)
- [Paddle pricing](https://www.paddle.com/pricing)
- [RevenueCat Docs: Paddle Billing](https://www.revenuecat.com/docs/web/integrations/paddle)
- [Lemon Squeezy Docs: Supported countries](https://docs.lemonsqueezy.com/help/getting-started/supported-countries)
- [Lemon Squeezy pricing](https://www.lemonsqueezy.com/pricing)
- [Lemon Squeezy: 2026 Update, Lemon Squeezy + Stripe Managed Payments (2026-01-28)](https://www.lemonsqueezy.com/blog/2026-update)
- [IRS: Instructions for Form W-8BEN](https://www.irs.gov/instructions/iw8ben)
- [IRS: United States-Mexico Income Tax Convention (1992)](https://www.irs.gov/pub/irs-trty/mexico.pdf)
- [South Dakota v. Wayfair, Inc., 585 U.S. 162 (2018)](https://www.supremecourt.gov/opinions/17pdf/17-494_j4el.pdf)

[apple-exh]: https://developer.apple.com/support/downloads/terms/exhibits/Exhibits-to-Schedule-2-and-3-Spanish-Mexico.pdf
[asc-mx]: https://developer.apple.com/help/app-store-connect/provide-tax-information/provide-mexico-tax-information
[asc-us]: https://developer.apple.com/help/app-store-connect/provide-tax-information/provide-us-tax-information
[apple-us-links]: https://developer.apple.com/news/?id=9txfddzf
[gp-vat]: https://support.google.com/googleplay/android-developer/answer/138000?hl=en
[gp-wht]: https://support.google.com/googleplay/android-developer/answer/9384608?hl=en
[gp-dda]: https://play.google/developer-distribution-agreement.html
[lif2026]: https://www.diputados.gob.mx/LeyesBiblio/pdf/LIF_2026.pdf
[lisr]: https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf
[liva]: https://www.diputados.gob.mx/LeyesBiblio/pdf/LIVA.pdf
[cff-ref]: https://www.diputados.gob.mx/LeyesBiblio/ref/cff/CFF_ref62_07nov25.pdf
[sat-global]: http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/GuiallenadoCFDIglobal311221.pdf
[sat-regimes]: https://wwwmat.sat.gob.mx/consulta/09788/emprendedor,-conoce-los-regimenes-fiscales-de-las-personas-fisicas
[stripe-mp-elig]: https://docs.stripe.com/payments/managed-payments/eligibility
[stripe-tax-countries]: https://docs.stripe.com/tax/supported-countries
[stripe-tax-us]: https://docs.stripe.com/tax/supported-countries/united-states
[paddle-countries]: https://www.paddle.com/help/start/intro-to-paddle/which-countries-are-supported-by-paddle
[paddle-vat]: https://www.paddle.com/help/start/intro-to-paddle/how-paddle-is-able-to-take-on-your-vat-and-tax-responsibilities
[paddle-tax-countries]: https://www.paddle.com/help/sell/tax/which-countries-does-paddle-charge-sales-tax-or-vat-for
[paddle-pricing]: https://www.paddle.com/pricing
[rc-paddle]: https://www.revenuecat.com/docs/web/integrations/paddle
[ls-countries]: https://docs.lemonsqueezy.com/help/getting-started/supported-countries
[ls-pricing]: https://www.lemonsqueezy.com/pricing
[ls-2026]: https://www.lemonsqueezy.com/blog/2026-update
[irs-w8ben]: https://www.irs.gov/instructions/iw8ben
[treaty]: https://www.irs.gov/pub/irs-trty/mexico.pdf
[wayfair]: https://www.supremecourt.gov/opinions/17pdf/17-494_j4el.pdf
