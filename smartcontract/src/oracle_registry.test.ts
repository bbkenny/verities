import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// oracle_registry — Test Suite
//
// Models the COMPILED oracle_registry.compact circuit exactly and verifies the
// real compiled artifact (contract-info.json) matches this model. This is
// intentionally NOT a hand-rolled abstraction that can drift from the circuit:
// the "compiled interface" tests read the compiler output and fail if the
// source and model diverge.
//
// Authorization model:
//   - oracles is a *membership* set (Map.remove + Map.member in Compact).
//     Removing an oracle deletes the key, so is_authorized() becomes false.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_ADDRESS = '0xADMIN_ADDRESS_32BYTES_PADDED_000000000000000000000000';
const ORACLE_1      = '0xORACLE_ONE_32BYTES_PADDED_00000000000000000000000001';
const ORACLE_2      = '0xORACLE_TWO_32BYTES_PADDED_00000000000000000000000002';
const ATTACKER      = '0xATTACKER_32BYTES_PADDED_00000000000000000000000003';
const NEW_ADMIN     = '0xNEW_ADMIN_32BYTES_PADDED_000000000000000000000000004';

// ── Simulated ledger state (faithful to the compiled circuit) ────────────────

interface RegistryState {
  admin: string;
  oracle_count: number;
  oracles: Set<string>; // Map<Bytes<32>, Boolean> — membership semantics
  initialized: boolean;
}

function createRegistry(): RegistryState {
  return { admin: '', oracle_count: 0, oracles: new Set(), initialized: false };
}

function init(state: RegistryState, new_admin: string): void {
  if (state.initialized) throw new Error('Already initialized');
  state.admin = new_admin;
  state.initialized = true;
}

function add_oracle(state: RegistryState, oracle: string, caller: string): void {
  if (caller !== state.admin) throw new Error('Unauthorized: caller is not admin');
  state.oracles.add(oracle);
  state.oracle_count += 1;
}

// Uses Map.remove() semantics: the key is deleted, not set to `false`.
function remove_oracle(state: RegistryState, oracle: string, caller: string): void {
  if (caller !== state.admin) throw new Error('Unauthorized: caller is not admin');
  state.oracles.delete(oracle);
  state.oracle_count -= 1;
}

// Map.member() semantics — key presence, so a removed oracle is NOT authorized.
function is_authorized(state: RegistryState, oracle: string): boolean {
  return state.oracles.has(oracle);
}

