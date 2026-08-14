import { type ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { networkId, TRUST_ATTESTATION_ADDRESS } from '../../config';
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
  #connectedAPI?: ConnectedAPI;
  #address?: string;
  #providersByContract = new Map<ContractName, VeritiesProviders>();
  #deployedByContract = new Map<ContractName, unknown>();

  get isConnected(): boolean {
    return this.#connectedAPI !== undefined;
  }

  get address(): string | undefined {
    return this.#address;
  }

  /** Connects to the wallet. */
  async connect(): Promise<WalletConnection> {
    const api = await connectToWallet(logger, networkId);
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
    if (TRUST_ATTESTATION_ADDRESS) {
      deployed = await findDeployedContract(providers as any, {
        contractAddress: TRUST_ATTESTATION_ADDRESS,
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
   * Full privacy demo: whitelist the connected wallet as an oracle, store a
   * self-attestation, then prove `score > threshold` — revealing only YES/NO.
   */
  async selfAttestAndVerify(category: string, threshold: number): Promise<boolean> {
    const deployed = await this.#resolveTrustAttestation();
    const wallet = this.#address ? toBytes32(this.#address) : new Uint8Array(32);
    const categoryBytes = toBytes16(category);

    // 1. Whitelist the connected wallet as an oracle (it is also the admin).
    await deployed.callTx.add_oracle(wallet);

    // 2. Store a self-attestation: a commitment (hash) + timestamp. The score is
    //    kept in the browser's private state and never written to the ledger.
    const inputHash = toBytes32('verities-demo-attestation');
    const timestamp = BigInt(Math.floor(Date.now() / 1000));
    await deployed.callTx.store_attestation(wallet, categoryBytes, inputHash, timestamp);

    // 3. Prove: `score > threshold` returns only a boolean. The score (83) stays private.
    const txData = await deployed.callTx.verify_claim(wallet, categoryBytes, BigInt(threshold));
    return txData.private.result;
  }

  /** Returns the number of distinct attestation categories for the connected wallet. */
  async getCategoryCount(): Promise<number> {
    const deployed = await this.#resolveTrustAttestation();
    const wallet = this.#address ? toBytes32(this.#address) : new Uint8Array(32);
    const txData = await deployed.callTx.get_category_count(wallet);
    return Number(txData.private.result);
  }

  // ── Admin functions ────────────────────────────────────────────────────────

  /** Reads the contract's on-chain `admin` (32 bytes), or `null` if not deployed/queryable. */
  async getAdmin(): Promise<Uint8Array | null> {
    if (!TRUST_ATTESTATION_ADDRESS) return null;
    const providers = await this.#getProviders('trust_attestation');
    const state = await providers.publicDataProvider.queryContractState(TRUST_ATTESTATION_ADDRESS);
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
