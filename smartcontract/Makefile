.PHONY: all compile test deploy-preprod deploy-preview clean help

# ─────────────────────────────────────────────────────────────────────────────
# Verities Protocol — Makefile
# ─────────────────────────────────────────────────────────────────────────────

COMPACT    = compactc
NODE       = node
NPM        = npm

# Targets
all: compile test

## Compile both Compact contracts to ZK circuits
compile:
	@echo "⚙️  Compiling oracle_registry.compact..."
	$(COMPACT) src/oracle_registry.compact managed/oracle_registry
	@echo ""
	@echo "⚙️  Compiling trust_attestation.compact..."
	$(COMPACT) src/trust_attestation.compact managed/trust_attestation
	@echo ""
	@echo "✅ Compilation complete. Circuits in managed/"
	@ls -la managed/ 2>/dev/null || echo "  (managed/ will appear after first compile)"

## Compile only oracle_registry
compile-registry:
	$(COMPACT) src/oracle_registry.compact managed/oracle_registry

## Compile only trust_attestation
compile-attestation:
	$(COMPACT) src/trust_attestation.compact managed/trust_attestation

## Run full test suite
test:
	@echo "🧪 Running test suite..."
	$(NPM) test

## Run tests in watch mode
test-watch:
	$(NPM) run test:watch

## Deploy to Preprod
deploy-preprod:
	@echo "🚀 Deploying to Midnight Preprod..."
	bash deploy.sh preprod

## Deploy to Preview
deploy-preview:
	@echo "🚀 Deploying to Midnight Preview..."
	bash deploy.sh preview

## Install dependencies
install:
	$(NPM) install

## Clean compiled output
clean:
	@echo "🧹 Cleaning managed/ directory..."
	rm -rf managed/
	@echo "Done."

## Show help
help:
	@echo ""
	@echo "Verities Protocol — Compact Contract Commands"
	@echo "─────────────────────────────────────────────"
	@echo "  make compile          Compile both contracts"
	@echo "  make test             Run test suite"
	@echo "  make deploy-preprod   Deploy to Midnight Preprod"
	@echo "  make deploy-preview   Deploy to Midnight Preview"
	@echo "  make clean            Remove compiled circuits"
	@echo "  make install          Install npm dependencies"
	@echo ""
