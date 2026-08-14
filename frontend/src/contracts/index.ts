/*
 * Verities — compiled contract wrappers (browser build).
 */

import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

import * as OracleRegistry from './oracle_registry/contract/index.js';
import * as TrustAttestation from './trust_attestation/contract/index.js';
import {
  type VeritiesPrivateState,
  createVeritiesPrivateState,
  oracleRegistryWitnesses,
  trustAttestationWitnesses,
} from './witnesses';

export {
  type VeritiesPrivateState,
  createVeritiesPrivateState,
  oracleRegistryWitnesses,
  trustAttestationWitnesses,
};

export { ledger as trustAttestationLedger } from './trust_attestation/contract/index.js';
export { ledger as oracleRegistryLedger } from './oracle_registry/contract/index.js';

export const OracleRegistryContract = CompiledContract.make<
  OracleRegistry.Contract<VeritiesPrivateState>
>('OracleRegistry', OracleRegistry.Contract<VeritiesPrivateState>).pipe(
  CompiledContract.withWitnesses(oracleRegistryWitnesses),
  CompiledContract.withCompiledFileAssets('./oracle_registry'),
);

export const TrustAttestationContract = CompiledContract.make<
  TrustAttestation.Contract<VeritiesPrivateState>
>('TrustAttestation', TrustAttestation.Contract<VeritiesPrivateState>).pipe(
  CompiledContract.withWitnesses(trustAttestationWitnesses),
  CompiledContract.withCompiledFileAssets('./trust_attestation'),
);

/** Circuit names exported by the oracle_registry contract. */
export type OracleRegistryCircuitKeys =
  | 'init'
  | 'add_oracle'
  | 'remove_oracle'
  | 'is_authorized'
  | 'transfer_admin';

/** Circuit names exported by the trust_attestation contract. */
export type VeritiesCircuitKeys =
  | OracleRegistryCircuitKeys
  | 'store_attestation'
  | 'verify_claim'
  | 'get_attestation_hash'
  | 'get_attestation_timestamp'
  | 'get_category_count';
