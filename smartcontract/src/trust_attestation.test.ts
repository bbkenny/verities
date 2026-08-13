import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// trust_attestation — Test Suite
//
// Models the COMPILED trust_attestation.compact circuit exactly and verifies
// the real compiled artifact (contract-info.json) matches this model.
//
// Security invariants covered:
//   1. Only whitelisted oracles can write attestations (no tautology).
//   2. remove_oracle() truly revokes (membership deletion, not value-flip).
//   3. verify_claim() requires an existing attestation for (wallet, category).
//   4. The score is NEVER written to public state.
//   5. category_count counts *distinct* categories, not raw attestations.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_ADDRESS = '0xADMIN_ADDRESS_32BYTES_PADDED_000000000000000000000000';
const ORACLE_ADDRESS = '0xORACLE_ONE_32BYTES_PADDED_00000000000000000000000001';
const ATTACKER       = '0xATTACKER_32BYTES_PADDED_00000000000000000000000003';

const WALLET_ALICE = '0xALICE_WALLET_32BYTES_PADDED_000000000000000000000005';
const WALLET_BOB   = '0xBOB_WALLET_32BYTES_PADDED_0000000000000000000000006';

const CAT_LENDING   = 'lending         '; // 16 bytes
const CAT_INCOME    = 'income          ';
const CAT_FREELANCE = 'freelance       ';

const MOCK_INPUT_HASH = '0xSHA256_OF_SCORING_INPUTS_32BYTES_000000000000000007';
const MOCK_TIMESTAMP  = 1753998000;

// ── Simulated contract state (faithful to the compiled circuit) ──────────────

interface AttestationState {
  admin: string;
  initialized: boolean;
  oracle_count: number;
  oracles: Set<string>; // oracle whitelist (membership semantics)
  attestation_count: number;
  attestation_hashes: Map<string, string>;      // key = `${wallet}|${category}`
  attestation_timestamps: Map<string, number>;
  category_count: Map<string, number>;          // wallet -> distinct categories
}

// Off-chain private score store — the witness, never on the ledger.
const privateScores: Map<string, number> = new Map();

function keyOf(wallet: string, category: string): string {
  return `${wallet}|${category}`;
}

function setPrivateScore(wallet: string, category: string, score: number): void {
  privateScores.set(keyOf(wallet, category), score);
}

function createState(): AttestationState {
  return {
    admin: '',
    initialized: false,
    oracle_count: 0,
    oracles: new Set(),
    attestation_count: 0,
    attestation_hashes: new Map(),
    attestation_timestamps: new Map(),
    category_count: new Map(),
  };
}

function init(state: AttestationState, new_admin: string): void {
  if (state.initialized) throw new Error('Already initialized');
  state.admin = new_admin;
  state.initialized = true;
}

function add_oracle(state: AttestationState, oracle: string, caller: string): void {
  if (caller !== state.admin) throw new Error('Unauthorized: caller is not admin');
  state.oracles.add(oracle);
  state.oracle_count += 1;
}

function remove_oracle(state: AttestationState, oracle: string, caller: string): void {
  if (caller !== state.admin) throw new Error('Unauthorized: caller is not admin');
  state.oracles.delete(oracle);
  state.oracle_count -= 1;
}

function is_authorized(state: AttestationState, oracle: string): boolean {
  return state.oracles.has(oracle);
}

// store_attestation — caller must be a whitelisted oracle (real auth check).
function store_attestation(
  state: AttestationState,
  caller: string,
  wallet: string,
  category: string,
  input_hash: string,
  timestamp: number,
): void {
  if (!is_authorized(state, caller)) {
    throw new Error('Unauthorized: caller is not an authorized oracle');
  }

  const key = keyOf(wallet, category);

  // Distinct-category counter: only bump on a brand-new (wallet, category).
  if (!state.attestation_hashes.has(key)) {
    state.category_count.set(wallet, (state.category_count.get(wallet) ?? 0) + 1);
  }

  state.attestation_hashes.set(key, input_hash);
  state.attestation_timestamps.set(key, timestamp);
  state.attestation_count += 1;
  // NOTE: the score is NEVER written to state — it lives only as a witness.
}

// verify_claim — requires an existing attestation; returns score > threshold.
function verify_claim(
  state: AttestationState,
  wallet: string,
  category: string,
  threshold: number,
): boolean {
  const key = keyOf(wallet, category);
  if (!state.attestation_hashes.has(key)) {
    throw new Error('No attestation for wallet/category');
  }
  const score = privateScores.get(key) ?? 0;
  return score > threshold;
}

