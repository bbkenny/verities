#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Verities Protocol — Deployment Script
#
# Compiles both Compact contracts and (if a wallet + proof server are
# available) deploys them to a Midnight network.
#
# Usage:
#   bash deploy.sh preprod
#   bash deploy.sh preview
#
# Honesty note:
#   A real end-to-end deploy requires the Midnight wallet SDK (Lace or the
#   CLI wallet) and a running proof server. Those packages are published to a
#   private registry and are NOT installable via the public npm registry that
#   this repository's package.json uses, so this script does NOT fake a deploy.
#   It compiles the contracts for real, then fails loudly if no signer is
#   configured, rather than printing a bogus "PENDING_DEPLOYMENT" success.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

NETWORK="${1:-preprod}"
COMPACT_BIN="${COMPACT_BIN:-compact}"

echo ""
echo "🌙 Verities Protocol — Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Network: $NETWORK"
echo ""

# ── Pre-flight checks ────────────────────────────────────────────────────────
echo "▶ Running pre-flight checks..."

if ! command -v "$COMPACT_BIN" &> /dev/null; then
  echo "❌ Error: '$COMPACT_BIN' compiler not found."
  echo "   Install the Midnight toolchain: https://docs.midnight.network/develop/tutorial/using-counter/installation"
  exit 1
fi

if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js not found. Required: Node 22+"
  exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  echo "❌ Error: Node 22+ required. Found: v$(node --version)"
  exit 1
fi

echo "✅ compact: $($COMPACT_BIN --version 2>/dev/null || echo 'installed')"
echo "✅ node: $(node --version)"
echo ""

# ── Compile contracts ────────────────────────────────────────────────────────
echo "▶ Compiling contracts..."

echo "  Compiling oracle_registry.compact..."
"$COMPACT_BIN" src/oracle_registry.compact managed/oracle_registry
echo "  ✅ oracle_registry compiled"

echo "  Compiling trust_attestation.compact..."
"$COMPACT_BIN" src/trust_attestation.compact managed/trust_attestation
echo "  ✅ trust_attestation compiled"

echo ""
echo "  Generated circuits:"
find managed -name '*.zkir' | sed 's/^/    /'
echo ""

# ── Deploy (only if a signer is configured) ─────────────────────────────────
case "$NETWORK" in
  preprod|preview) ;;
  *)
    echo "❌ Unknown network: $NETWORK. Use 'preprod' or 'preview'."
    exit 1
    ;;
esac

echo "▶ Deploying to Midnight $NETWORK..."

if [ -z "${MIDNIGHT_WALLET_SEED:-}" ]; then
  echo "❌ No Midnight wallet configured (MIDNIGHT_WALLET_SEED is unset)."
  echo ""
  echo "   A real deployment needs:"
  echo "     1. A Midnight wallet (Lace browser extension or CLI wallet) funded with"
  echo "        tNIGHT / tDUST from the faucet for the $NETWORK network."
  echo "     2. A running local proof server (e.g. on http://localhost:6300)."
  echo "     3. The wallet SDK, which is published to a private registry and is not"
  echo "        installable from the public npm registry used by package.json."
  echo ""
  echo "   Follow the manual steps in README.md → Deployment, then record the"
  echo "   resulting contract addresses in docs/deployments.md."
  exit 1
fi

echo "  (Deployment via wallet SDK not scripted in this repository — see README.)"
echo "  If you reached this point, wire in your wallet SDK and signer here."
exit 1
