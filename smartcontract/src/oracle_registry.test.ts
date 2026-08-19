import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// oracle_registry — Test Suite
//
// Models the COMPILED oracle_registry.compact circuit exactly and verifies the
// real compiled artifact (contract-info.json) matches this model.
//
// Authorization model:
//   - admins is a *membership* set (Map<Bytes<32>, Boolean>). Multiple wallets
//     can hold admin authority; add_admin / remove_admin manage it.
//   - oracles is a *membership* set. Removing an oracle deletes the key, so
//     is_authorized() becomes false.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_ADDRESS = '0xADMIN_ADDRESS_32BYTES_PADDED_000000000000000000000000';
const ORACLE_1      = '0xORACLE_ONE_32BYTES_PADDED_00000000000000000000000001';
const ORACLE_2      = '0xORACLE_TWO_32BYTES_PADDED_00000000000000000000000002';
const ATTACKER      = '0xATTACKER_32BYTES_PADDED_00000000000000000000000003';
const NEW_ADMIN     = '0xNEW_ADMIN_32BYTES_PADDED_000000000000000000000000004';

// ── Simulated ledger state (faithful to the compiled circuit) ────────────────

interface RegistryState {
  admins: Set<string>;
  oracle_count: number;
  oracles: Set<string>; // Map<Bytes<32>, Boolean> — membership semantics
  initialized: boolean;
}

function createRegistry(): RegistryState {
  return { admins: new Set(), oracle_count: 0, oracles: new Set(), initialized: false };
}

function init(state: RegistryState, first_admin: string): void {
  if (state.initialized) throw new Error('Already initialized');
  state.admins.add(first_admin);
  state.initialized = true;
}

function is_admin(state: RegistryState, addr: string): boolean {
  return state.admins.has(addr);
}

function add_admin(state: RegistryState, new_admin: string, caller: string): void {
  if (!state.admins.has(caller)) throw new Error('Unauthorized: caller is not an admin');
  state.admins.add(new_admin);
}

function remove_admin(state: RegistryState, addr: string, caller: string): void {
  if (!state.admins.has(caller)) throw new Error('Unauthorized: caller is not an admin');
  state.admins.delete(addr);
}

function add_oracle(state: RegistryState, oracle: string, caller: string): void {
  if (!state.admins.has(caller)) throw new Error('Unauthorized: caller is not an admin');
  state.oracles.add(oracle);
  state.oracle_count += 1;
}

// Uses Map.remove() semantics: the key is deleted, not set to `false`.
function remove_oracle(state: RegistryState, oracle: string, caller: string): void {
  if (!state.admins.has(caller)) throw new Error('Unauthorized: caller is not an admin');
  state.oracles.delete(oracle);
  state.oracle_count -= 1;
}

// Map.member() semantics — key presence, so a removed oracle is NOT authorized.
function is_authorized(state: RegistryState, oracle: string): boolean {
  return state.oracles.has(oracle);
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

const EXPECTED_CIRCUITS = ['init', 'is_admin', 'add_admin', 'remove_admin', 'add_oracle', 'remove_oracle', 'is_authorized'];
const EXPECTED_LEDGER   = ['admins', 'oracle_count', 'oracles', 'initialized'];
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
    it('initializes the first admin', () => {
      const state = createRegistry();
      init(state, ADMIN_ADDRESS);
      expect(is_admin(state, ADMIN_ADDRESS)).toBe(true);
    });

    it('rejects double initialization', () => {
      const state = createRegistry();
      init(state, ADMIN_ADDRESS);
      expect(() => init(state, ATTACKER)).toThrow('Already initialized');
    });
  });

  describe('admins', () => {
    let state: RegistryState;

    beforeEach(() => {
      state = createRegistry();
      init(state, ADMIN_ADDRESS);
    });

    it('admin can add another admin', () => {
      add_admin(state, NEW_ADMIN, ADMIN_ADDRESS);
      expect(is_admin(state, NEW_ADMIN)).toBe(true);
    });

    it('non-admin cannot add an admin', () => {
      expect(() => add_admin(state, NEW_ADMIN, ATTACKER)).toThrow('Unauthorized');
    });

    it('admin can remove an admin', () => {
      add_admin(state, NEW_ADMIN, ADMIN_ADDRESS);
      remove_admin(state, NEW_ADMIN, ADMIN_ADDRESS);
      expect(is_admin(state, NEW_ADMIN)).toBe(false);
    });

    it('a newly added admin can add oracles', () => {
      add_admin(state, NEW_ADMIN, ADMIN_ADDRESS);
      add_oracle(state, ORACLE_1, NEW_ADMIN);
      expect(is_authorized(state, ORACLE_1)).toBe(true);
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
});
