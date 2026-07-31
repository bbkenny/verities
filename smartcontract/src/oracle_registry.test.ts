import { describe, it, expect, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// oracle_registry — Test Suite
//
// Tests the core authorization logic: add/remove oracles,
// admin gating, unauthorized access rejection, ownership transfer.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_ADDRESS    = '0xADMIN_ADDRESS_32BYTES_PADDED_000000000000000000000000';
const ORACLE_1         = '0xORACLE_ONE_32BYTES_PADDED_00000000000000000000000001';
const ORACLE_2         = '0xORACLE_TWO_32BYTES_PADDED_00000000000000000000000002';
const ATTACKER         = '0xATTACKER_32BYTES_PADDED_00000000000000000000000003';
const NEW_ADMIN        = '0xNEW_ADMIN_32BYTES_PADDED_000000000000000000000000004';

// Simulated ledger state
interface RegistryState {
  admin: string;
  oracle_count: number;
  oracles: Record<string, number>;
  initialized: boolean;
}

function createRegistry(): RegistryState {
  return { admin: '', oracle_count: 0, oracles: {}, initialized: false };
}

function init(state: RegistryState, new_admin: string, caller: string): void {
  if (state.initialized) throw new Error('Already initialized');
  state.admin = new_admin;
  state.initialized = true;
}

function add_oracle(state: RegistryState, oracle: string, caller: string): void {
  if (caller !== state.admin) throw new Error('Unauthorized: caller is not admin');
  state.oracles[oracle] = 1;
  state.oracle_count += 1;
}

function remove_oracle(state: RegistryState, oracle: string, caller: string): void {
  if (caller !== state.admin) throw new Error('Unauthorized: caller is not admin');
  state.oracles[oracle] = 0;
  state.oracle_count -= 1;
}

function is_authorized(state: RegistryState, oracle: string): boolean {
  return (state.oracles[oracle] ?? 0) === 1;
}

function transfer_admin(state: RegistryState, new_admin: string, caller: string): void {
  if (caller !== state.admin) throw new Error('Unauthorized: caller is not admin');
  state.admin = new_admin;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('oracle_registry', () => {

  describe('init()', () => {
    it('initializes admin correctly', () => {
      const state = createRegistry();
      init(state, ADMIN_ADDRESS, ADMIN_ADDRESS);
      expect(state.admin).toBe(ADMIN_ADDRESS);
    });

    it('rejects double initialization', () => {
      const state = createRegistry();
      init(state, ADMIN_ADDRESS, ADMIN_ADDRESS);
      expect(() => init(state, ATTACKER, ATTACKER)).toThrow('Already initialized');
    });
  });

  describe('add_oracle()', () => {
    let state: RegistryState;

    beforeEach(() => {
      state = createRegistry();
      init(state, ADMIN_ADDRESS, ADMIN_ADDRESS);
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
      init(state, ADMIN_ADDRESS, ADMIN_ADDRESS);
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
  });

  describe('is_authorized()', () => {
    let state: RegistryState;

    beforeEach(() => {
      state = createRegistry();
      init(state, ADMIN_ADDRESS, ADMIN_ADDRESS);
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
      init(state, ADMIN_ADDRESS, ADMIN_ADDRESS);
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
