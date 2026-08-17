import { type ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import {
  OracleRegistryContract,
  TrustAttestationContract,
  createVeritiesPrivateState,
  trustAttestationLedger,
} from '../../contracts';
import { logger } from '../../lib/logger';
import { initializeProviders, type VeritiesProviders } from './providers';
import { connectToWallet } from './wallet';

export type ContractName = 'oracle_registry' | 'trust_attestation';

const ORACLE_PRIVATE_STATE_ID = 'oracleRegistryPrivateState';
const TRUST_PRIVATE_STATE_ID = 'trustAttestationPrivateState';

/** Derives a deterministic 32-byte value from any address string (bech32 or hex). */
const toBytes32 = (value: string): Uint8Array => {
  const bytes = new TextEncoder().encode(value);
  const out = new Uint8Array(32);
  out.set(bytes.slice(0, 32));
  return out;
};

/** Pads a category name to 16 bytes. */
const toBytes16 = (value: string): Uint8Array => {
  const bytes = new TextEncoder().encode(value);
  const out = new Uint8Array(16);
  out.set(bytes.slice(0, 16));
  return out;
};

const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const bytesToString = (bytes: Uint8Array): string =>
  new TextDecoder().decode(bytes).replace(/\0+$/, '').trim();

const zkConfigPathFor = (name: ContractName): string =>
  name === 'trust_attestation' ? window.location.origin : `${window.location.origin}/contracts/oracle_registry`;

export interface WalletConnection {
  readonly address: string;
}

/**
 * Browser-side manager for the Verities contracts.
 *
 * Connects to a Midnight wallet (Lace or 1AM), deploys the two contracts via the
 * browser wallet (the wallet sponsors DUST), and exposes the privacy-preserving
 * `verify_claim` circuit call.
 */
export class BrowserVeritiesManager {
  #networkId: string;
  #trustAttestationAddress: string;
  #connectedAPI?: ConnectedAPI;
  #address?: string;
  #providersByContract = new Map<ContractName, VeritiesProviders>();
  #deployedByContract = new Map<ContractName, unknown>();

  constructor(networkId: string, trustAttestationAddress: string) {
    this.#networkId = networkId;
    this.#trustAttestationAddress = trustAttestationAddress;
  }

  get isConnected(): boolean {
    return this.#connectedAPI !== undefined;
  }

  get address(): string | undefined {
    return this.#address;
  }

  /** Connects to the wallet. */
  async connect(): Promise<WalletConnection> {
    const api = await connectToWallet(logger, this.#networkId);
    const addresses = await api.getShieldedAddresses();
    this.#connectedAPI = api;
    this.#address = addresses.shieldedCoinPublicKey;
    return { address: this.#address };
  }

  /** Drops the current wallet connection and in-memory state. */
  disconnect(): void {
    this.#connectedAPI = undefined;
    this.#providersByContract.clear();
    this.#deployedByContract.clear();
    this.#address = undefined;
  }

  async #getProviders(name: ContractName): Promise<VeritiesProviders> {
    if (!this.#connectedAPI) throw new Error('Not connected. Call connect() first.');
    const existing = this.#providersByContract.get(name);
    if (existing) return existing;
    const providers = await initializeProviders(logger, this.#connectedAPI, zkConfigPathFor(name));
    this.#providersByContract.set(name, providers);
    return providers;
  }

  /** Deploys a fresh contract (oracle_registry or trust_attestation) and returns its address. */
  async deploy(name: ContractName): Promise<string> {
    const providers = await this.#getProviders(name);
    const admin = this.#address ? toBytes32(this.#address) : new Uint8Array(32);
    const privateState = createVeritiesPrivateState(admin, 83);

    // Branched (rather than a union type) because the two contracts have
    // different witness sets, which a single CompiledContract union can't express.
    const deployed =
      name === 'oracle_registry'
        ? await deployContract(providers as any, {
            compiledContract: OracleRegistryContract,
            privateStateId: ORACLE_PRIVATE_STATE_ID,
            initialPrivateState: privateState,
          })
        : await deployContract(providers as any, {
            compiledContract: TrustAttestationContract,
            privateStateId: TRUST_PRIVATE_STATE_ID,
            initialPrivateState: privateState,
          });

    const address = deployed.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(address);
    await deployed.callTx.init(admin);
    this.#deployedByContract.set(name, deployed);
    return address;
  }

  /** Resolves (join or deploy) the trust_attestation contract. */
  async #resolveTrustAttestation(): Promise<any> {
    const existing = this.#deployedByContract.get('trust_attestation');
    if (existing) return existing;
    const providers = await this.#getProviders('trust_attestation');
    const admin = this.#address ? toBytes32(this.#address) : new Uint8Array(32);
    const privateState = createVeritiesPrivateState(admin, 83);

    let deployed: any;
    if (this.#trustAttestationAddress) {
      deployed = await findDeployedContract(providers as any, {
        contractAddress: this.#trustAttestationAddress,
        compiledContract: TrustAttestationContract,
        privateStateId: TRUST_PRIVATE_STATE_ID,
        initialPrivateState: privateState,
      });
    } else {
      deployed = await deployContract(providers as any, {
        compiledContract: TrustAttestationContract,
        privateStateId: TRUST_PRIVATE_STATE_ID,
        initialPrivateState: privateState,
      });
      await deployed.callTx.init(admin);
    }
    this.#deployedByContract.set('trust_attestation', deployed);
    return deployed;
  }

  /**
   * The core privacy primitive: proves `score > threshold` and returns only the
   * boolean. The score itself is never disclosed.
   */
  async verifyClaim(category: string, threshold: number): Promise<boolean> {
    const deployed = await this.#resolveTrustAttestation();
    const wallet = this.#address ? toBytes32(this.#address) : new Uint8Array(32);
    const txData = await deployed.callTx.verify_claim(wallet, toBytes16(category), BigInt(threshold));
    return txData.private.result;
  }

  /**
   * Admin action: attests another wallet for a category. Ensures the caller (admin)
   * is a whitelisted oracle, then stores the target's attestation on-chain.
   */
  async attestWallet(walletAddress: string, category: string): Promise<void> {
    const deployed = await this.#resolveTrustAttestation();
    const caller = this.#address ? toBytes32(this.#address) : new Uint8Array(32);
    const target = toBytes32(walletAddress);
    const inputHash = toBytes32('verities-demo-attestation');
    const timestamp = BigInt(Math.floor(Date.now() / 1000));

    // Whitelist the caller (admin) as an oracle, then attest the target wallet.
    await deployed.callTx.add_oracle(caller);
    await deployed.callTx.store_attestation(target, toBytes16(category), inputHash, timestamp);
  }

  /**
   * Prove with a graceful fallback: verifies an existing attestation, or (if the
   * wallet is the admin and has none yet) self-attests first, then verifies.
   * A non-admin without an attestation gets a clear error.
   */
  async proveOrSelfAttest(category: string, threshold: number): Promise<boolean> {
    try {
      return await this.verifyClaim(category, threshold);
    } catch {
      if (this.#address) {
        await this.attestWallet(this.#address, category);
        return await this.verifyClaim(category, threshold);
      }
      throw new Error('No attestation yet — ask an oracle (admin) to attest this wallet first.');
    }
  }

  /** Returns the number of distinct attestation categories for the connected wallet. */
  async getCategoryCount(): Promise<number> {
    const deployed = await this.#resolveTrustAttestation();
    const wallet = this.#address ? toBytes32(this.#address) : new Uint8Array(32);
    const txData = await deployed.callTx.get_category_count(wallet);
    return Number(txData.private.result);
  }

  /** Reads the connected wallet's attestations (category, timestamp, commitment hash) from the ledger. */
  async getAttestations(): Promise<Array<{ category: string; timestamp: number; hash: Uint8Array }>> {
    if (!this.#trustAttestationAddress) return [];
    const providers = await this.#getProviders('trust_attestation');
    const state = await providers.publicDataProvider.queryContractState(this.#trustAttestationAddress);
    if (!state) return [];
    const ledger = trustAttestationLedger(state.data);
    const wallet = this.#address ? toBytes32(this.#address) : new Uint8Array(32);
    const out: Array<{ category: string; timestamp: number; hash: Uint8Array }> = [];
    for (const [key, hash] of ledger.attestation_hashes) {
      if (bytesEqual(key.subject, wallet)) {
        const ts = ledger.attestation_timestamps.lookup(key);
        out.push({ category: bytesToString(key.category), timestamp: Number(ts), hash });
      }
    }
    return out.sort((a, b) => b.timestamp - a.timestamp);
  }

  // ── Admin functions ────────────────────────────────────────────────────────

  /** Reads the contract's on-chain `admin` (32 bytes), or `null` if not deployed/queryable. */
  async getAdmin(): Promise<Uint8Array | null> {
    if (!this.#trustAttestationAddress) return null;
    const providers = await this.#getProviders('trust_attestation');
    const state = await providers.publicDataProvider.queryContractState(this.#trustAttestationAddress);
    if (!state) return null;
    return trustAttestationLedger(state.data).admin;
  }

  /** True if the connected wallet is the contract admin (the deployer). */
  async isAdmin(): Promise<boolean> {
    if (!this.#address) return false;
    const admin = await this.getAdmin();
    if (!admin) return false;
    const mine = toBytes32(this.#address);
    return admin.length === mine.length && admin.every((b, i) => b === mine[i]);
  }

  /** Adds an oracle to the trust_attestation whitelist. Admin only. */
  async addOracle(oracleAddress: string): Promise<void> {
    const deployed = await this.#resolveTrustAttestation();
    await deployed.callTx.add_oracle(toBytes32(oracleAddress));
  }

  /** Removes an oracle from the trust_attestation whitelist. Admin only. */
  async removeOracle(oracleAddress: string): Promise<void> {
    const deployed = await this.#resolveTrustAttestation();
    await deployed.callTx.remove_oracle(toBytes32(oracleAddress));
  }

  /** Transfers the trust_attestation admin to a new wallet address. Admin only. */
  async transferAdmin(newAddress: string): Promise<void> {
    const deployed = await this.#resolveTrustAttestation();
    await deployed.callTx.transfer_admin(toBytes32(newAddress));
  }
}
