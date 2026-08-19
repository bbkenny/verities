import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  caller_address(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  private_score(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  init(context: __compactRuntime.CircuitContext<PS>, first_admin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  is_admin(context: __compactRuntime.CircuitContext<PS>, addr_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  add_admin(context: __compactRuntime.CircuitContext<PS>,
            new_admin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  remove_admin(context: __compactRuntime.CircuitContext<PS>, addr_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  add_oracle(context: __compactRuntime.CircuitContext<PS>,
             oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  remove_oracle(context: __compactRuntime.CircuitContext<PS>,
                oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  is_authorized(context: __compactRuntime.CircuitContext<PS>,
                oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  store_attestation(context: __compactRuntime.CircuitContext<PS>,
                    wallet_0: Uint8Array,
                    category_0: Uint8Array,
                    input_hash_0: Uint8Array,
                    timestamp_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verify_claim(context: __compactRuntime.CircuitContext<PS>,
               wallet_0: Uint8Array,
               category_0: Uint8Array,
               threshold_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  get_attestation_hash(context: __compactRuntime.CircuitContext<PS>,
                       wallet_0: Uint8Array,
                       category_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  get_attestation_timestamp(context: __compactRuntime.CircuitContext<PS>,
                            wallet_0: Uint8Array,
                            category_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  get_category_count(context: __compactRuntime.CircuitContext<PS>,
                     wallet_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
}

export type ProvableCircuits<PS> = {
  init(context: __compactRuntime.CircuitContext<PS>, first_admin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  is_admin(context: __compactRuntime.CircuitContext<PS>, addr_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  add_admin(context: __compactRuntime.CircuitContext<PS>,
            new_admin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  remove_admin(context: __compactRuntime.CircuitContext<PS>, addr_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  add_oracle(context: __compactRuntime.CircuitContext<PS>,
             oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  remove_oracle(context: __compactRuntime.CircuitContext<PS>,
                oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  is_authorized(context: __compactRuntime.CircuitContext<PS>,
                oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  store_attestation(context: __compactRuntime.CircuitContext<PS>,
                    wallet_0: Uint8Array,
                    category_0: Uint8Array,
                    input_hash_0: Uint8Array,
                    timestamp_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verify_claim(context: __compactRuntime.CircuitContext<PS>,
               wallet_0: Uint8Array,
               category_0: Uint8Array,
               threshold_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  get_attestation_hash(context: __compactRuntime.CircuitContext<PS>,
                       wallet_0: Uint8Array,
                       category_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  get_attestation_timestamp(context: __compactRuntime.CircuitContext<PS>,
                            wallet_0: Uint8Array,
                            category_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  get_category_count(context: __compactRuntime.CircuitContext<PS>,
                     wallet_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  init(context: __compactRuntime.CircuitContext<PS>, first_admin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  is_admin(context: __compactRuntime.CircuitContext<PS>, addr_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  add_admin(context: __compactRuntime.CircuitContext<PS>,
            new_admin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  remove_admin(context: __compactRuntime.CircuitContext<PS>, addr_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  add_oracle(context: __compactRuntime.CircuitContext<PS>,
             oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  remove_oracle(context: __compactRuntime.CircuitContext<PS>,
                oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  is_authorized(context: __compactRuntime.CircuitContext<PS>,
                oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  store_attestation(context: __compactRuntime.CircuitContext<PS>,
                    wallet_0: Uint8Array,
                    category_0: Uint8Array,
                    input_hash_0: Uint8Array,
                    timestamp_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  verify_claim(context: __compactRuntime.CircuitContext<PS>,
               wallet_0: Uint8Array,
               category_0: Uint8Array,
               threshold_0: bigint): __compactRuntime.CircuitResults<PS, boolean>;
  get_attestation_hash(context: __compactRuntime.CircuitContext<PS>,
                       wallet_0: Uint8Array,
                       category_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  get_attestation_timestamp(context: __compactRuntime.CircuitContext<PS>,
                            wallet_0: Uint8Array,
                            category_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
  get_category_count(context: __compactRuntime.CircuitContext<PS>,
                     wallet_0: Uint8Array): __compactRuntime.CircuitResults<PS, bigint>;
}

export type Ledger = {
  admins: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  readonly initialized: boolean;
  readonly oracle_count: bigint;
  oracles: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  readonly attestation_count: bigint;
  attestation_hashes: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: { subject: Uint8Array, category: Uint8Array }): boolean;
    lookup(key_0: { subject: Uint8Array, category: Uint8Array }): Uint8Array;
    [Symbol.iterator](): Iterator<[{ subject: Uint8Array, category: Uint8Array }, Uint8Array]>
  };
  attestation_timestamps: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: { subject: Uint8Array, category: Uint8Array }): boolean;
    lookup(key_0: { subject: Uint8Array, category: Uint8Array }): bigint;
    [Symbol.iterator](): Iterator<[{ subject: Uint8Array, category: Uint8Array }, bigint]>
  };
  category_count: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
