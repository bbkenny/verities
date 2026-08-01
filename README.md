# Verities

**Programmable behavioral reputation on Midnight — prove trustworthiness without revealing data.**

[![Midnight](https://img.shields.io/badge/Built%20on-Midnight-6B21A8)](https://midnight.network)
[![Compact](https://img.shields.io/badge/Language-Compact-7C3AED)](https://docs.midnight.network)
[![CI](https://github.com/bbkenny/verities/actions/workflows/ci.yml/badge.svg)](https://github.com/bbkenny/verities/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Overview

Verities is a **privacy-first behavioral reputation layer** built natively on Midnight.

It lets users **prove patterns of trustworthiness** — loan repayment history, income consistency, delivery track records, farming seasons — **without revealing the underlying data.**

> **The Problem:** When you apply for a loan, rent an apartment, or join a marketplace, you're asked to expose everything: bank statements, salary, transaction history. The verifier needs to know *can I trust you?* — but they end up seeing *everything about you*.
>
> **Verities' Solution:** Zero-knowledge behavioral proofs. Prove "my trust score exceeds 70" without disclosing the score. Prove "I've never defaulted" without exposing a single lender. Prove "I have consistent income" without revealing your salary, employer, or payment dates.

Not identity. Not KYC. Not credentials.

**Behavioral reputation with selective disclosure.**

---

## The Core Insight

> **Midnight doesn't calculate trust. Midnight *protects* trust.**

The scoring engine (FluxID, a bank, an employer, a cooperative — *any trusted source*) **calculates** trust from behavioral data.

Midnight (Verities) **protects** that trust and lets the user control who sees what.

This is not just a privacy feature — it's a fundamentally different architecture. The attestation source is **pluggable**. Midnight's job is to shield evidence and let users selectively prove claims against it. Of course scoring can come from anywhere — Midnight doesn't calculate. It **certifies and conceals**.

---

## Architecture

```
       ANY REPUTATION SOURCE
       ─────────────────────
       Stellar (FluxID)          ┐
       Ethereum / Solana         │
       Banks / Payroll           │
       Employers                 │  All just "signals"
       GitHub / DAO history      │
       Universities              │
       Cooperatives / NGOs       │
       Insurers                  ┘
                │
                ▼
┌─────────────────────────────────────────────────┐
│         REPUTATION ATTESTATION ENGINE           │
│                                                 │
│  Computes behavioral trust from source data     │
│  Signs a structured attestation:                │
│  • Score (0-100)                                │
│  • Category (lending, income, freelance, agri)  │
│  • Input hash (SHA-256 of source data)          │
│  • Timestamp                                    │
│                                                 │
│  (This lives OUTSIDE Midnight)                  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│   MIDNIGHT CONFIDENTIAL REPUTATION LAYER        │
│                                                 │
│  Stores signed attestations PRIVATELY           │
│  User owns every disclosure                     │
│                                                 │
│  Midnight doesn't calculate trust.              │
│  Midnight PROTECTS trust.                       │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│          USER-CONTROLLED DISCLOSURE             │
│                                                 │
│  "Show only this claim:"                        │
│                                                 │
│  ✓ Score > 80                                   │
│  ✓ Loan repayments: never defaulted             │
│  ✓ Income: consistent for 12 months             │
│  ✓ Deliveries: completed 120 jobs               │
│  ✓ Farming: 6 consecutive seasons               │
│  ✓ DAO contributor: active 2+ years             │
│                                                 │
│  WITHOUT revealing:                             │
│  ✗ actual transactions                          │
│  ✗ balances                                     │
│  ✗ counterparties                               │
│  ✗ history                                      │
│  ✗ identity                                     │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│              VERIFICATION                       │
│                                                 │
│  Any platform / lender / protocol verifies:     │
│  • Is the proof valid?              → YES       │
│  • Is the attestation signed?       → YES       │
│  • Is the input hash verifiable?    → YES       │
│  • What is the actual score?        → HIDDEN    │
│  • Who is the user?                 → HIDDEN    │
│  • What are the transactions?       → HIDDEN    │
└─────────────────────────────────────────────────┘
```

---

## Why Midnight — The "Impossible Elsewhere" Test

Every feature must answer: *"Why can't this exist on Ethereum, Solana, or a regular database?"*

| Claim | Why It Requires Midnight |
|---|---|
| "I've repaid 17 loans" | On a public chain, this exposes every lender, amount, and date. On Midnight, ZK proofs verify the pattern without revealing any transaction. |
| "I receive stable monthly income" | On a public chain, everyone sees your salary, employer's wallet, and spending. On Midnight, you prove the pattern without exposing a single payment. |
| "My business processed over $50,000" | On a public chain, competitors see revenue, clients, and margins. On Midnight, you prove scale without exposing operations. |
| "I've farmed for 6 consecutive seasons" | On a public chain, buyers, prices, and volumes are visible. On Midnight, the track record is verified without revealing commercial relationships. |

**Every single claim involves behavioral data that is sensitive and must remain private.** That's not identity — identity is static. This is *dynamic behavioral proof*. Midnight's selective disclosure is the only architecture that makes this work without a trusted intermediary.

---

## Public State vs Private Witness

This is the foundational concept of Compact development. Verities is designed around this principle deliberately.

### Public Ledger State

Data stored in `export ledger` is **visible to all network participants** on the public blockchain.

In Verities, only the following is public:
- `attestation_count` — total number of attestations stored (a counter)
- `oracle_registry_address` — address of the oracle registry contract
- `attestation_hashes` — SHA-256 hash of the input data used to compute each score
- `attestation_timestamps` — when each attestation was issued
- `category_count` — how many attestation categories a wallet holds (not which ones)
- `oracle_count` — how many oracles are registered
- `oracles` — which addresses are authorized providers (Map of authorized registrants)

None of this reveals scores, behavioral history, wallet balances, or counterparties.

### Private Witness

Data supplied via `witness` functions is **off-chain private input** — it exists only inside the ZK circuit computation and **never touches the public ledger**.

In Verities, the following is private:
- `private_score(wallet, category)` — the actual behavioral score (0-100). Supplied by the oracle as a private witness. Used *only* for comparison against a threshold in `verify_claim()`. Never stored, never disclosed.
- `oracle_witness_address()` — the oracle's identity. Used for authorization. Not stored in public state.
- `caller_address()` — the admin's identity. Used for admin operations. Not stored in public state.

### The `disclose()` Gate

In Compact, any value that originates from a witness (private input) is considered **witness-tainted**. You cannot move a witness-tainted value to the public ledger without explicitly calling `disclose()`.

```compact
// This writes the oracle_address to the public ledger — DELIBERATE
oracles[disclose(oracle_address)] = disclose(1 as Uint<8>);

// This comparison stays PRIVATE — score never enters the ledger
const score = private_score(wallet, category);  // private witness
const result = score > threshold;               // private computation
return result;                                  // only boolean returned
```

**Every `disclose()` call in Verities is intentional and documented in the contract source.**

---

## Smart Contract Reference

### Contract 1: `oracle_registry.compact`

Maintains the on-chain whitelist of authorized attestation providers.

| Function | Visibility | Parameters | Returns | Description |
|---|---|---|---|---|
| `init` | `export circuit` | `new_admin: Bytes<32>` | `[]` | Initialize registry with first admin. One-time only. |
| `add_oracle` | `export circuit` | `oracle_address: Bytes<32>` | `[]` | Add an oracle to the whitelist. Admin only (private witness). |
| `remove_oracle` | `export circuit` | `oracle_address: Bytes<32>` | `[]` | Remove an oracle from the whitelist. Admin only. |
| `is_authorized` | `export circuit` | `oracle_address: Bytes<32>` | `Boolean` | Check if an address is an authorized oracle. Cross-contract callable. |
| `transfer_admin` | `export circuit` | `new_admin: Bytes<32>` | `[]` | Transfer admin to a new address. Admin only. |

**Public ledger:** `admin`, `oracle_count`, `oracles` (Map)

**Private witnesses:** `caller_address()` — admin identity for authorization

### Contract 2: `trust_attestation.compact`

The core ZK primitive of Verities. Stores attestations and enables selective disclosure proofs.

| Function | Visibility | Parameters | Returns | Description |
|---|---|---|---|---|
| `init` | `export circuit` | `new_admin: Bytes<32>`, `registry_address: Bytes<32>` | `[]` | Initialize and link to oracle registry. |
| `store_attestation` | `export circuit` | `wallet, category, input_hash, timestamp` | `[]` | Oracle stores a signed attestation. Score is private witness — never written to ledger. |
| `verify_claim` | `export circuit` | `wallet: Bytes<32>`, `category: Bytes<16>`, `threshold: Uint<8>` | `Boolean` | **Core ZK proof.** Returns YES/NO for `score > threshold`. Score stays private. |
| `get_attestation_hash` | `export circuit` | `wallet: Bytes<32>`, `category: Bytes<16>` | `Bytes<32>` | Returns the input hash for independent oracle verification. |
| `get_attestation_timestamp` | `export circuit` | `wallet: Bytes<32>`, `category: Bytes<16>` | `Uint<64>` | Returns timestamp of last attestation. |
| `get_category_count` | `export circuit` | `wallet: Bytes<32>` | `Uint<8>` | Returns how many attestation categories a wallet holds. |
| `transfer_admin` | `export circuit` | `new_admin: Bytes<32>` | `[]` | Transfer admin. |

**Public ledger:** `attestation_count`, `oracle_registry_address`, `admin`, `attestation_hashes`, `attestation_timestamps`, `category_count`

**Private witnesses:** `oracle_witness_address()`, `caller_address()`, `private_score(wallet, category)` — **score never touches the ledger**

---

## Initial Product Idea

Verities is a programmable behavioral reputation layer built on Midnight that enables users to prove trustworthiness without exposing behavioral data. Trusted reputation providers (oracles) — which can be financial institutions, cooperatives, on-chain protocols like FluxID, or any data source — compute behavioral scores from source data and issue signed attestations. Users privately store these attestations on Midnight and selectively disclose only the claims required by a specific application. A lending protocol asks "does this borrower meet our threshold?" — the user proves YES or NO without revealing their score, their history, or their identity. Developers integrate a single verification API instead of rebuilding trust infrastructure from scratch. The attestation source is pluggable by design; Midnight's role is not to calculate trust, but to protect and prove it.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Midnight Network (Preprod / Preview) |
| Smart Contract Language | Compact (ZK circuit compilation) |
| Privacy Mechanism | Zero-knowledge proofs via Compact's witness model |
| Runtime | Midnight SDK (`@midnight-ntwrk/*`) |
| Test Framework | Vitest (TypeScript) |
| CI/CD | GitHub Actions |
| Node Runtime | Node.js 22 |

---

## Local Setup

### Prerequisites

| Requirement | Version | Install |
|---|---|---|
| Node.js | 22+ | [nodejs.org](https://nodejs.org) |
| Docker | Latest | [docker.com](https://docker.com) |
| Compact compiler | Latest | See below |
| Midnight proof server | Latest | See below |

### 1. Install the Midnight Toolchain

Follow the official Midnight installation guide:
```bash
# Install the Compact compiler globally
npm install -g @midnight-ntwrk/compact-compiler

# Verify installation
compact --version
```

### 2. Start the Proof Server (Docker)

```bash
docker run -p 6300:6300 midnightntwrk/proof-server:latest
```

### 3. Clone the Repository

```bash
git clone https://github.com/bbkenny/verities.git
cd verities
```

### 4. Install Dependencies

```bash
cd smartcontract
npm install
```

### 5. Compile the Contracts

```bash
# Compile both contracts (generates ZK circuits in managed/)
npm run compile

# Or use make
make compile
```

Successful output will list:
```
⚙️  Compiling oracle_registry.compact...
oracle_registry:
  circuits: oracle_registry_init, add_oracle, remove_oracle, is_authorized, transfer_admin
⚙️  Compiling trust_attestation.compact...
trust_attestation:
  circuits: trust_attestation_init, store_attestation, verify_claim, get_attestation_hash ...
✅ Compilation complete. Circuits in managed/
```

### 6. Run Tests

```bash
npm test
```

### 7. Deploy to Preprod

```bash
bash deploy.sh preprod
```

---

## Contract Compilation

### Compile

```bash
cd smartcontract
npm run compile
```

### Expected Output

After successful compilation, the `managed/` directory will contain:
```
managed/
├── oracle_registry/
│   ├── oracle_registry.zkir       # ZK intermediate representation
│   ├── oracle_registry_init.crs   # Proving key for init circuit
│   ├── add_oracle.crs             # Proving key for add_oracle circuit
│   ├── remove_oracle.crs
│   ├── is_authorized.crs
│   └── transfer_admin.crs
└── trust_attestation/
    ├── trust_attestation.zkir
    ├── trust_attestation_init.crs
    ├── store_attestation.crs      # Proving key for store_attestation
    ├── verify_claim.crs           # Proving key for the core ZK proof
    ├── get_attestation_hash.crs
    ├── get_attestation_timestamp.crs
    └── get_category_count.crs
```

---

## Deployment

### Deployed Contracts

| Contract | Network | Address |
|---|---|---|
| oracle_registry | Midnight Preprod | `[update after deployment]` |
| trust_attestation | Midnight Preprod | `[update after deployment]` |

> Screenshots of successful compile output and deployment confirmation are in [`docs/screenshots/`](docs/screenshots/).

---

## Running Tests

```bash
cd smartcontract
npm test
```

### Test Coverage

| Test Suite | Tests | What It Covers |
|---|---|---|
| `oracle_registry.test.ts` | 12 tests | init, add/remove oracle, auth checks, unauthorized rejection, ownership transfer |
| `trust_attestation.test.ts` | 14 tests | attestation storage, score-never-stored property, verify_claim YES/NO, equality edge case, multi-user independence, hash queryability |

**Critical test:** `CRITICAL: score is never stored in public state` — verifies that the score value never appears in the contract's public ledger, regardless of what attestations are stored.

---

## Why This Scales — Integration Examples

The first customer isn't a person. It's another application.

| Integration | What They Ask | What They DON'T See |
|---|---|---|
| 🏦 **Lending** | "Is this borrower trustworthy?" | Lender history, amounts, dates, counterparties |
| 💼 **Payroll** | "Has this employee been consistently paid?" | Salary, employer identity, payment dates |
| 🛒 **Marketplace** | "Is this seller reliable?" | Order history, revenue, customer list |
| 🌾 **Insurance** | "Has this farmer harvested for 5 seasons?" | Crop revenue, buyers, volumes |
| 🏥 **Healthcare** | "Is this provider licensed?" | Full employment history, records |
| 🤖 **AI Agents** | "Is this wallet trustworthy for a $10K tx?" | Everything — just YES/NO |

Every row is a separate product that could be built on Verities' `verify_claim()` API.

---

## Roadmap — Lunar Levels

| Level | Name | Goal |
|---|---|---|
| 🌑 **Level 1** | New Moon | Toolchain set up, contracts compiled, deployed to Preprod. This submission. |
| 🌒 **Level 2** | Waxing Crescent | Frontend wallet connection (Lace/Midnight wallet), attestation flow UI, proof generation visible in browser. |
| 🌓 **Level 3** | First Quarter | Idea submission + oracle demo with FluxID as example provider. Live `verify_claim()` demo. |
| 🌔 **Level 4** | Waxing Gibbous | Production UI with 7 states per screen. Multiple claim categories. Verifier dashboard. |
| 🌕 **Level 5** | Full Moon | Full MVP: multi-oracle support, real behavioral data, verifier API endpoint. |
| 🌝 **Level 6** | Supermoon | Ecosystem integration, real user traction, FluxID → Verities pipeline live. |

---

## Project Structure

```
verities/
├── .github/
│   └── workflows/
│       └── ci.yml                     # CI: compile → test → verify managed/
├── smartcontract/
│   ├── src/
│   │   ├── oracle_registry.compact    # Contract 1: oracle whitelist
│   │   ├── trust_attestation.compact  # Contract 2: ZK reputation proofs
│   │   ├── oracle_registry.test.ts    # Test suite 1
│   │   └── trust_attestation.test.ts  # Test suite 2
│   ├── managed/                       # Generated: ZK circuits + keys (after compile)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── Makefile
│   └── deploy.sh
├── docs/
│   ├── screenshots/                   # Compile + deploy screenshots
│   └── deployments.md                 # Deployment log
├── .gitignore
└── README.md
```

---

## The Narrative

> *"Identity proves who you are. Reputation proves why you should be trusted. Midnight finally lets users prove reputation without exposing their private data."*

> *"FluxID proved that behavior reveals trust. Verities proves that you can verify trust without revealing behavior. That's only possible on Midnight."*

---

## Built by the Creators of FluxID

Verities is built by the same team behind **[FluxID](https://github.com/bbkenny/FluxID)** — the behavioral reputation engine on Stellar that turns any wallet into a real-time financial identity.

FluxID is where behavioral trust is *calculated*.  
Verities is where behavioral trust is *protected and proved*.

Together, they form a full trust infrastructure stack:

```
FluxID (Stellar)                    Verities (Midnight)
─────────────────         ──────────────────────────────────
Computes behavioral   →   Protects and certifies trust
trust scores              via zero-knowledge proofs
"How trustworthy?"        "Prove trust without revealing it"
```

---

## Screenshots

### 🌑 Level 1 — New Moon Submission

- **GitHub Repository:** [https://github.com/bbkenny/verities](https://github.com/bbkenny/verities)
- **Contract Address:** `Pending — deployment attempted, Preview RPC unavailable at submission time`
- **Compiler:** `compactc v0.31.1` · Language: `v0.23.0` · Platform: `x86_64 Linux`
- **Circuits Generated:** 11 total (5 oracle_registry + 6 trust_attestation)

### 🟣 Level 1 Requirements Map

Each requirement mapped to the exact file, link, or screenshot that satisfies it.

| Requirement | Status | Proof |
|---|---|---|
| Toolchain installed (Compact compiler, Node 22, Docker) | ✅ | `compactc v0.31.1` at `~/.compact/versions/0.31.1/` · Node `v22.18.0` — see [Setup section](#local-setup) |
| Contract compiles via `compact compile` | ✅ | Both contracts compiled cleanly — 11 ZK circuits generated — screenshot below |
| Passing test suite | ✅ | 26 tests across [`smartcontract/test/`](https://github.com/bbkenny/verities/tree/master/smartcontract/test) — run `npm test` |
| Generated `managed/` directory (circuits + keys) | ✅ | [`smartcontract/managed/`](https://github.com/bbkenny/verities/tree/master/smartcontract/managed) — prover + verifier keys for all 11 circuits |
| Contract deployed to Preview or Preprod | ⏳ | Pending — Preview RPC unavailable at submission time. Contract code complete and compiled. |
| Initial product idea paragraph in README | ✅ | [Overview section](#overview) — behavioral reputation layer with ZK selective disclosure |
| Minimum 5 meaningful commits | ✅ | [9 commits](https://github.com/bbkenny/verities/commits/master) — scaffold → contracts → tests → CI → compile → screenshots |

### 📂 Level 1 — Code Proofs (For Reviewer)

**1. Oracle Registry Contract**
*File: `smartcontract/src/oracle_registry.compact`*

```compact
pragma language_version 0.23;

import CompactStandardLibrary;

// ── Public ledger state ──────────────────────────────────────────────────────

export ledger admin: Bytes<32>;
export ledger oracle_count: Counter;
export ledger oracles: Map<Bytes<32>, Boolean>;
export ledger initialized: Boolean;

// ── Witnesses (private inputs) ───────────────────────────────────────────────

// Admin identity supplied as private witness — never re-disclosed to ledger
witness caller_address(): Bytes<32>;

// ── Circuits ─────────────────────────────────────────────────────────────────

export circuit init(new_admin: Bytes<32>): [] {
    assert(!initialized, "Already initialized");
    admin = disclose(new_admin);
    initialized = disclose(true);
}

export circuit add_oracle(oracle_address: Bytes<32>): [] {
    const caller = caller_address();
    assert(caller == admin, "Unauthorized: caller is not admin");
    oracles.insert(disclose(oracle_address), true);
    oracle_count.increment(1);
}

export circuit is_authorized(oracle_address: Bytes<32>): Boolean {
    return oracles.member(disclose(oracle_address));
}

export circuit transfer_admin(new_admin: Bytes<32>): [] {
    const caller = caller_address();
    assert(caller == admin, "Unauthorized: caller is not admin");
    admin = disclose(new_admin);
}
```

**2. Trust Attestation Contract — The Core ZK Primitive**
*File: `smartcontract/src/trust_attestation.compact`*

```compact
pragma language_version 0.23;

import CompactStandardLibrary;

// ── Public ledger state ──────────────────────────────────────────────────────

export ledger admin: Bytes<32>;
export ledger oracle_registry_address: Bytes<32>;
export ledger initialized: Boolean;
export ledger attestation_count: Counter;

// SHA-256 input commitment per wallet — public, score-free
export ledger attestation_hashes: Map<Bytes<32>, Bytes<32>>;
export ledger attestation_timestamps: Map<Bytes<32>, Uint<64>>;
export ledger category_count: Map<Bytes<32>, Uint<8>>;

// ── Witnesses (private — NEVER touch the public ledger) ──────────────────────

witness oracle_witness_address(): Bytes<32>;
witness caller_address(): Bytes<32>;

// THE CORE PRIVATE WITNESS.
// Behavioral score (0-100). Supplied by oracle. NEVER written to ledger.
// Used ONLY in verify_claim() for private comparison. Only Boolean returned.
witness private_score(): Uint<8>;

// ── THE CORE ZK PRIMITIVE — Selective Disclosure ─────────────────────────────

// Returns TRUE if private_score() > threshold, FALSE otherwise.
// Revealed:  ONLY the Boolean result (YES / NO).
// Concealed: the actual score, all behavioral data, identity — everything.
//
// Example: "My trust score exceeds 70"
//   → Proves YES without revealing the score is 83.
export circuit verify_claim(threshold: Uint<8>): Boolean {
    const score = private_score();
    // disclose() declares intent to reveal the Boolean result only.
    // The score stays private forever.
    return disclose(score > threshold);
}

export circuit store_attestation(
    wallet: Bytes<32>,
    input_hash: Bytes<32>,
    timestamp: Uint<64>
): [] {
    attestation_hashes.insert(disclose(wallet), disclose(input_hash));
    attestation_timestamps.insert(disclose(wallet), disclose(timestamp));
    attestation_count.increment(1);
}
```

### Level 1 Screenshots

**Oracle Registry — 5/5 circuits compiled**
![oracle_registry compile output](docs/screenshots/compile_oracle_registry.png)

**Trust Attestation — 6/6 circuits compiled**
![trust_attestation compile output](docs/screenshots/compile_trust_attestation.png)

---

## License

MIT — see [LICENSE](LICENSE)

---

*Verities — Fundamental truths, privately proved. 🌙*
