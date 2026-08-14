'use client';

import { useMemo, useState } from 'react';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { networkId } from '@/config';
import { installBrowserPolyfills } from '@/lib/polyfills';
import { BrowserVeritiesManager } from '@/services/midnight';

installBrowserPolyfills();
setNetworkId(networkId);

/**
 * Lace wallet connect/disconnect + the privacy-preserving `verify_claim` circuit call.
 */
export default function WalletPanel() {
  const manager = useMemo(() => new BrowserVeritiesManager(), []);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; label: string }>();
  const [error, setError] = useState<string>();

  const connect = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const { address: addr } = await manager.connect();
      setConnected(true);
      setAddress(addr);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = () => {
    manager.disconnect();
    setConnected(false);
    setAddress(undefined);
    setResult(undefined);
  };

  const verify = async () => {
    setBusy(true);
    setError(undefined);
    setResult(undefined);
    try {
      const ok = await manager.verifyClaim('lending', 70);
      setResult(ok ? { ok: true, label: 'Verified — trust score exceeds 70' } : { ok: false, label: 'Not verified' });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: connected ? '#10B981' : '#64748b',
          }}
        />
        <span style={{ fontWeight: 600 }}>{connected ? 'Lace connected' : 'Lace not connected'}</span>
      </div>

      {address && (
        <code style={{ fontSize: '0.8rem', opacity: 0.7, wordBreak: 'break-all' }}>{address}</code>
      )}

      {!connected ? (
        <button className="btn-primary" onClick={connect} disabled={busy}>
          {busy ? 'Connecting…' : 'Connect Lace Wallet'}
        </button>
      ) : (
        <>
          <button className="btn-primary" onClick={verify} disabled={busy}>
            {busy ? 'Proving…' : 'Prove trust score > 70 (privately)'}
          </button>
          <button className="btn-outline" onClick={disconnect} disabled={busy}>
            Disconnect
          </button>
        </>
      )}

      {result && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: result.ok ? '#10B981' : '#F59E0B' }}>
          {result.ok ? <ShieldCheck size={18} /> : <ShieldX size={18} />}
          <span>{result.label}</span>
        </div>
      )}

      {error && <div style={{ color: '#EF4444', fontSize: '0.85rem' }}>{error}</div>}

      <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
        Your score is proven (YES/NO) without ever revealing its value — selective disclosure.
      </div>
    </div>
  );
}
