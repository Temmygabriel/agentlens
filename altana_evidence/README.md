# Altana on-chain proof — BNB testnet (chain 97)

**What this shows:** the *core* "Best Built with Altana" requirements, done for real on
chain, not described in a pitch. Every hash below is confirmed on a **public RPC**
(independent of Altana's own relay) with `status: success`. Signing happened **locally**
from a key that never left the builder's PC and was never uploaded.

**Agent wallet (self-custodial, EIP-7702 smart account):**
`0xCE794C8c9785a80e4D56a42E9Afeac08971e4780`  ·  chain **97** (BNB Smart Chain Testnet)

## The transactions

| # | What it proves | Tx hash | Block | Status |
|---|----------------|---------|-------|--------|
| 1 | Grant a scoped session key (later revoked in #4) | `0xffa0ac8472cf8926af9e6e03f79d19df7129a459824613300e0f61943f70a382` | 126266167 | ✅ success |
| 2 | **Grant a scoped session** — call allowlist + `0.01 tBNB`/day + `1 $U`/day spend caps + 7-day expiry, **registered in the KeyStore** | `0x1bbbf4ed048eaebf59bc7413297d92c3539cae87f437aa7622e3fe368020c0e3` | 126267633 | ✅ success |
| 3 | **A real transaction sent THROUGH the session key** (signed by the session key, not the admin), a native transfer inside the spend cap | `0x9d9120ce9b6f1b598da7f1cb92382ca88b508385a43e82b5aab0d29e7c5083d4` | 126267675 | ✅ success |
| 4 | **Revoke** a session in one transaction (immediate) | `0xcc2accbbfbb5678fcc10f4725cd7e8a0fdc40db5b7ddb06cce2d60bec94bc67a` | 126267840 | ✅ success |

Explorer (all txs on this wallet): https://testnet.bscscan.com/address/0xCE794C8c9785a80e4D56a42E9Afeac08971e4780

## Requirement checklist (core track)

- [x] Agent on its **own Altana wallet** — `0xCE79…4780`, self-custodial smart account.
- [x] Session with **real limits** — call allowlist (ERC-8183 stack + sink) + native `0.01 tBNB`/day + `1 $U`/day spend caps + 7-day expiry (tx #2).
- [x] Session **registered in KeyStore** — `grantSession(register: true)`; the wallet's first action also bundled admin-key registration (tx #2).
- [x] **Real on-chain transaction through a session key** — tx #3, CONFIRMED, signed by the session key.
- [x] **Revoke** works and is immediate — tx #4.
- [x] **Wallet address** available for the submission form (above).

**Bonus (not yet done — blocked only on testnet `$U`):** a full ERC-8183 *hire* funds a job
budget in `$U`. The testnet `$U` token (`0xc70B…5565`) is an Ownable proxy with **no
permissionless faucet/mint** (proven by `scripts/altana/probe_u_token.mjs`), so `$U` must be
requested from Altana directly. Gas (tBNB) is not the blocker — we hold it, and Altana also
exposes a native `fundNative` relay faucet.

## Reproduce

```
node scripts/altana/phase2_session.mjs   # grant scoped session + one tx through it
node scripts/altana/phase2_revoke.mjs <session-public-key 0x04...>   # revoke
node scripts/altana/verify_txs.mjs       # re-confirm all hashes on a public RPC
```

The session key + its scope are saved locally at `~/.agentlens/altana-testnet-session.json`
(**never** committed — it holds a session key), so a later revoke/hire can reuse it.
