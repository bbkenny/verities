'use client';

import { createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode } from 'react';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { installBrowserPolyfills } from '@/lib/polyfills';
import { getWalletName, setWalletName as persistWalletName } from '@/lib/wallet-names';
import { BrowserVeritiesManager } from '@/services/midnight';
import { DEFAULT_NETWORK, NETWORKS, networkById, type NetworkConfig } from '@/config/networks';

installBrowserPolyfills();

const NETWORK_KEY = 'verities-network';
const CONNECTED_KEY = 'verities-connected';
const WALLET_RDNS_KEY = 'verities-wallet-rdns';

export interface Attestation {
  readonly category: string;
  readonly timestamp: number;
  readonly hash: Uint8Array;
}

interface WalletContextValue {
  readonly connected: boolean;
  readonly address?: string;
  readonly walletName?: string;
  readonly isAdmin: boolean;
  readonly attestations: Attestation[];
  readonly busy: boolean;
  readonly error?: string;
  readonly network: NetworkConfig;
  readonly networks: readonly NetworkConfig[];
  readonly connect: (rdns?: string) => Promise<void>;
  readonly disconnect: () => void;
  readonly prove: () => Promise<boolean>;
  readonly saveName: (name: string) => void;
  readonly switchNetwork: (network: NetworkConfig) => void;
  readonly refreshAttestations: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const readNetwork = (): NetworkConfig => {
  if (typeof window === 'undefined') return DEFAULT_NETWORK;
  return networkById(window.localStorage.getItem(NETWORK_KEY) ?? DEFAULT_NETWORK.id);
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<NetworkConfig>(readNetwork);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string>();
  const [walletName, setWalletName] = useState<string>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const manager = useMemo(
    () => new BrowserVeritiesManager(network.id, network.trustAttestationAddress),
    [network],
  );

  const refreshAttestations = useCallback(async () => {
    try {
      const list = await manager.getAttestations();
      setAttestations(list);
    } catch {
      setAttestations([]);
    }
  }, [manager]);

  const connect = useCallback(
    async (rdns?: string) => {
      setBusy(true);
      setError(undefined);
      try {
        const { address: addr } = await manager.connect(rdns);
        setConnected(true);
        setAddress(addr);
        setWalletName(getWalletName(addr));
        setIsAdmin(await manager.isAdmin());
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(CONNECTED_KEY, 'true');
          window.localStorage.setItem(NETWORK_KEY, network.id);
          if (rdns) window.localStorage.setItem(WALLET_RDNS_KEY, rdns);
        }
        await refreshAttestations();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [manager, network.id, refreshAttestations],
  );

  const disconnect = useCallback(() => {
    manager.disconnect();
    setConnected(false);
    setAddress(undefined);
    setWalletName(undefined);
    setIsAdmin(false);
    setAttestations([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CONNECTED_KEY);
      window.localStorage.removeItem(WALLET_RDNS_KEY);
    }
  }, [manager]);

  const saveName = useCallback((name: string) => {
    setAddress((addr) => {
      if (addr) persistWalletName(addr, name);
      return addr;
    });
    setWalletName(name.trim());
  }, []);

  const switchNetwork = useCallback((next: NetworkConfig) => {
    setNetworkId(next.id);
    setNetwork(next);
    setConnected(false);
    setAddress(undefined);
    setWalletName(undefined);
    setIsAdmin(false);
    setAttestations([]);
    setError(undefined);
    if (typeof window !== 'undefined') window.localStorage.setItem(NETWORK_KEY, next.id);
  }, []);

  const prove = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    setError(undefined);
    try {
      const ok = await manager.proveOrSelfAttest('lending', 70);
      await refreshAttestations();
      return ok;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setBusy(false);
    }
  }, [manager, refreshAttestations]);

  // Auto-reconnect on page load if a wallet was previously connected.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(CONNECTED_KEY) === 'true') {
      const rdns = window.localStorage.getItem(WALLET_RDNS_KEY) ?? undefined;
      void connect(rdns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      connected,
      address,
      walletName,
      isAdmin,
      attestations,
      busy,
      error,
      network,
      networks: NETWORKS,
      connect,
      disconnect,
      prove,
      saveName,
      switchNetwork,
      refreshAttestations,
    }),
    [connected, address, walletName, isAdmin, attestations, busy, error, network, connect, disconnect, prove, saveName, switchNetwork, refreshAttestations],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
}