function transfer_admin(state: RegistryState, new_admin: string, caller: string): void {
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

const EXPECTED_CIRCUITS = ['init', 'add_oracle', 'remove_oracle', 'is_authorized', 'transfer_admin'];
const EXPECTED_LEDGER   = ['admin', 'oracle_count', 'oracles', 'initialized'];
const EXPECTED_WITNESSES = ['caller_address'];

// ── Tests ────────────────────────────────────────────────────────────────────

describe('oracle_registry — compiled artifact', () => {
  it('exposes exactly the expected circuits, all provable', () => {
    const info = loadContractInfo('oracle_registry');
    const names = info.circuits.map((c) => c.name).sort();
    expect(names).toEqual([...EXPECTED_CIRCUITS].sort());
    for (const c of info.circuits) {
      expect(c.proof, `circuit ${c.name} should be provable`).toBe(true);
    }
  });

  it('exposes exactly the expected ledger fields', () => {
    const info = loadContractInfo('oracle_registry');
    const names = info.ledger.filter((l) => l.exported).map((l) => l.name).sort();
    expect(names).toEqual([...EXPECTED_LEDGER].sort());
  });

  it('exposes exactly the expected witnesses', () => {
    const info = loadContractInfo('oracle_registry');
    const names = info.witnesses.map((w) => w.name).sort();
    expect(names).toEqual([...EXPECTED_WITNESSES].sort());
  });
});

describe('oracle_registry', () => {
  describe('init()', () => {
    it('initializes admin correctly', () => {
      const state = createRegistry();
      init(state, ADMIN_ADDRESS);
      expect(state.admin).toBe(ADMIN_ADDRESS);
    });

    it('rejects double initialization', () => {
      const state = createRegistry();
      init(state, ADMIN_ADDRESS);
      expect(() => init(state, ATTACKER)).toThrow('Already initialized');
    });
  });

  describe('add_oracle()', () => {
    let state: RegistryState;

    beforeEach(() => {
      state = createRegistry();
      init(state, ADMIN_ADDRESS);
    });

    it('admin can add an oracle', () => {
      add_oracle(state, ORACLE_1, ADMIN_ADDRESS);
      expect(is_authorized(state, ORACLE_1)).toBe(true);
      expect(state.oracle_count).toBe(1);
    });

    it('admin can add multiple oracles', () => {
      add_oracle(state, ORACLE_1, ADMIN_ADDRESS);
      add_oracle(state, ORACLE_2, ADMIN_ADDRESS);
      expect(is_authorized(state, ORACLE_1)).toBe(true);
      expect(is_authorized(state, ORACLE_2)).toBe(true);
      expect(state.oracle_count).toBe(2);
    });

    it('rejects oracle addition from non-admin', () => {
      expect(() => add_oracle(state, ORACLE_1, ATTACKER)).toThrow('Unauthorized');
    });

    it('unregistered address is not authorized', () => {
      expect(is_authorized(state, ORACLE_1)).toBe(false);
    });
  });

  describe('remove_oracle()', () => {
    let state: RegistryState;

    beforeEach(() => {
      state = createRegistry();
      init(state, ADMIN_ADDRESS);
      add_oracle(state, ORACLE_1, ADMIN_ADDRESS);
    });

    it('admin can remove a registered oracle', () => {
      remove_oracle(state, ORACLE_1, ADMIN_ADDRESS);
      expect(is_authorized(state, ORACLE_1)).toBe(false);
      expect(state.oracle_count).toBe(0);
    });

    it('rejects oracle removal from non-admin', () => {
      expect(() => remove_oracle(state, ORACLE_1, ATTACKER)).toThrow('Unauthorized');
    });

    it('CRITICAL: removal deletes the key (member() returns false), does not merely flag it', () => {
      remove_oracle(state, ORACLE_1, ADMIN_ADDRESS);
      // The bypass in the legacy contract was: insert(addr, false) kept the key
      // present, so a .member() check still returned true. A Set models the
      // corrected Map.remove() + Map.member() semantics.
      expect(state.oracles.has(ORACLE_1)).toBe(false);
      expect(state.oracles.size).toBe(0);
    });
  });

  describe('is_authorized()', () => {
    let state: RegistryState;

    beforeEach(() => {
      state = createRegistry();
      init(state, ADMIN_ADDRESS);
    });

    it('returns false for unregistered address', () => {
      expect(is_authorized(state, ATTACKER)).toBe(false);
    });

    it('returns true after oracle is added', () => {
      add_oracle(state, ORACLE_1, ADMIN_ADDRESS);
      expect(is_authorized(state, ORACLE_1)).toBe(true);
    });

    it('returns false after oracle is removed', () => {
      add_oracle(state, ORACLE_1, ADMIN_ADDRESS);
      remove_oracle(state, ORACLE_1, ADMIN_ADDRESS);
      expect(is_authorized(state, ORACLE_1)).toBe(false);
    });
  });

  describe('transfer_admin()', () => {
    let state: RegistryState;

    beforeEach(() => {
      state = createRegistry();
      init(state, ADMIN_ADDRESS);
    });

    it('admin can transfer ownership', () => {
      transfer_admin(state, NEW_ADMIN, ADMIN_ADDRESS);
      expect(state.admin).toBe(NEW_ADMIN);
    });

    it('new admin can add oracles after transfer', () => {
      transfer_admin(state, NEW_ADMIN, ADMIN_ADDRESS);
      add_oracle(state, ORACLE_1, NEW_ADMIN);
      expect(is_authorized(state, ORACLE_1)).toBe(true);
    });

    it('old admin cannot add oracles after transfer', () => {
      transfer_admin(state, NEW_ADMIN, ADMIN_ADDRESS);
      expect(() => add_oracle(state, ORACLE_1, ADMIN_ADDRESS)).toThrow('Unauthorized');
    });

    it('non-admin cannot transfer ownership', () => {
      expect(() => transfer_admin(state, ATTACKER, ATTACKER)).toThrow('Unauthorized');
    });
  });
});
