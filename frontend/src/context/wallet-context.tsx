'use client';

import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { networkId } from '@/config';
import { installBrowserPolyfills } from '@/lib/polyfills';
import { BrowserVeritiesManager } from '@/services/midnight';

installBrowserPolyfills();
setNetworkId(networkId);

export interface Attestation {
  readonly category: string;
  readonly timestamp: number;
  readonly hash: Uint8Array;
}

interface WalletContextValue {
  readonly connected: boolean;
  readonly address?: string;
  readonly attestations: Attestation[];
  readonly busy: boolean;
  readonly error?: string;
  readonly connect: () => Promise<void>;
  readonly disconnect: () => void;
  readonly prove: () => Promise<boolean>;
  readonly refreshAttestations: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const manager = useMemo(() => new BrowserVeritiesManager(), []);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string>();
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

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
    setAttestations([]);
  }, [manager]);

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
    () => ({ connected, address, attestations, busy, error, connect, disconnect, prove, refreshAttestations }),
    [connected, address, attestations, busy, error, connect, disconnect, prove, refreshAttestations],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
}
