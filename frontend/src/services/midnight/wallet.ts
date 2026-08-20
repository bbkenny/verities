import { ConnectedAPI, type InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import semver from 'semver';
import { catchError, concatMap, filter, firstValueFrom, interval, map, take, tap, throwError, timeout } from 'rxjs';
import { pipe as fnPipe } from 'fp-ts/function';
import { type Logger } from 'pino';
import {
  COMPATIBLE_CONNECTOR_API_VERSION,
  WALLET_CONNECT_TIMEOUT_MS,
  WALLET_DISCOVERY_POLL_INTERVAL_MS,
  WALLET_DISCOVERY_TIMEOUT_MS,
} from '../../config';

const isCompatible = (wallet: unknown): wallet is InitialAPI =>
  !!wallet &&
  typeof wallet === 'object' &&
  'apiVersion' in wallet &&
  semver.satisfies((wallet as InitialAPI).apiVersion, COMPATIBLE_CONNECTOR_API_VERSION);

/** All browser-injected wallets whose connector API is compatible with this app. */
const getCompatibleWallets = (): InitialAPI[] => {
  if (typeof window === 'undefined' || !window.midnight) return [];
  return Object.values(window.midnight).filter(isCompatible);
};

export interface WalletOption {
  readonly rdns: string;
  readonly name: string;
}

/** Lists the compatible wallets (e.g. Lace, 1AM) so the user can choose. */
export const listCompatibleWallets = (): WalletOption[] =>
  getCompatibleWallets().map((w) => ({ rdns: w.rdns, name: w.name }));

/**
 * Polls `window.midnight` for compatible wallets, giving slowly-registering
 * extensions (e.g. Lace, which often populates a beat after 1AM) time to appear
 * before we decide whether to show a chooser.
 *
 * Resolves once the wallet count stabilises for a short grace window (in case a
 * second wallet registers right after the first) or the deadline passes.
 */
export const discoverWallets = (timeoutMs = 2_500, graceMs = 500): Promise<WalletOption[]> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.midnight) {
      resolve([]);
      return;
    }
    const deadline = Date.now() + timeoutMs;
    let lastCount = -1;
    let graceTimer: ReturnType<typeof setTimeout> | undefined;
    const settle = (wallets: WalletOption[]) => resolve(wallets);
    const tick = () => {
      const wallets = getCompatibleWallets().map((w) => ({ rdns: w.rdns, name: w.name }));
      if (wallets.length > lastCount) {
        lastCount = wallets.length;
        if (graceTimer) clearTimeout(graceTimer);
        // Once at least one wallet is present, wait briefly for any others.
        if (wallets.length > 0) {
          graceTimer = setTimeout(() => settle(wallets), graceMs);
          return;
        }
      }
      if (Date.now() >= deadline) {
        settle(wallets);
        return;
      }
      setTimeout(tick, WALLET_DISCOVERY_POLL_INTERVAL_MS);
    };
    tick();
  });

const pickWallet = (rdns?: string): InitialAPI | undefined => {
  const wallets = getCompatibleWallets();
  if (rdns) return wallets.find((w) => w.rdns === rdns);
  return wallets[0];
};

/**
 * Discovers a compatible Midnight wallet extension (e.g. Lace, 1AM) and connects to it.
 * Pass `rdns` to select a specific wallet when more than one is installed.
 */
export const connectToWallet = (logger: Logger, networkId: string, rdns?: string): Promise<ConnectedAPI> =>
  firstValueFrom(
    fnPipe(
      interval(WALLET_DISCOVERY_POLL_INTERVAL_MS),
      map(() => pickWallet(rdns)),
      tap((connectorAPI) => logger.trace(connectorAPI, 'Checking for wallet connector API')),
      filter((connectorAPI): connectorAPI is InitialAPI => !!connectorAPI),
      tap((connectorAPI) => logger.info(connectorAPI, 'Compatible wallet connector API found. Connecting.')),
      take(1),
      timeout({
        first: WALLET_DISCOVERY_TIMEOUT_MS,
        with: () =>
          throwError(() => {
            logger.error('Could not find wallet connector API');
            return new Error('Could not find a Midnight wallet. Is the extension installed?');
          }),
      }),
      concatMap(async (initialAPI) => {
        const connectedAPI = await initialAPI.connect(networkId);
        const connectionStatus = await connectedAPI.getConnectionStatus();
        logger.info(connectionStatus, 'Wallet connector API enabled status');
        return connectedAPI;
      }),
      timeout({
        first: WALLET_CONNECT_TIMEOUT_MS,
        with: () =>
          throwError(() => {
            logger.error('Wallet connector API failed to respond');
            return new Error('The Midnight wallet failed to respond. Is the extension enabled?');
          }),
      }),
      catchError((error, apis) =>
        error
          ? throwError(() => {
              logger.error({ error }, 'Unable to enable connector API');
              return new Error('Application is not authorized by the wallet.');
            })
          : apis,
      ),
    ),
  );