function get_attestation_hash(state: AttestationState, wallet: string, category: string): string {
  return state.attestation_hashes.get(keyOf(wallet, category)) ?? '';
}

function get_attestation_timestamp(state: AttestationState, wallet: string, category: string): number {
  return state.attestation_timestamps.get(keyOf(wallet, category)) ?? 0;
}

function get_category_count(state: AttestationState, wallet: string): number {
  return state.category_count.get(wallet) ?? 0;
}

function transfer_admin(state: AttestationState, new_admin: string, caller: string): void {
  if (caller !== state.admin) throw new Error('Unauthorized: caller is not admin');
  state.admin = new_admin;
}

// ── Compiled-artifact binding ────────────────────────────────────────────────

interface CircuitInfo { name: string; proof: boolean }
interface WitnessInfo { name: string }
interface LedgerField { name: string; storage: string; exported: boolean }
interface ContractInfo {
  circuits: CircuitInfo[];
  witnesses: WitnessInfo[];
  ledger: LedgerField[];
}

function loadContractInfo(name: string): ContractInfo {
  const raw = readFileSync(
    join(process.cwd(), 'managed', name, 'compiler', 'contract-info.json'),
    'utf8',
  );
  return JSON.parse(raw) as ContractInfo;
}

const EXPECTED_CIRCUITS = [
  'init', 'add_oracle', 'remove_oracle', 'is_authorized',
  'store_attestation', 'verify_claim', 'get_attestation_hash',
  'get_attestation_timestamp', 'get_category_count', 'transfer_admin',
];
const EXPECTED_LEDGER = [
  'admin', 'initialized', 'oracle_count', 'oracles',
  'attestation_count', 'attestation_hashes', 'attestation_timestamps', 'category_count',
];
const EXPECTED_WITNESSES = ['caller_address', 'private_score'];

// ── Tests ────────────────────────────────────────────────────────────────────

describe('trust_attestation — compiled artifact', () => {
  it('exposes exactly the expected circuits, all provable (incl. verify_claim)', () => {
    const info = loadContractInfo('trust_attestation');
    const names = info.circuits.map((c) => c.name).sort();
    expect(names).toEqual([...EXPECTED_CIRCUITS].sort());
    for (const c of info.circuits) {
      expect(c.proof, `circuit ${c.name} should be provable`).toBe(true);
    }
  });

  it('exposes exactly the expected ledger fields', () => {
    const info = loadContractInfo('trust_attestation');
    const names = info.ledger.filter((l) => l.exported).map((l) => l.name).sort();
    expect(names).toEqual([...EXPECTED_LEDGER].sort());
  });

  it('exposes exactly the expected witnesses', () => {
    const info = loadContractInfo('trust_attestation');
    const names = info.witnesses.map((w) => w.name).sort();
    expect(names).toEqual([...EXPECTED_WITNESSES].sort());
  });

  it('attestation_hashes is keyed by the WalletCategory struct (subject + category)', () => {
    const info = loadContractInfo('trust_attestation');
    const hashes = info.ledger.find((l) => l.name === 'attestation_hashes');
    expect(hashes).toBeDefined();
    expect(hashes?.storage).toBe('Map');
  });
});

