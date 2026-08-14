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
 * Defaults to the deployed Preview address; override via NEXT_PUBLIC_TRUST_ATTESTATION_ADDRESS.
 */
export const TRUST_ATTESTATION_ADDRESS =
  env.NEXT_PUBLIC_TRUST_ATTESTATION_ADDRESS ||
  '5ed3ab3e808e43711ddab79a86e0d9e4ac1d8b36d5e01f62b13db98cf51f4953';
