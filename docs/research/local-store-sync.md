# Local store and sync engine options for Expo, desktop and web

Research for [#9](https://github.com/emrosas/perfin/issues/9), part of the map [#8](https://github.com/emrosas/perfin/issues/8). Checked on 2026-10-17.

## What Perfin needs

These requirements come from the map #8.

- The Expo app on iOS and Android is the product. The app is on Expo SDK 54 and React Native 0.81, per `packages/app/package.json`.
- A free user's data never leaves the device. The store must work as a plain local database with no server, account or network.
- A paying user turns sync on later. Data written before that point has to start syncing.
- Web is a companion that only works with sync. A desktop app must be possible later and should be local-first too.
- A Shared Ledger, where several people write to the same data, must be possible later.
- Lower lock-in is better. Self-hosting is a plus.

## Comparison

"Yes" means the claim is in the project's own docs or code, linked in the notes below the table.

| Option | Expo iOS/Android | Desktop | Browser | Offline writes | Conflicts | Local-only use | Shared Ledger later | Self-host | Status Oct 2026 | Lock-in |
|---|---|---|---|---|---|---|---|---|---|---|
| Turso Sync | Yes, native module, dev build | Yes, Node, Rust, Go | Yes, WASM package | Yes | Last push wins, local changes replayed on pull | Yes, same package | One database per ledger, no row-level permissions | Dev-only local sync server | Active, engine pre-1.0 | SQLite file, sync tied to Turso Cloud |
| PowerSync | Yes, op-sqlite, dev build | Node SDK, Tauri alpha, Capacitor beta | Yes, web SDK | Yes, upload queue | Your backend decides, per-field LWW by default | Yes, documented local-only mode | Yes, Sync Streams scope rows per user or group | Yes, Open Edition, FSL license | Active, releases in Oct 2026 | Client is SQLite, source of truth is your Postgres |
| ElectricSQL + TanStack DB | Yes, through TanStack DB SQLite persistence | Electron, Tauri, Node persistence packages | Yes | Yes, through a separate outbox package | Your API decides | Yes, [local-only collections](https://github.com/TanStack/db/blob/main/docs/collections/local-only-collection.md) | Yes, shapes filter rows | Yes, Apache-2.0 | Electric 1.x, TanStack DB 0.x | Postgres, low |
| Zero | Yes | Not researched | Yes | No | Server-authoritative | No, client is a cache of the server | Yes | Yes | Active, 1.x | Postgres |
| InstantDB | Yes, `@instantdb/react-native` | n/a | Yes | n/a | n/a | n/a | n/a | Yes | Cloud shutting down | High |
| Triplit | n/a | n/a | Yes | Yes, offline mode | Property-level CRDT | n/a | n/a | Yes, AGPL | No release since Jul 2025 | Medium |
| cr-sqlite | Removed from op-sqlite | Yes, loadable extension | Yes, WASM | Yes | CRDT merge | Yes | Yes, in theory | You build the server | No release since Jan 2024 | Low data lock-in, high build cost |
| Convex local-first | No offline sync shipped | n/a | n/a | No | n/a | No | Yes, server-side | Yes, open-source backend | Object sync engine announced Nov 2024, not shipped | High |
| LiveStore, not in the ticket | Yes, expo-sqlite adapter, no Expo Web | Electron, Tauri, Node adapters | Yes | Yes | Events rebased on pull, app resolves merges | Yes | One event log per ledger | Yes, bring your own sync backend | Active, 0.5.0 on 2026-10-15 | High, event-sourced model |

## Notes per option

### Turso Sync

- The new Turso engine reads and writes locally. The app calls `push()` and `pull()` to sync, and "all changes are safely stored in the local database file until they can be synced" ([usage](https://docs.turso.tech/sync/usage)).
- Conflicts use "last push wins". On pull, the local database rolls back to the last synced state, applies remote changes, then replays unpushed local changes on top ([conflict resolution](https://docs.turso.tech/sync/conflict-resolution.md)). Push sends logical statements, not pages ([usage](https://docs.turso.tech/sync/usage)).
- React Native bindings shipped on 2026-01-29 as `@tursodatabase/sync-react-native`. They need React Native 0.76+ with the New Architecture. An Expo config plugin is listed under "What's next", so today it needs a dev build ([announcement](https://turso.tech/blog/react-native-bindings-for-turso)). The same package opens a local-only database with no `url` ([README](https://github.com/tursodatabase/turso/blob/main/bindings/react-native/README.md)). Latest version is 0.8.3, published 2026-10-12 (`npm view @tursodatabase/sync-react-native time`).
- The engine runs on Linux, macOS, Windows and in browsers through WebAssembly, with bindings for Go, JavaScript, Java, .NET, Python and Rust ([README](https://github.com/tursodatabase/turso)). The browser sync package is `@tursodatabase/sync-wasm`.
- Maturity: Turso says the engine runs in production but "we have not yet reached 1.0" and recommends keeping independent backups ([FAQ](https://github.com/tursodatabase/turso#faq)). The older libSQL offline sync was labelled "beta quality, and not yet recommended for production use" in March 2025 ([blog](https://turso.tech/blog/turso-offline-sync-public-beta)). The current sync docs don't state a stability level.
- Self-hosting: the `tursodb` CLI has a `--sync-server` flag, documented for development and testing. It takes no auth token ([local sync server](https://docs.turso.tech/sync/local-sync-server.md)). Production sync means Turso Cloud.
- The sync unit is a whole database. A Shared Ledger would be its own database that every member's device syncs. Anyone with that database's token can write any row, so per-member permissions would have to live outside Turso.
- The React Native README shows a `remoteEncryption` option with a client-supplied AES-256-GCM key ([README](https://github.com/tursodatabase/turso/blob/main/bindings/react-native/README.md)). That fits the privacy promise and is worth a closer look in the backend ticket.
- Pricing has a free tier of 100 databases and paid plans with unlimited databases from $4.99/month ([pricing](https://turso.tech/pricing)).

### PowerSync

- PowerSync keeps an in-app SQLite database in sync with a backend database. Client SDKs cover JavaScript Web, React Native and Expo, Node.js, Capacitor beta, Tauri alpha, Flutter, Kotlin, Swift, .NET beta and Rust beta. Source databases are Postgres, MongoDB, MySQL beta, SQL Server beta, Azure DocumentDB alpha and Convex experimental ([overview](https://docs.powersync.com/intro/powersync-overview)). The Tauri plugin's first 0.1.0 release came out on 2026-10-01 ([release](https://github.com/powersync-ja/powersync-js/releases/tag/tauri-plugin-powersync%400.1.0)).
- On React Native it uses `@op-engineering/op-sqlite`, which doesn't run in Expo Go. A JavaScript adapter exists for Expo Go ([React Native SDK](https://docs.powersync.com/client-sdks/reference/react-native-and-expo)).
- Writes go into a local upload queue, and your backend API applies them. "The developer's app backend therefore dictates how mutations from clients are processed." The default is per-field last-write-wins and deletes always win. The backend can validate or reject writes ([conflicts](https://docs.powersync.com/handling-writes/handling-update-conflicts)).
- Local-only use is documented. The app can use local-only tables until the user signs up and move the data to synced tables afterwards. Without that, the upload queue keeps growing for users who never register ([local-only usage](https://docs.powersync.com/client-sdks/advanced/local-only-usage)).
- Sync Streams pick which rows reach which client with SQL-like queries, for example `SELECT * FROM lists WHERE owner_id = auth.user_id()` ([Sync Streams](https://docs.powersync.com/sync/streams/overview)). A Shared Ledger becomes a membership table plus a stream filtered on it, with the backend enforcing write permissions.
- The self-hosted Open Edition is "free source-available" ([pricing](https://www.powersync.com/pricing)) under FSL-1.1-ALv2, which converts to Apache 2.0 later ([LICENSE](https://github.com/powersync-ja/powersync-service/blob/main/LICENSE)). Cloud has a free tier and Pro from $49/month ([pricing](https://www.powersync.com/pricing)).
- Convex as a source shipped in June 2026 as experimental. It reads Convex's Streaming Export API and uploads writes through your Convex mutations. The authors list rough edges, such as every mutation mapping a client UUID to Convex's `_id` ([design notes](https://powersync.com/blog/convex-powersync-design-notes)).
- Activity: `@powersync/react-native` 2.3.1 and service v1.27.0 both shipped in October 2026 (`npm view`, [service releases](https://github.com/powersync-ja/powersync-service/releases)).

### ElectricSQL with TanStack DB

- "Electric does not do write-path sync." Writes go through your own API. Full offline support needs a local store plus your own sync of pending writes ([writes guide](https://electric.ax/docs/guides/writes)).
- Electric needs Postgres with logical replication. It ships as a Docker image, or you use Electric Cloud ([deployment](https://electric.ax/docs/guides/deployment)). The license is Apache-2.0 ([repo](https://github.com/electric-sql/electric)).
- The local side for Expo is TanStack DB. Version 0.6, from March 2026, added SQLite persistence for browser, Node, React Native and Expo ([release post](https://electric.ax/blog/2026/03/25/tanstack-db-0.6-app-ready-with-persistence-and-includes)). Offline writes need `@tanstack/offline-transactions`, an outbox. On React Native you write its storage adapter yourself, since "the package does not include an AsyncStorage adapter" ([README](https://github.com/TanStack/db/blob/main/packages/offline-transactions/README.md)).
- Desktop persistence packages exist for Electron and Tauri (`npm view @tanstack/electron-db-sqlite-persistence`, `@tanstack/tauri-db-sqlite-persistence`).
- This stack does what PowerSync does from four separately versioned parts, most of them pre-1.0. Apache-2.0 end to end is its main advantage.

### Zero

- "Zero does not support offline writes." Writes made while disconnected are rejected ([offline](https://zero.rocicorp.dev/docs/offline)). That breaks the core requirement. It also needs Postgres and a `zero-cache` server ([llms.txt](https://zero.rocicorp.dev/llms.txt)), so a free user can't run it with no server.
- Expo support is real, with expo-sqlite or op-sqlite as the store ([React Native](https://zero.rocicorp.dev/docs/react-native)). It could suit a later web companion, but not the local-first core.

### InstantDB

- On 2026-08-19 the Instant team announced it is joining OpenAI. New signups are closed and "all cloud apps will shut down" on 2027-08-31. The code stays open source with a self-hosting guide ([announcement](https://www.instantdb.com/essays/instant_team_joins_openai)). Building on it now means self-hosting an unmaintained backend. Ruled out.

### Triplit

- Triplit lists offline mode and "conflict resolution at the property level" with CRDTs ([README](https://github.com/aspen-cloud/triplit)). I didn't check its Expo support, because the project has stopped.
- The last release was on 2025-07-31 and the last commit on 2025-09-11 ([commits](https://github.com/aspen-cloud/triplit/commits/main)). Co-founder Matt Linkous joined Supabase in October 2025 to work on integrations. Supabase says its focus "isn't to directly integrate Triplit into our platform" ([Supabase blog](https://supabase.com/blog/triplit-joins-supabase)). Ruled out as unmaintained.

### cr-sqlite

- A CRDT extension for SQLite that merges databases which took independent writes ([README](https://github.com/vlcn-io/cr-sqlite)). The last release, v0.16.3, is from January 2024. Build fixes landed in August 2026 ([commits](https://github.com/vlcn-io/cr-sqlite/commits/main)).
- op-sqlite 18.0.0 "removed `crsqlite` support entirely". You now load it as a runtime extension yourself ([op-sqlite changelog](https://github.com/OP-Engineering/op-sqlite/blob/main/docs/docs/changelog.md)).
- There is no hosted sync server, so we would write and run our own. Too much custom work for a small team.

### Convex local-first

- Convex announced its own object sync engine on 2024-11-13: "We're currently working on our own object sync engine at Convex" ([Stack post](https://stack.convex.dev/object-sync-engine)). I found no shipped release of it in the Convex docs, blog or npm packages as of `convex` 1.47.0.
- The practical path to keep Convex is PowerSync's experimental Convex source, above. The existing Convex data is test data, per #8, so keeping Convex is optional.

### LiveStore, added because it fits the shape

- LiveStore syncs an event log, not tables. Each client builds a local SQLite database from the events. The model is Git-like: a client pulls upstream events, rebases its pending events on top, then pushes ([syncing](https://docs.livestore.dev/reference/syncing/)).
- Adapters exist for web, Expo, Node, Electron, Tauri and Cloudflare Durable Objects. Sync providers include Cloudflare Workers, ElectricSQL, S2, or your own ([docs](https://docs.livestore.dev/)). The Expo adapter needs the New Architecture and doesn't support Expo Web ([Expo adapter](https://docs.livestore.dev/reference/platform-adapters/expo-adapter/)).
- The docs say all client data "should fit into a in-memory SQLite database", with up to 1GB fine on typical devices. They call it "a relatively advanced technology" and not a fit if you want a server database as the source of truth ([when to use](https://docs.livestore.dev/evaluation/when-livestore/)). v0.5.0 shipped on 2026-10-15 ([release](https://github.com/livestorejs/livestore/releases/tag/v0.5.0)).
- An append-only event log suits a money ledger, and a Shared Ledger maps to one shared event log. The cost is that every write becomes an event and every schema change replays history. The auth section of the sync docs is still marked TODO.

## Shortlist

### 1. PowerSync

I'd pick this one. It's the only option where everything Perfin needs today is documented and released for Expo: local-only use for free users, an offline upload queue, and a way to turn sync on later. The server decides every write. That gives the Shared Ledger a clear home for permissions and validation, which Turso's whole-database sync lacks. It also has web, Node and a new Tauri SDK for desktop, plus a self-host option. The costs are running a Postgres backend and an API for writes, and the FSL license on the self-hosted service.

### 2. Turso Sync

It has the fewest moving parts. One SQLite package works local-only and turns into a synced replica by passing a URL, on React Native, browser and desktop. A database per user, and later per ledger, maps straight onto multi-device sync, and the client-side remote encryption fits the privacy promise. The risks are that the engine is pre-1.0, last-push-wins is coarse for shared money data, production sync only runs on Turso Cloud, and there are no row-level permissions inside a shared database.

### 3. LiveStore, as a fallback

Pick it only if an event log is the model we want anyway. It works fully offline and treats the device as the source of truth, which matches "data never leaves the device". Sync providers are cheap to run and swappable. It is pre-1.0, needs a different way of writing every feature, and has no Expo Web support. That last one matters less, since the web companion can be a separate client.

Ruled out: Zero, because it has no offline writes. InstantDB, because its cloud is shutting down. Triplit and cr-sqlite, because neither has had a release in over a year. Convex's own local-first engine, because it hasn't shipped. ElectricSQL with TanStack DB is workable, but PowerSync does the same job with fewer parts and a more mature Expo story.

## Open questions for #18 and the backend ticket

- Whether Turso's `remoteEncryption` keeps the server from reading synced data. That decides how strong a privacy claim paid sync can make.
- Real per-user cost under each pricing page, for the sync backend ticket.
- Whether PowerSync's Convex source becomes stable, in case we want to keep Convex for auth and server functions.
