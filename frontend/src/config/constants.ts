import { env } from './environment';

/** Semver range of Midnight DApp Connector APIs this app supports. */
export const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

/** How often (ms) to poll `window.midnight` while waiting for a wallet extension. */
export const WALLET_DISCOVERY_POLL_INTERVAL_MS = 100;

/** Time budget (ms) to find a compatible wallet before giving up. */
export const WALLET_DISCOVERY_TIMEOUT_MS = 1_000;

/**
 * Time budget (ms) for the wallet extension to respond once a connection is
 * requested. Generous on purpose: Lace (and other wallets) open an approval
 * popup the user must click, so a short timeout makes the connect appear to
 * "never complete" and surface a misleading "not authorized" error.
 */
export const WALLET_CONNECT_TIMEOUT_MS = 60_000;

/**
 * Trust-attestation contract address to join (empty → deploy a fresh one).
 * Defaults to the deployed Preprod address; override via NEXT_PUBLIC_TRUST_ATTESTATION_ADDRESS.
 */
export const TRUST_ATTESTATION_ADDRESS =
  env.NEXT_PUBLIC_TRUST_ATTESTATION_ADDRESS || '4305d6f23951355cb76b75e1d25aea0dc9f892cd6649644dfc32b2d28870c3c7';
