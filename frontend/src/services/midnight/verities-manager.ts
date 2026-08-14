import { type ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { fromHex } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { networkId, TRUST_ATTESTATION_ADDRESS } from '../../config';
import { TrustAttestationContract, createVeritiesPrivateState } from '../../contracts';
import { logger } from '../../lib/logger';
import { initializeProviders, type VeritiesProviders } from './providers';
import { connectToWallet } from './wallet';

const PRIVATE_STATE_ID = 'veritiesPrivateState';

/** Converts a hex string (with or without 0x) to a 32-byte value. */
const toBytes32 = (hex: string): Uint8Array => {
  const raw = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = fromHex(raw);
  if (bytes.length === 32) return bytes;
  if (bytes.length > 32) return bytes.slice(0, 32);
  const out = new Uint8Array(32);
  out.set(bytes, 32 - bytes.length);
  return out;
};

/** Pads a category name to 16 bytes. */
const toBytes16 = (value: string): Uint8Array => {
  const bytes = new TextEncoder().encode(value);
  const out = new Uint8Array(16);
  out.set(bytes.slice(0, 16));
  return out;
};

export interface WalletConnection {
  readonly address: string;
}

/**
 * Browser-side manager for the Verities trust-attestation contract.
 *
 * Handles Lace wallet connect/disconnect, lazily joins (or deploys) the
 * contract, and exposes the privacy-preserving `verify_claim` circuit call.
 */
export class BrowserVeritiesManager {
  #connectedAPI?: ConnectedAPI;
  #providers?: VeritiesProviders;
  #deployed?: unknown;
  #address?: string;

  get isConnected(): boolean {
    return this.#connectedAPI !== undefined;
  }

  get address(): string | undefined {
    return this.#address;
  }

  /** Connects to the Lace wallet and initializes the browser providers. */
  async connect(): Promise<WalletConnection> {
    const api = await connectToWallet(logger, networkId);
    const addresses = await api.getShieldedAddresses();
    this.#connectedAPI = api;
    this.#address = addresses.shieldedCoinPublicKey;
    this.#providers = await initializeProviders(logger, api);
    return { address: this.#address };
  }

  /** Drops the current wallet connection and in-memory state. */
  disconnect(): void {
    this.#connectedAPI = undefined;
    this.#providers = undefined;
    this.#deployed = undefined;
    this.#address = undefined;
  }

  async #resolve(): Promise<any> {
    if (this.#deployed) return this.#deployed;
    if (!this.#providers) throw new Error('Not connected. Call connect() first.');

    // The score (83) lives only in the browser's private state — it is supplied as a
    // witness during proving and is never written to the ledger.
    const privateState = createVeritiesPrivateState(new Uint8Array(32), 83);

    if (TRUST_ATTESTATION_ADDRESS) {
      this.#deployed = await findDeployedContract(this.#providers as any, {
        contractAddress: TRUST_ATTESTATION_ADDRESS,
        compiledContract: TrustAttestationContract,
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: privateState,
      });
    } else {
      this.#deployed = await deployContract(this.#providers as any, {
        compiledContract: TrustAttestationContract,
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: privateState,
      });
    }
    return this.#deployed;
  }

  /**
   * The core privacy primitive: proves `score > threshold` and returns only the
   * boolean. The score itself is never disclosed.
   */
  async verifyClaim(category: string, threshold: number): Promise<boolean> {
    const deployed = await this.#resolve();
    const wallet = this.#address ? toBytes32(this.#address) : new Uint8Array(32);
    const txData = await deployed.callTx.verify_claim(wallet, toBytes16(category), BigInt(threshold));
    return txData.private.result;
  }

  /** Returns the number of distinct attestation categories for the connected wallet. */
  async getCategoryCount(): Promise<number> {
    const deployed = await this.#resolve();
    const wallet = this.#address ? toBytes32(this.#address) : new Uint8Array(32);
    const txData = await deployed.callTx.get_category_count(wallet);
    return Number(txData.private.result);
  }
}