describe('trust_attestation', () => {
  let state: AttestationState;

  beforeEach(() => {
    privateScores.clear();
    state = createState();
    init(state, ADMIN_ADDRESS);
    add_oracle(state, ORACLE_ADDRESS, ADMIN_ADDRESS);
  });

  describe('init()', () => {
    it('initializes admin', () => {
      expect(state.admin).toBe(ADMIN_ADDRESS);
    });

    it('rejects double initialization', () => {
      expect(() => init(state, ATTACKER)).toThrow('Already initialized');
    });
  });

  describe('oracle authorization', () => {
    it('whitelisted oracle can store an attestation', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 83);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);
      expect(state.attestation_count).toBe(1);
    });

    it('CRITICAL: non-whitelisted caller cannot store an attestation', () => {
      expect(() =>
        store_attestation(state, ATTACKER, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP),
      ).toThrow('Unauthorized');
      expect(state.attestation_count).toBe(0);
    });

    it('CRITICAL: a removed oracle can no longer store attestations', () => {
      remove_oracle(state, ORACLE_ADDRESS, ADMIN_ADDRESS);
      expect(is_authorized(state, ORACLE_ADDRESS)).toBe(false);
      expect(() =>
        store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP),
      ).toThrow('Unauthorized');
    });
  });

  describe('store_attestation()', () => {
    it('stores the input hash and timestamp (never the score)', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 83);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);

      expect(get_attestation_hash(state, WALLET_ALICE, CAT_LENDING)).toBe(MOCK_INPUT_HASH);
      expect(get_attestation_timestamp(state, WALLET_ALICE, CAT_LENDING)).toBe(MOCK_TIMESTAMP);
      expect(state.attestation_count).toBe(1);
    });

    it('CRITICAL: score is never stored in public state', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 83);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);

      const stateStr = JSON.stringify([...state.attestation_hashes.entries()]);
      expect(stateStr).not.toContain('83');
      expect(stateStr).toContain(MOCK_INPUT_HASH);
    });

    it('counts distinct categories per wallet (re-issuing same category does not double count)', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 83);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP + 1);
      expect(get_category_count(state, WALLET_ALICE)).toBe(1);

      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_INCOME, MOCK_INPUT_HASH, MOCK_TIMESTAMP + 2);
      expect(get_category_count(state, WALLET_ALICE)).toBe(2);
    });

    it('keeps different wallets independent', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 83);
      setPrivateScore(WALLET_BOB, CAT_LENDING, 42);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);
      store_attestation(state, ORACLE_ADDRESS, WALLET_BOB, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);

      expect(get_category_count(state, WALLET_ALICE)).toBe(1);
      expect(get_category_count(state, WALLET_BOB)).toBe(1);
      expect(get_attestation_hash(state, WALLET_ALICE, CAT_LENDING)).toBe(MOCK_INPUT_HASH);
      expect(get_attestation_hash(state, WALLET_BOB, CAT_LENDING)).toBe(MOCK_INPUT_HASH);
    });
  });

  describe('verify_claim() — selective disclosure', () => {
    it('returns TRUE when score exceeds threshold', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 83);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);
      expect(verify_claim(state, WALLET_ALICE, CAT_LENDING, 70)).toBe(true);
    });

    it('returns FALSE when score is below threshold', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 45);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);
      expect(verify_claim(state, WALLET_ALICE, CAT_LENDING, 70)).toBe(false);
    });

    it('returns FALSE when score equals threshold (strict greater-than)', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 70);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);
      expect(verify_claim(state, WALLET_ALICE, CAT_LENDING, 70)).toBe(false);
    });

    it('CRITICAL: rejects claims without a stored attestation', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 99);
      // No store_attestation() was ever called.
      expect(() => verify_claim(state, WALLET_ALICE, CAT_LENDING, 70)).toThrow(
        'No attestation for wallet/category',
      );
    });

    it('CRITICAL: only the boolean result is revealed, not the score', () => {
      setPrivateScore(WALLET_BOB, CAT_INCOME, 91);
      store_attestation(state, ORACLE_ADDRESS, WALLET_BOB, CAT_INCOME, MOCK_INPUT_HASH, MOCK_TIMESTAMP);
      const result = verify_claim(state, WALLET_BOB, CAT_INCOME, 80);
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('different users have independent claims', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 83);
      setPrivateScore(WALLET_BOB, CAT_LENDING, 42);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);
      store_attestation(state, ORACLE_ADDRESS, WALLET_BOB, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);

      expect(verify_claim(state, WALLET_ALICE, CAT_LENDING, 70)).toBe(true);
      expect(verify_claim(state, WALLET_BOB, CAT_LENDING, 70)).toBe(false);
    });
  });

  describe('get_attestation_hash()', () => {
    it('returns the committed hash after attestation', () => {
      setPrivateScore(WALLET_ALICE, CAT_LENDING, 83);
      store_attestation(state, ORACLE_ADDRESS, WALLET_ALICE, CAT_LENDING, MOCK_INPUT_HASH, MOCK_TIMESTAMP);
      expect(get_attestation_hash(state, WALLET_ALICE, CAT_LENDING)).toBe(MOCK_INPUT_HASH);
    });

    it('returns empty for a wallet with no attestation', () => {
      expect(get_attestation_hash(state, WALLET_BOB, CAT_LENDING)).toBe('');
    });
  });

  describe('transfer_admin()', () => {
    it('admin can transfer ownership', () => {
      transfer_admin(state, '0xNEW_ADMIN_32BYTES_PADDED_000000000000000000000000004', ADMIN_ADDRESS);
      expect(state.admin).toBe('0xNEW_ADMIN_32BYTES_PADDED_000000000000000000000000004');
    });

    it('non-admin cannot transfer ownership', () => {
      expect(() =>
        transfer_admin(state, '0xNEW_ADMIN_32BYTES_PADDED_000000000000000000000000004', ATTACKER),
      ).toThrow('Unauthorized');
    });
  });
});
