import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  caller_address(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  init(context: __compactRuntime.CircuitContext<PS>, new_admin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  add_oracle(context: __compactRuntime.CircuitContext<PS>,
             oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  remove_oracle(context: __compactRuntime.CircuitContext<PS>,
                oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  is_authorized(context: __compactRuntime.CircuitContext<PS>,
                oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  transfer_admin(context: __compactRuntime.CircuitContext<PS>,
                 new_admin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  init(context: __compactRuntime.CircuitContext<PS>, new_admin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  add_oracle(context: __compactRuntime.CircuitContext<PS>,
             oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  remove_oracle(context: __compactRuntime.CircuitContext<PS>,
                oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  is_authorized(context: __compactRuntime.CircuitContext<PS>,
                oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  transfer_admin(context: __compactRuntime.CircuitContext<PS>,
                 new_admin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  init(context: __compactRuntime.CircuitContext<PS>, new_admin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  add_oracle(context: __compactRuntime.CircuitContext<PS>,
             oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  remove_oracle(context: __compactRuntime.CircuitContext<PS>,
                oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  is_authorized(context: __compactRuntime.CircuitContext<PS>,
                oracle_address_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  transfer_admin(context: __compactRuntime.CircuitContext<PS>,
                 new_admin_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly admin: Uint8Array;
  readonly oracle_count: bigint;
  oracles: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  readonly initialized: boolean;
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
