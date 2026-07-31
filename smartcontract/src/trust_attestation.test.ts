import { describe, it, expect, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// trust_attestation — Test Suite
//
// Tests the core ZK primitive of Verities:
//   - Oracle authorization before writing
//   - Storing attestations (public hash, private score)
//   - verify_claim(): selective disclosure — YES if score > threshold
//   - verify_claim(): selective disclosure — NO if score < threshold
//   - Unauthorized oracle rejection
//   - Public hash queryability without score exposure
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_ADDRESS    = '0xADMIN_ADDRESS_32BYTES_PADDED_000000000000000000000000';
const ORACLE_ADDRESS   = '0xORACLE_ONE_32BYTES_PADDED_00000000000000000000000001';
const ATTACKER         = '0xATTACKER_32BYTES_PADDED_00000000000000000000000003';
const REGISTRY_ADDRESS = '0xREGISTRY_32BYTES_PADDED_0000000000000000000000000004';

const WALLET_ALICE     = '0xALICE_WALLET_32BYTES_PADDED_000000000000000000000005';
const WALLET_BOB       = '0xBOB_WALLET_32BYTES_PADDED_0000000000000000000000006';

const CAT_LENDING      = 'lending         '; // 16 bytes padded
const CAT_INCOME       = 'income          ';
const CAT_FREELANCE    = 'freelance       ';

const MOCK_INPUT_HASH  = '0xSHA256_OF_SCORING_INPUTS_32BYTES_000000000000000007';
const MOCK_TIMESTAMP   = 1753998000; // Unix timestamp

// ── Simulated private score store (off-chain — never touches ledger) ──────────
const privateScores: Record<string, Record<string, number>> = {};

function setPrivateScore(wallet: string, category: string, score: number): void {
  if (!privateScores[wallet]) privateScores[wallet] = {};
  privateScores[wallet][category] = score;
}

function getPrivateScore(wallet: string, category: string): number {
  return (privateScores[wallet]?.[category]) ?? 0;
}

// ── Simulated contract state ──────────────────────────────────────────────────
interface AttestationState {
  admin: string;
  oracle_registry_address: string;
  attestation_count: number;
  attestation_hashes: Record<string, Record<string, string>>;
  attestation_timestamps: Record<string, Record<string, number>>;
  category_count: Record<string, number>;
  initialized: boolean;
}

// Simulated oracle registry (simplified)
const authorizedOracles: Set<string> = new Set();

function createState(): AttestationState {
  return {
    admin: '',
    oracle_registry_address: '',
    attestation_count: 0,
    attestation_hashes: {},
    attestation_timestamps: {},
    category_count: {},
    initialized: false,
  };
}

function init(state: AttestationState, new_admin: string, registry: string): void {
  if (state.initialized) throw new Error('Already initialized');
  state.admin = new_admin;
  state.oracle_registry_address = registry;
  state.initialized = true;
}

function store_attestation(
  state: AttestationState,
  oracle_caller: string,
  wallet: string,
  category: string,
  input_hash: string,
  timestamp: number
): void {
  // Auth: verify oracle is in registry
  if (!authorizedOracles.has(oracle_caller)) {
    throw new Error('Unauthorized: oracle not registered');
  }

  // Store PUBLIC commitment (hash) on ledger — NOT the score
  if (!state.attestation_hashes[wallet]) state.attestation_hashes[wallet] = {};
  if (!state.attestation_timestamps[wallet]) state.attestation_timestamps[wallet] = {};

  state.attestation_hashes[wallet][category] = input_hash;
  state.attestation_timestamps[wallet][category] = timestamp;
  state.category_count[wallet] = (state.category_count[wallet] ?? 0) + 1;
  state.attestation_count += 1;

  // NOTE: score is NEVER stored in state — it lives only as a private witness
}

// Core ZK primitive: selective disclosure
// Returns boolean only — score stays private
function verify_claim(
  state: AttestationState,
  wallet: string,
  category: string,
  threshold: number
): boolean {
  // Retrieve private score (witness — never disclosed to ledger)
  const score = getPrivateScore(wallet, category);
  // Private comparison: only the boolean result is returned
  return score > threshold;
}

function get_attestation_hash(
  state: AttestationState,
  wallet: string,
  category: string
): string {
  return state.attestation_hashes[wallet]?.[category] ?? '';
}

function get_category_count(state: AttestationState, wallet: string): number {
  return state.category_count[wallet] ?? 0;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('trust_attestation', () => {

  describe('init()', () => {
    it('initializes admin and registry address', () => {
      const state = createState();
      init(state, ADMIN_ADDRESS, REGISTRY_ADDRESS);
      expect(state.admin).toBe(ADMIN_ADDRESS);
      expect(state.oracle_registry_address).toBe(REGISTRY_ADDRESS);
    });

    it('rejects double initialization', () => {
      const state = createState();
      init(state, ADMIN_ADDRESS, REGISTRY_ADDRESS);
      expect(() => init(state, ATTACKER, REGISTRY_ADDRESS)).toThrow('Already initialized');
    });
  });

  describe('store_attestation()', () => {
    let state: AttestationState;

    beforeEach(() => {
      authorizedOracles.clear();
      state = createState();
      init(state, ADMIN_ADDRESS, REGISTRY_ADDRESS);
      authorizedOracles.add(ORACLE_ADDRESS);
    });

    it('authorized oracle can store an attestation', () => {
      // Set private score (off-chain, oracle-side)
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 83);

      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);

      expect(state.attestation_count).toBe(1);
      expect(state.attestation_hashes[WALLET_ALICE][CAT_LENDING]).toBe(MOCK_INPUT_HASH);
      expect(state.category_count[WALLET_ALICE]).toBe(1);
    });

    it('stores timestamp correctly', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 75);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);
      expect(state.attestation_timestamps[WALLET_ALICE][CAT_LENDING]).toBe(MOCK_TIMESTAMP);
    });

    it('CRITICAL: score is never stored in public state', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 83);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);

      // Score must NOT appear anywhere in the public ledger state
      const stateStr = JSON.stringify(state);
      expect(stateStr).not.toContain('"83"');
      expect(stateStr).not.toContain('83');
      // Only hash and timestamp are public
      expect(state.attestation_hashes[WALLET_ALICE][CAT_LENDING]).toBe(MOCK_INPUT_HASH);
    });

    it('unauthorized oracle is rejected', () => {
      expect(() =>
        store_attestation(state, ATTACKER, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP)
      ).toThrow('Unauthorized');
    });

    it('multiple categories for same wallet', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING,  83);
      setPrivateScore(WALLET_ALICE, CAT_INCOME,   91);
      setPrivateScore(WALLET_ALICE, CAT_FREELANCE, 67);

      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING,   MOCK_INPUT_HASH, MOCK_TIMESTAMP);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_INCOME,    MOCK_INPUT_HASH, MOCK_TIMESTAMP + 1);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_FREELANCE, MOCK_INPUT_HASH, MOCK_TIMESTAMP + 2);

      expect(state.attestation_count).toBe(3);
      expect(get_category_count(state, WALLET_ALICE)).toBe(3);
    });
  });

  describe('verify_claim() — selective disclosure', () => {
    let state: AttestationState;

    beforeEach(() => {
      authorizedOracles.clear();
      state = createState();
      init(state, ADMIN_ADDRESS, REGISTRY_ADDRESS);
      authorizedOracles.add(ORACLE_ADDRESS);
    });

    it('returns TRUE when score exceeds threshold (score 83 > threshold 70)', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 83);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);

      const result = verify_claim(state, WALLET_ALICE, CAT_LENDING, 70);
      expect(result).toBe(true);
    });

    it('returns FALSE when score is below threshold (score 45 > threshold 70 = false)', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 45);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);

      const result = verify_claim(state, WALLET_ALICE, CAT_LENDING, 70);
      expect(result).toBe(false);
    });

    it('returns FALSE when score equals threshold (strict greater-than)', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 70);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);

      const result = verify_claim(state, WALLET_ALICE, CAT_LENDING, 70);
      expect(result).toBe(false); // strictly greater-than
    });

    it('CRITICAL: verify_claim result reveals only boolean — not the actual score', () => {
      setPrivateScore(WALLET_BOB, CAT_INCOME, 91);
      store_attestation(state, ORACLE_ADDRESS, WALLET_BOB, CAT_INCOME, MOCK_INPUT_HASH, MOCK_TIMESTAMP);

      const result = verify_claim(state, WALLET_BOB, CAT_INCOME, 80);
      // Only a boolean is returned — the score 91 is not revealed
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
      // The actual score is inaccessible from the result
    });

    it('different users can have independent claims', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 83);
      setPrivateScore(WALLET_BOB,   CAT_LENDING, 42);

      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);
      store_attestation(state, ORACLE_ADDRESS, WALLET_BOB,   CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);

      expect(verify_claim(state, WALLET_ALICE, CAT_LENDING, 70)).toBe(true);
      expect(verify_claim(state, WALLET_BOB,   CAT_LENDING, 70)).toBe(false);
    });
  });

  describe('get_attestation_hash()', () => {
    let state: AttestationState;

    beforeEach(() => {
      authorizedOracles.clear();
      state = createState();
      init(state, ADMIN_ADDRESS, REGISTRY_ADDRESS);
      authorizedOracles.add(ORACLE_ADDRESS);
    });

    it('returns correct hash after attestation', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 83);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);

      expect(get_attestation_hash(state, WALLET_ALICE, CAT_LENDING)).toBe(MOCK_INPUT_HASH);
    });

    it('returns empty for wallet with no attestation', () => {
      expect(get_attestation_hash(state, WALLET_BOB, CAT_LENDING)).toBe('');
    });
  });
});
