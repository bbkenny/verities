/*
 * Verities — private state and witness definitions (browser build).
 */

import { WitnessContext } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import type { Ledger as TrustAttestationLedger } from './trust_attestation/contract/index.js';

export type VeritiesPrivateState = {
  readonly callerAddress: Uint8Array;
  readonly score: number; // Uint<8> (0-100)
};

export const createVeritiesPrivateState = (callerAddress: Uint8Array, score = 0): VeritiesPrivateState => ({
  callerAddress,
  score,
});

export const trustAttestationWitnesses = {
  caller_address: ({
    privateState,
  }: WitnessContext<TrustAttestationLedger, VeritiesPrivateState>): [VeritiesPrivateState, Uint8Array] => [
    privateState,
    privateState.callerAddress,
  ],
  private_score: ({
    privateState,
  }: WitnessContext<TrustAttestationLedger, VeritiesPrivateState>): [VeritiesPrivateState, bigint] => [
    privateState,
    BigInt(privateState.score),
  ],
};
