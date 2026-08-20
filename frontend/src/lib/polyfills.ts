import { Buffer } from 'buffer';

/**
 * The Midnight SDK (and some transitive deps, e.g. Apollo Client) expect a Node-like
 * global environment even in the browser. Import once, before any Midnight SDK code runs.
 */
export const installBrowserPolyfills = (): void => {
  if (typeof window === 'undefined') return;

  if (!('Buffer' in window)) {
    // @ts-expect-error -- Buffer isn't part of DOM lib types, but third-party libs expect it globally.
    window.Buffer = Buffer;
  }
  if (!('process' in window)) {
    // @ts-expect-error -- minimal process shim; third-party libs only read process.env.NODE_ENV.
    window.process = { env: { NODE_ENV: process.env.NODE_ENV } };
  }

  // Some wallet extensions (e.g. Lace, MetaMask) define `window.ethereum` as a
  // getter-only property. Other Midnight connector code may later assign
  // `window.ethereum`, which throws "Cannot set property ethereum ... which has
  // only a getter" and can break wallet connector registration. If it is still
  // configurable we make it reassignable before the Midnight SDK runs.
  try {
    const desc = Object.getOwnPropertyDescriptor(window, 'ethereum');
    if (desc && desc.get && !desc.set && desc.configurable) {
      Object.defineProperty(window, 'ethereum', {
        configurable: true,
        enumerable: desc.enumerable,
        writable: true,
        // @ts-expect-error -- capturing the current getter value to drop the getter.
        value: window.ethereum,
      });
    }
  } catch {
    // ignore — defensive shim only; non-fatal if it can't be applied.
  }
};
