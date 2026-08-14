'use client';

import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { installBrowserPolyfills } from '@/lib/polyfills';
import { getWalletName, setWalletName as persistWalletName } from '@/lib/wallet-names';
import { BrowserVeritiesManager } from '@/services/midnight';
import { DEFAULT_NETWORK, NETWORKS, type NetworkConfig } from '@/config/networks';

installBrowserPolyfills();

export interface Attestation {
  readonly category: string;
  readonly timestamp: number;
  readonly hash: Uint8Array;
}

interface WalletContextValue {
  readonly connected: boolean;
  readonly address?: string;
  readonly walletName?: string;
  readonly attestations: Attestation[];
  readonly busy: boolean;
  readonly error?: string;
  readonly network: NetworkConfig;
  readonly networks: readonly NetworkConfig[];
  readonly connect: () => Promise<void>;
  readonly disconnect: () => void;
  readonly prove: () => Promise<boolean>;
  readonly saveName: (name: string) => void;
  readonly switchNetwork: (network: NetworkConfig) => void;
  readonly refreshAttestations: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<NetworkConfig>(DEFAULT_NETWORK);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string>();
  const [walletName, setWalletName] = useState<string>();
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

  const connect = useCallback(async () => {
    setBusy(true);
    setError(undefined);
    try {
      const { address: addr } = await manager.connect();
      setConnected(true);
      setAddress(addr);
      setWalletName(getWalletName(addr));
      await refreshAttestations();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [manager, refreshAttestations]);

  const disconnect = useCallback(() => {
    manager.disconnect();
    setConnected(false);
    setAddress(undefined);
    setWalletName(undefined);
    setAttestations([]);
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
    setAttestations([]);
    setError(undefined);
  }, []);

  const prove = useCallback(async (): Promise<boolean> => {
    setBusy(true);
    setError(undefined);
    try {
      const ok = await manager.selfAttestAndVerify('lending', 70);
      await refreshAttestations();
      return ok;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setBusy(false);
    }
  }, [manager, refreshAttestations]);

  const value = useMemo(
    () => ({
      connected,
      address,
      walletName,
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
    [connected, address, walletName, attestations, busy, error, network, connect, disconnect, prove, saveName, switchNetwork, refreshAttestations],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
}
