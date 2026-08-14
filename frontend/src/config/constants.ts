import { env } from './environment';

/** Semver range of Midnight DApp Connector APIs this app supports. */
export const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

/** How often (ms) to poll `window.midnight` while waiting for a wallet extension. */
export const WALLET_DISCOVERY_POLL_INTERVAL_MS = 100;

/** Time budget (ms) to find a compatible wallet before giving up. */
export const WALLET_DISCOVERY_TIMEOUT_MS = 1_000;

/** Time budget (ms) for the wallet extension to respond once a connection is requested. */
export const WALLET_CONNECT_TIMEOUT_MS = 5_000;

/**
 * Trust-attestation contract address to join (empty → deploy a fresh one).
 * Defaults to the deployed Preprod address; override via NEXT_PUBLIC_TRUST_ATTESTATION_ADDRESS.
 */
export const TRUST_ATTESTATION_ADDRESS =
  env.NEXT_PUBLIC_TRUST_ATTESTATION_ADDRESS || '6f61012d8a550cd813f96e5ddec88c858b906e90f8deeee909ebd05e1a8b9a75';
