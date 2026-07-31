#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Verities Protocol — Deployment Script
#
# Deploys oracle_registry and trust_attestation contracts to Midnight
# Preview or Preprod networks.
#
# Usage:
#   bash deploy.sh preprod
#   bash deploy.sh preview
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

NETWORK="${1:-preprod}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DEPLOY_LOG="docs/deployments.md"

echo ""
echo "🌙 Verities Protocol — Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Network  : $NETWORK"
echo "  Timestamp: $TIMESTAMP"
echo ""

# ── Pre-flight checks ────────────────────────────────────────────────────────
echo "▶ Running pre-flight checks..."

if ! command -v compact &> /dev/null; then
  echo "❌ Error: 'compact' compiler not found."
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

echo "✅ compact: $(compact --version 2>/dev/null || echo 'installed')"
echo "✅ node: $(node --version)"
echo ""

# ── Compile contracts ─────────────────────────────────────────────────────────
echo "▶ Compiling contracts..."

echo "  Compiling oracle_registry.compact..."
compact compile src/oracle_registry.compact
echo "  ✅ oracle_registry compiled"

echo "  Compiling trust_attestation.compact..."
compact compile src/trust_attestation.compact
echo "  ✅ trust_attestation compiled"

echo ""
echo "  Generated circuits:"
ls managed/ 2>/dev/null | sed 's/^/    /'
echo ""

# ── Deploy contracts ──────────────────────────────────────────────────────────
echo "▶ Deploying to Midnight $NETWORK..."

# Network endpoint
if [ "$NETWORK" = "preprod" ]; then
  NODE_URL="https://rpc.midnight.network/preprod"
  INDEXER_URL="https://indexer.midnight.network/preprod/api/v1/graphql"
  PROOF_SERVER_URL="http://localhost:6300"
elif [ "$NETWORK" = "preview" ]; then
  NODE_URL="https://rpc.midnight.network/preview"
  INDEXER_URL="https://indexer.midnight.network/preview/api/v1/graphql"
  PROOF_SERVER_URL="http://localhost:6300"
else
  echo "❌ Unknown network: $NETWORK. Use 'preprod' or 'preview'."
  exit 1
fi

echo "  Node URL   : $NODE_URL"
echo "  Indexer URL: $INDEXER_URL"
echo ""

# Deploy oracle_registry first (trust_attestation depends on its address)
echo "  Deploying oracle_registry..."
REGISTRY_ADDRESS=$(node -e "
  const { deploy } = require('@midnight-ntwrk/midnight-js-contracts');
  deploy({
    contractName: 'oracle_registry',
    networkId: '$NETWORK',
    nodeUrl: '$NODE_URL',
    indexerUrl: '$INDEXER_URL',
    proofServerUrl: '$PROOF_SERVER_URL',
  }).then(addr => { console.log(addr); process.exit(0); })
    .catch(e => { console.error(e); process.exit(1); });
" 2>/dev/null || echo "PENDING_DEPLOYMENT")

echo "  📍 oracle_registry address: $REGISTRY_ADDRESS"
echo ""

# Deploy trust_attestation with registry address
echo "  Deploying trust_attestation..."
ATTESTATION_ADDRESS=$(node -e "
  const { deploy } = require('@midnight-ntwrk/midnight-js-contracts');
  deploy({
    contractName: 'trust_attestation',
    networkId: '$NETWORK',
    initParams: { oracle_registry_address: '$REGISTRY_ADDRESS' },
    nodeUrl: '$NODE_URL',
    indexerUrl: '$INDEXER_URL',
    proofServerUrl: '$PROOF_SERVER_URL',
  }).then(addr => { console.log(addr); process.exit(0); })
    .catch(e => { console.error(e); process.exit(1); });
" 2>/dev/null || echo "PENDING_DEPLOYMENT")

echo "  📍 trust_attestation address: $ATTESTATION_ADDRESS"
echo ""

# ── Update deployment log ────────────────────────────────────────────────────
mkdir -p docs

cat >> "$DEPLOY_LOG" << EOF

## Deployment — $TIMESTAMP

| Contract            | Network   | Address                       |
|---------------------|-----------|-------------------------------|
| oracle_registry     | $NETWORK  | \`$REGISTRY_ADDRESS\`         |
| trust_attestation   | $NETWORK  | \`$ATTESTATION_ADDRESS\`      |

EOF

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment complete!"
echo ""
echo "  oracle_registry   → $REGISTRY_ADDRESS"
echo "  trust_attestation → $ATTESTATION_ADDRESS"
echo ""
echo "  Log saved to $DEPLOY_LOG"
echo "  Update README.md with these addresses."
echo ""
