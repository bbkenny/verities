const KEY = 'verities-wallet-names';

/** Maps a wallet address to a user-chosen display name (localStorage, client-side only). */
export const getWalletName = (address: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const map = JSON.parse(window.localStorage.getItem(KEY) ?? '{}') as Record<string, string>;
    return map[address];
  } catch {
    return undefined;
  }
};

export const setWalletName = (address: string, name: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const map = JSON.parse(window.localStorage.getItem(KEY) ?? '{}') as Record<string, string>;
    map[address] = name.trim();
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // ignore — non-essential
  }
};
