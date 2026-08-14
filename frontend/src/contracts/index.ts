/*
 * Verities — compiled contract wrapper (browser build).
 */

import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

import * as TrustAttestation from './trust_attestation/contract/index.js';
import { type VeritiesPrivateState, createVeritiesPrivateState, trustAttestationWitnesses } from './witnesses';

export { type VeritiesPrivateState, createVeritiesPrivateState, trustAttestationWitnesses };

export const TrustAttestationContract = CompiledContract.make<
  TrustAttestation.Contract<VeritiesPrivateState>
>('TrustAttestation', TrustAttestation.Contract<VeritiesPrivateState>).pipe(
  CompiledContract.withWitnesses(trustAttestationWitnesses),
  CompiledContract.withCompiledFileAssets('./trust_attestation'),
);

/** Circuit names exported by the trust_attestation contract. */
export type VeritiesCircuitKeys =
  | 'init'
  | 'add_oracle'
  | 'remove_oracle'
  | 'is_authorized'
  | 'store_attestation'
  | 'verify_claim'
  | 'get_attestation_hash'
  | 'get_attestation_timestamp'
  | 'get_category_count'
  | 'transfer_admin';
