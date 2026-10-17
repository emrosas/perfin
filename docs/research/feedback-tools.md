# In-app feedback and feature-request tools

Research for [#14](https://github.com/emrosas/perfin/issues/14), part of the map [#8](https://github.com/emrosas/perfin/issues/8). Checked 2026-10-17 against vendor docs and pricing pages. Numbers in brackets point to the source list at the end.

## Question

Which in-app feedback and feature-request tool fits a solo developer selling a local-first Expo app? Candidates: Featurebase, Canny, PostHog Surveys, Sentry User Feedback, and a plain form that opens GitHub issues. Criteria: Expo/React Native embedding, public roadmap and voting, use without an account, cost, privacy, and whether requests can land in GitHub Issues.

The privacy promise in #8 sets the bar. Financial data never leaves the device unless the user turns on sync, and local use needs no account. A feedback tool must not require sign-in and must not ship anything the user didn't type.

## Comparison

| | Featurebase | Canny | PostHog Surveys | Sentry User Feedback | Plain form to GitHub Issues |
|---|---|---|---|---|---|
| Expo / React Native | No native SDK. Docs say to load the portal in a WebView, with custom code [1][2]. A React Native SDK request sits on their board with no reply [3]. | No SDK. The web widget "can run inside a mobile app" [9]. In practice that means a WebView. | Native. `PostHogSurveyProvider` renders popover surveys, Expo install documented [11]. The "feedback button" survey type is listed for web only [12]. | Native. `Sentry.showFeedbackForm()`, a `FeedbackForm` component, shake-to-report, offline queue [16]. | Native screen you build. Plain `TextInput` plus a `fetch`. |
| Public roadmap and voting | Yes. Feedback board with upvotes [4], plus Roadmap and Updates pages you can load in the WebView [2]. | Yes. Feedback portal and widget on all plans, Free included [9]. | No. Surveys only. | No. Private inbox only [18]. | Not in-app. GitHub Discussions has upvotes and a "Top" sort [27], but voting needs a GitHub account. |
| Works without an account | Yes. Guest submissions, guest voting and guest commenting are separate toggles [4]. Guests get no email updates [4]. | Unclear. Users "will still be able to log in via the widget" without SSO [9]. I found no Canny doc for voting with no account. | Yes. Anonymous events work, but anonymous users can't be targeted by person properties [15]. | Yes. Name and email fields show by default but neither is required [17]. | Yes, if the form posts to your own endpoint. The prefilled `issues/new?title=&body=` URL [26] needs a GitHub login, so it fails this test. |
| Cost | Free plan: 1 seat [6]. Growth is $29/seat/month billed yearly and is the first plan that lists "Integrations" [6]. | Free: 25 tracked users [8]. Pro: $79/month billed yearly, 100+ tracked users, adds "PM integrations" [8]. Anyone who posts, votes or comments counts as a tracked user [8]. | 1,500 responses/month free, then from $0.10 per response [13]. | Developer plan free, 1 user, User Feedback included [19]. Team $29/month ($26 yearly) [19]. | $0. Cloudflare Workers free tier covers 100,000 requests/day [28]. GitHub API is free. |
| Privacy | Third-party web page in a WebView. Data hosted mainly in the EU/EEA, GDPR DPA, SOC 2 Type II [7]. | Third-party web page in a WebView. | Same SDK as analytics (#13). Responses are events tied to a distinct ID. | SDK sends JS console logs as breadcrumbs and full outgoing request URLs by default [21]. The server infers IP [21]. Replay, if on, masks all text and images by default [22]. | Only what the user types plus fields you choose to add. Nothing else leaves the device. |
| Feeds GitHub Issues | Yes. Auto-push new posts or push one at a time; GitHub status changes update the post and email voters [5]. Plan not stated; Growth is the likely floor [6]. | Yes. Push posts as issues; closing an issue changes the post status [10]. Needs Pro ("PM integrations") [8]. | No GitHub destination. HTTP Webhook, Slack, Discord, Teams only [14]. You'd write the webhook-to-GitHub glue. | Manual "create/link GitHub issue" needs Team [20]. Auto-create from an alert needs Business ($89/month) [19][20]. | Yes, directly. `POST /repos/{owner}/{repo}/issues` with a fine-grained token that has Issues: write [23][24]. |

## Notes per tool

**Featurebase.** The best fit if Perfin ever wants a public board. Guest voting and posting cover the no-account rule [4], and GitHub sync goes both ways in the way that matters: push a post to GitHub, and closing the issue updates the post and notifies voters [5]. The weak spot is mobile. It's a WebView with custom code [2], and the pricing page lists support features on the Free card without confirming feedback boards or the GitHub integration on that plan [6]. Expect to pay $29/month once GitHub sync matters.

**Canny.** Same WebView story as Featurebase, a smaller free tier, and a steeper paid tier. Every voter counts as a tracked user [8], so 25 people voting on a public board exhausts Free. GitHub sync needs Pro at $79/month [8]. I could not find a Canny doc that confirms voting without an account. Nothing here beats Featurebase.

**PostHog Surveys.** Good for short targeted prompts ("How was setting up recurring payments?"), not for feature requests. No board, no voting, and the free-form feedback button survey type isn't listed for React Native [12]. It costs nothing extra if #13 adopts PostHog, and 1,500 free responses a month [13] is far more than Perfin will see. Getting responses into GitHub means building a webhook relay [14].

**Sentry User Feedback.** A bug-report tool. The form is native, works offline and doesn't require name or email [16][17]. It only makes sense if Perfin uses Sentry for crash reporting anyway. Two cautions under the privacy promise. Default console-log breadcrumbs and request URLs [21] can carry amounts or account names if the app logs them. And GitHub linking is a paid feature [20].

**Plain form to GitHub Issues.** A native screen with a text box and an optional email field. It POSTs to a small function that holds a fine-grained token scoped to one repo with Issues: write [24] and calls the create-issue endpoint [23]. No SDK, no account, no WebView, $0. GitHub's secondary limit of 80 content-creating requests a minute and 500 an hour [25] is a ceiling Perfin won't hit, and it also caps damage from spam. Two things to get right:

- The `emrosas/perfin` repo is public. Issues filed there are public, including whatever the user typed. Send feedback to a private intake repo and copy the good ones into the public tracker by hand.
- The function needs basic abuse limits (length cap, per-IP rate limit) because the endpoint is open to anyone.

## Recommendation

Ship the plain form at launch. Native screen, POST to a small serverless function, issue in a private GitHub repo. It is the only option that meets all of these at once: native in Expo, no account, no third-party SDK, $0, and lands straight in GitHub where the work is already tracked. The payload is the message, app version, platform, and an email only if the user typed one. Never attach balances, transactions or logs.

Where the function lives follows #18. If the sync backend has HTTP endpoints, put it there; otherwise a Cloudflare Worker on the free tier [28] is enough.

Defer the public roadmap and voting until there are enough users to vote. When that day comes, use Featurebase: guest voting [4], GitHub sync that notifies voters on close [5], and a WebView or browser link from the app [2]. Budget $29/month for the plan that includes integrations [6].

Skip Canny. Use PostHog Surveys only for targeted in-app questions if #13 adopts PostHog. Use Sentry's form only if Sentry is adopted for crashes, and turn off console breadcrumbs first.

## Open questions

- Which backend hosts the intake function (depends on #18).
- Whether Featurebase's Free plan includes feedback boards and the GitHub integration. The pricing page doesn't say [6]. Check at signup.

## Sources

1. Featurebase, Installation overview. https://help.featurebase.app/articles/2796697-installation-overview
2. Featurebase, Embed Featurebase into mobile app. https://help.featurebase.app/articles/1131771-embed-featurebase-into-mobile-app
3. Featurebase feedback board, "React Native Messenger SDK/Installation Guide" (Nov 9, 2025). https://feedback.featurebase.app/p/react-native-messenger-sdkinstallation-guide
4. Featurebase, No log-in posting, upvoting, and commenting. https://help.featurebase.app/articles/0480699-no-log-in-posting-upvoting-and-commenting
5. Featurebase, GitHub Integration. https://help.featurebase.app/articles/9380267-github-integration
6. Featurebase, Pricing. https://www.featurebase.app/pricing
7. Featurebase, Security FAQ and Data Processing Agreement. https://help.featurebase.app/articles/8874192-security-faq, https://help.featurebase.app/articles/6556750-data-processing-agreement
8. Canny, Pricing (plan cards and tracked-user FAQ). https://canny.io/pricing
9. Canny, The Canny widget. https://intercom.help/canny/en/articles/1058407-the-canny-widget
10. Canny, GitHub integration. https://canny.io/integrations/github
11. PostHog, React Native surveys installation. https://posthog.com/docs/surveys/installation/react-native
12. PostHog, Surveys SDK feature support. https://posthog.com/docs/surveys/sdk-feature-support
13. PostHog, Surveys pricing. https://posthog.com/surveys/pricing
14. PostHog, Survey responses destinations. https://posthog.com/docs/surveys/destinations
15. PostHog, Anonymous vs identified events. https://posthog.com/docs/data/anonymous-vs-identified-events
16. Sentry, React Native user feedback. https://docs.sentry.io/platforms/react-native/user-feedback/
17. Sentry, React Native user feedback configuration. https://docs.sentry.io/platforms/react-native/user-feedback/configuration/
18. Sentry, User Feedback (product docs). https://docs.sentry.io/product/user-feedback/
19. Sentry, Pricing. https://sentry.io/pricing/
20. Sentry, GitHub integration. https://docs.sentry.io/organization/integrations/source-code-mgmt/github/
21. Sentry, React Native data collected. https://docs.sentry.io/platforms/react-native/data-management/data-collected/
22. Sentry, React Native Session Replay. https://docs.sentry.io/platforms/react-native/session-replay/
23. GitHub REST API, Create an issue. https://docs.github.com/en/rest/issues/issues#create-an-issue
24. GitHub, Permissions required for fine-grained personal access tokens. https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens
25. GitHub, Rate limits for the REST API. https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
26. GitHub, Creating an issue from a URL query. https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue#creating-an-issue-from-a-url-query
27. GitHub, Participating in a discussion. https://docs.github.com/en/discussions/collaborating-with-your-community-using-discussions/participating-in-a-discussion
28. Cloudflare, Workers pricing. https://developers.cloudflare.com/workers/platform/pricing/
