# Per-user sync server cost

Research for [#10](https://github.com/emrosas/perfin/issues/10), part of map [#8](https://github.com/emrosas/perfin/issues/8). Prices checked on 2026-10-17 against each vendor's own pricing page or docs. All prices in USD unless marked MXN.

## Short answer

At 100k users, sync costs between $0.002 and $0.025 per sync user per month on every stack that can do offline writes (Turso cheapest, Convex on its Business minimum the priciest). At small scale the plan minimums dominate: $5 to $74 a month in total, whatever the user count. Users who paid once and never turn on sync cost $0 in server fees on every option, as long as we create nothing server-side (no auth user, no database) until they turn sync on.

Infra cost does not limit the sync price. The priciest realistic stack (PowerSync Cloud on Supabase) breaks even at $0.87 per user per month (about MXN 19 with IVA) with only 100 sync users, and at under $0.09 from 1k users up. Any sync price we would actually charge clears that by a wide margin. The choice of engine (#18) should be made on offline writes, Shared Ledger support and fixed minimums, not on per-user cost.

Two options drop out on non-cost grounds:

- **Zero** does not support offline writes. Its docs say it "does not support offline writes" and is "not designed for long periods offline" ([Zero offline docs](https://zero.rocicorp.dev/docs/offline)). That breaks the local-first promise.
- **InstantDB** is shutting down its cloud. New signups are closed and cloud apps shut down on 2027-08-31 ([Instant announcement](https://www.instantdb.com/essays/instant_team_joins_openai)). Self-hosting stays possible (Apache-2.0, [repo](https://github.com/instantdb/instant)), but we would be running an orphaned backend.

## Workload assumptions

These numbers drive every table below. They are estimates for a typical expense tracker, not measurements. Each one is per sync user per month.

| Quantity | Value | Reasoning |
|---|---|---|
| Transactions created | 300 | "A few hundred a month" from the ticket |
| Logical row changes | 600 | 300 creates plus edits, deletes, Accounts, Recurring Payments |
| Rows written (SQLite-metered services) | 2,000 | 600 changes x ~3 for secondary indexes and sync bookkeeping |
| Rows read | 10,000 | Incremental pulls by cursor, plus occasional full resync |
| Stored data | 2 MB | ~3,600 Transactions (a year) at ~500 B each including indexes |
| Devices | 2 | Phone plus web companion |
| Sync sessions | 240 | 2 devices x 4 app opens a day x 30 days |
| Requests to the server | 1,000 | Pushes and pulls across those sessions |
| Data sent to devices | 2 MB | 600 changes x 500 B x 2 devices, plus a full resync for ~10% of users |
| Peak concurrent connections | 10% of sync users | 5% of devices online at the busiest moment, 2 devices each |
| Convex function calls | 2,000 | 600 mutations, 240 sync queries, reactive re-runs on the other device |
| Convex database I/O | 20 MB | Cursor-based sync query; a naive "subscribe to the whole month" query would be 5-10x more |
| Convex egress | 5 MB | Function results sent to clients |
| PowerSync data hosted | 3 MB | Data copy plus operation history ([metering notes](https://www.powersync.com/pricing)) |
| Durable Object active time | 50 GB-s | ~400 s awake at the fixed 128 MB billing size |
| Workers CPU | 5,000 ms | 5 ms per request |

Sensitivity check: at 10x this workload, every stack still costs under $0.10 per user per month at 100k users. Most line items scale linearly with the workload; only the plan minimums stay fixed.

## Prices used

### Convex

From the [Convex pricing page](https://www.convex.dev/pricing) (US East, 1.0x; other regions are 1.3x per the [limits doc](https://docs.convex.dev/production/state/limits)).

| | Free & Starter | Professional |
|---|---|---|
| Base | $0, pay as you go | $25 per developer per month |
| Function calls | 1M incl., then $2.20/M | 25M incl., then $2/M |
| Database storage | 0.5 GB incl., then $0.22/GB | 50 GB incl., then $0.20/GB |
| Database I/O | 1 GB incl., then $0.22/GB | 50 GB incl., then $0.20/GB |
| Data egress | 1 GB incl., then $0.132/GB | 50 GB incl., then $0.12/GB |
| Concurrent sessions | 1,000 | 10,000 |

Business & Enterprise starts at a $2,500 monthly minimum. Convex is a backend, not a local-first sync engine: we would write the push/pull protocol ourselves on top of mutations and queries.

### Turso (Turso Cloud with Turso Sync)

From the [Turso pricing page](https://turso.tech/pricing). One database per user; idle databases "cost only storage".

| | Free | Developer | Scaler | Pro |
|---|---|---|---|---|
| Base | $0 | $4.99 | $24.92 | $416.58 |
| Databases | 100 | Unlimited | Unlimited | Unlimited |
| Storage | 5 GB | 9 GB, then $0.75/GB | 24 GB, then $0.50/GB | 50 GB, then $0.45/GB |
| Rows read | 500M | 2.5B, then $1/B | 100B, then $0.80/B | 250B, then $0.75/B |
| Rows written | 10M | 25M, then $1/M | 100M, then $0.80/M | 250M, then $0.75/M |
| Syncs | 3 GB | 10 GB, then $0.35/GB | 24 GB, then $0.25/GB | 100 GB, then $0.15/GB |

Turso Sync gives local reads and writes with explicit `push()` / `pull()`, and Turso recommends it over embedded replicas for new projects ([embedded replicas doc](https://docs.turso.tech/features/embedded-replicas/introduction), [Turso Sync usage](https://docs.turso.tech/sync/usage)). Conflict handling is "last push wins". The public docs do not define exactly what counts toward "Syncs"; I treated it as bytes moved by push and pull. Storage is counted in 4 KB pages ([usage and billing](https://docs.turso.tech/help/usage-and-billing)).

### Cloudflare (Durable Object per user, SQLite storage)

[Workers Paid](https://developers.cloudflare.com/workers/platform/pricing/) is $5 a month minimum and includes 10M requests and 30M CPU ms, then $0.30/M requests and $0.02/M CPU ms.

[Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing/) on Workers Paid:

| Item | Included | Overage |
|---|---|---|
| Requests | 1M | $0.15/M (incoming WebSocket messages count 20:1) |
| Duration | 400,000 GB-s | $12.50 per million GB-s |
| SQLite rows read | 25B | $0.001/M |
| SQLite rows written | 50M | $1.00/M |
| SQLite storage | 5 GB-month | $0.20/GB-month |

Duration is billed on a fixed 128 MB per object while it is awake. Idle objects that can hibernate cost nothing, so we would need the WebSocket Hibernation API, not plain `accept()`.

[D1](https://developers.cloudflare.com/d1/platform/pricing/) has the same row prices but charges $0.75/GB-month for storage, and caps each database at 10 GB and each account at 50,000 databases ([D1 limits](https://developers.cloudflare.com/d1/platform/limits/)). That is a problem past 50k users with one database per user, so Durable Objects are the better fit. Either way, Cloudflare gives us storage and compute, not a sync engine.

### Supabase

From the [Supabase pricing page](https://supabase.com/pricing). Pro is $25 a month with 100,000 MAU, 8 GB disk, 250 GB egress, 5M Realtime messages, 500 Realtime peak connections and $10 of compute credit. Overages: $0.00325 per MAU, $0.125/GB disk, $0.09/GB egress, $2.50 per million Realtime messages, $10 per 1,000 peak connections.

Compute ([compute and disk doc](https://supabase.com/docs/guides/platform/compute-and-disk)): Micro ~$10, Small ~$15, Medium ~$60, Large ~$110 a month. I assumed Micro at 1k users, Small at 10k and Medium at 100k.

Supabase is the Postgres that PowerSync, Electric and Zero sync from. I priced it two ways: as a plain Postgres host under those engines, and as a do-it-yourself sync backend using Realtime for change fan-out. Realtime does not buffer changes for offline devices, so the DIY version still needs a pull-by-cursor endpoint we would write.

### PowerSync

From the [PowerSync pricing page](https://www.powersync.com/pricing).

| | Free | Pro | Team |
|---|---|---|---|
| Base | $0 | from $49 | from $599 |
| Data synced | 2 GB | 30 GB, then $1/GB | 30 GB, then $1/GB |
| Data hosted | 500 MB | 10 GB, then $1/GB (max 100 GB) | 10 GB, then $1/GB (max 500 GB) |
| Peak concurrent clients | 50 | 1,000, then $30 per 1,000 (max 3,000) | 1,000, then $30 per 1,000 (max 10,000+) |

Data synced is metered uncompressed and counted again for each device that receives it. The self-hosted Open Edition is free under FSL-1.1-ALv2 ([license](https://github.com/powersync-ja/powersync-service/blob/main/LICENSE)) and runs as a Docker container ([self-hosting doc](https://docs.powersync.com/self-hosting/getting-started)) next to a bucket-storage database.

### ElectricSQL

From the [Electric pricing page](https://electric.ax/pricing). Pay as you go has no base fee and waives bills under $5. Writes cost $1 per million (a write is a stream message up to 10 KB), retention costs $0.10 per GB-month, and the Postgres Sync add-on adds $2 per million writes emitted to shape logs. Initial sync and snapshots are billed at the base rate only. "Egress, fan-out, concurrent users, and data delivery are unlimited at no additional cost." Pro is $249 a month as prepaid credit with 10% off unit prices.

Electric "does not do write-path sync" ([writes guide](https://electric.ax/docs/guides/writes)). Writes go through our own API, which I priced as a Cloudflare Worker. Self-hosting is free (Apache-2.0, [repo](https://github.com/electric-sql/electric)).

### Zero

From the [Zero site](https://zero.rocicorp.dev/): Cloud Zero Hobby is $30 a month (10 GB storage, 3 shared vCPU), Professional $300 a month (100 GB, 7 dedicated vCPU), extra storage $0.20/GB. Self-hosting is free (Apache-2.0, [repo](https://github.com/rocicorp/mono)). Priced for completeness; it fails the offline-writes requirement.

### InstantDB

No current pricing. Instant Cloud is closed to new signups and shuts down on 2027-08-31 ([announcement](https://www.instantdb.com/essays/instant_team_joins_openai)). Excluded.

### Self-hosted reference

For self-hosted estimates I used [DigitalOcean Basic droplets](https://www.digitalocean.com/pricing/droplets): 2 GB for $12, 4 GB for $24 a month. These numbers leave out our own time spent on upgrades, backups and incidents, which will cost more than the servers.

## Monthly cost at 1k, 10k and 100k sync users

Totals in USD per month. Per-user cost at 100k in the last column.

| Stack | Offline writes | 1k users | 10k users | 100k users | Per user at 100k |
|---|---|---|---|---|---|
| Turso Sync, DB per user | Yes | $4.99 | $16.74 | $236.92 | $0.0024 |
| Cloudflare Workers + Durable Objects | Yes, we build sync | $5.00 | $11.00 | $302.75 | $0.0030 |
| Electric Cloud + Supabase + Worker for writes | We build the write path | $30.00 | $60.50 | $364.40 | $0.0036 |
| Supabase DIY (REST + Realtime) | We build sync | $25.00 | $54.00 | $481.50 | $0.0048 |
| Convex | We build sync | $7.24 (Starter) | $55.00 (Pro) | $849 to $2,500 | $0.0085 to $0.025 |
| PowerSync Cloud + Supabase | Yes | $74.00 | $100.50 | $1,428.00 | $0.0143 |
| PowerSync self-hosted + Supabase | Yes | ~$37 | ~$56 | ~$185 | ~$0.0019 |
| Zero Cloud + Supabase | No | $55.00 | $63.50 | $419.00 | $0.0042 |

How each row adds up:

- **Turso.** 1k fits inside Developer ($4.99); the Free plan's 100-database cap rules it out. 10k on Developer: $4.99 + 11 GB storage x $0.75 + 10 GB syncs x $0.35. 100k on Scaler: $24.92 + 176 GB storage x $0.50 + 100M writes x $0.80/M + 176 GB syncs x $0.25.
- **Cloudflare.** 1k fits in the $5 minimum. 10k adds 9M DO requests ($1.35), 100k GB-s ($1.25), 15 GB storage ($3.00) and 20M CPU ms ($0.40). 100k: DO requests $14.85, Worker requests $27, CPU $9.40, duration $57.50, rows written 150M x $1/M = $150, storage 195 GB x $0.20 = $39, plus $5.
- **Electric.** Per user: 600 changes x $3/M (base plus Postgres Sync) plus ~400 snapshot writes x $1/M plus retention, about $0.0024. 1k falls under the $5 waiver, so only Supabase ($25) and Workers ($5) count. At 10k: $24 + $31.50 + $5. At 100k: $240 + $99 Supabase + ~$25 Workers.
- **Supabase as Postgres host** (used under Electric, PowerSync, Zero): $25 at 1k, $31.50 at 10k (12 GB extra disk + Small compute), $99 at 100k (192 GB extra disk x $0.125 + Medium compute after the $10 credit).
- **Supabase DIY** adds Realtime: 1,200 messages per user (600 changes to 2 devices). 10k: 7M extra messages ($17.50) + 500 extra peak connections ($5). 100k: 115M messages ($287.50) + 9,500 extra peak connections ($95).
- **Convex.** 1k on Starter: 1M extra calls ($2.20) + 19 GB I/O ($4.18) + 1.5 GB storage ($0.33) + 4 GB egress ($0.53). 10k on Pro: $25 + 150 GB I/O x $0.20. 100k on Pro: $25 + 175M calls x $2/M + 1,950 GB I/O x $0.20 + 150 GB storage x $0.20 + 450 GB egress x $0.12 = $849. Peak connections at 100k (10,000) hit the Pro cap of 10,000 concurrent sessions, so expect Business at its $2,500 minimum.
- **PowerSync Cloud.** 1k: $49 Pro + $25 Supabase. 10k: $49 + 20 GB hosted overage + $31.50 Supabase. 100k needs Team (Pro caps hosted data at 100 GB and clients at 3,000): $599 + 170 GB synced + 290 GB hosted + 9,000 clients x $30/1,000 + $99 Supabase.
- **PowerSync self-hosted.** One $12 droplet at 1k, one $24 droplet at 10k, two $24 droplets at 100k, plus Supabase as source and bucket storage (adding ~$37.50 of disk at 100k). Rough.
- **Zero.** Hobby at 1k and 10k (10 GB extra storage at 10k), Professional at 100k with 100 GB extra storage, plus Supabase. Whether 3 shared vCPU carries 10k users is unknown.

## Users who paid once and never sync

Server cost: $0 on every stack above, if we follow two rules:

1. Create no server-side record until the user turns sync on. That means no auth account (Supabase bills per MAU above 100k, Convex counts stored rows), no per-user database (Turso Free caps at 100 databases, D1 at 50,000 per account), no Durable Object.
2. Keep purchase checks on the device and RevenueCat. Never call our backend for them.

The one-time purchase still carries non-server costs: the 15% store fee, and RevenueCat's 1% of tracked revenue once monthly tracked revenue passes $2,500 ([RevenueCat pricing](https://www.revenuecat.com/pricing/)). Those come out of the purchase price and recur nowhere.

## Break-even sync price

Store fee: 15%. Apple charges 15% under the Small Business Program for developers under $1M in proceeds ([Apple](https://developer.apple.com/app-store/small-business-program/)), and drops to 10% for subscriptions after their first year. Google charges 15% on auto-renewing subscriptions outside the US/EEA/UK/Japan/Australia and "10% + 5% billing fee" in the US ([Google Play](https://support.google.com/googleplay/android-developer/answer/112622)). 15% is therefore the worst case for subscriptions on both stores.

Formula: break-even monthly price = server cost per sync user / 0.85. Add 1% for RevenueCat above $2,500 monthly tracked revenue.

MXN uses the Banxico FIX of 18.4930 MXN per USD on 2026-10-16 ([Banxico](https://www.banxico.org.mx/tipcamb/tipCamMIAction.do?idioma=es)). Mexican store prices include 16% IVA, so the column "MXN incl. IVA" multiplies by 1.16. How IVA is collected and remitted is #12's question; this only shows the price the customer would see.

| Stack | Sync users | Cost per user | Break-even USD | Break-even MXN before IVA | Break-even MXN incl. IVA |
|---|---|---|---|---|---|
| PowerSync Cloud + Supabase (priciest) | 100 | $0.74 | $0.87 | 16.10 | 18.68 |
| PowerSync Cloud + Supabase | 1,000 | $0.074 | $0.087 | 1.61 | 1.87 |
| PowerSync Cloud + Supabase | 100,000 | $0.0143 | $0.017 | 0.31 | 0.36 |
| Convex Pro | 100 | $0.25 | $0.29 | 5.44 | 6.31 |
| Convex Business (forced at ~100k) | 100,000 | $0.025 | $0.029 | 0.54 | 0.63 |
| Turso / Cloudflare (cheapest) | 100 | $0.05 | $0.059 | 1.09 | 1.26 |
| Turso | 100,000 | $0.0024 | $0.0028 | 0.05 | 0.06 |

At 100 sync users, PowerSync Cloud costs $74 a month whatever the user count. Every other row is dominated by per-user usage and lands below MXN 2 a month. A sync subscription at even $0.99 or MXN 19 a month covers server cost from the first 100 users on every stack. The real price can be set on value and on store price points.

## Open points for #18

- These are modelled costs. Once a prototype exists, measure real rows written, bytes synced and Convex I/O per user and redo the tables. The biggest swing is Convex I/O, which depends on query design.
- Turso does not publicly define its "Syncs" meter. Ask Turso before committing.
- A Shared Ledger means one change goes to several users' devices. That multiplies PowerSync "data synced" (charged per receiving device) and per-user-database designs (Turso, Durable Objects) need a shared database per ledger. Electric's fan-out is free.
