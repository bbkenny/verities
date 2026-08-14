'use client';

import { useMemo, useState } from 'react';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { networkId } from '@/config';
import { installBrowserPolyfills } from '@/lib/polyfills';
import { BrowserVeritiesManager, type ContractName } from '@/services/midnight';

installBrowserPolyfills();
setNetworkId(networkId);

/**
 * Wallet connect/disconnect, contract deployment, and the privacy-preserving
 * `verify_claim` circuit call — all via the connected Midnight wallet (Lace / 1AM).
 */
export default function WalletPanel() {
  const manager = useMemo(() => new BrowserVeritiesManager(), []);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [deployed, setDeployed] = useState<Partial<Record<ContractName, string>>>({});
  const [result, setResult] = useState<{ ok: boolean; label: string }>();

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
    setDeployed({});
  };

  const deploy = async (name: ContractName) => {
    setBusy(true);
    setError(undefined);
    try {
      const contractAddress = await manager.deploy(name);
      setDeployed((prev) => ({ ...prev, [name]: contractAddress }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError(undefined);
    setResult(undefined);
    try {
      const ok = await manager.selfAttestAndVerify('lending', 70);
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
          style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#10B981' : '#64748b' }}
        />
        <span style={{ fontWeight: 600 }}>{connected ? `Connected (${networkId})` : 'Wallet not connected'}</span>
      </div>

      {address && (
        <code style={{ fontSize: '0.8rem', opacity: 0.7, wordBreak: 'break-all' }}>{address}</code>
      )}

      {!connected ? (
        <button className="btn-primary" onClick={connect} disabled={busy}>
          {busy ? 'Connecting…' : 'Connect Wallet (Lace / 1AM)'}
        </button>
      ) : (
        <>
          <button className="btn-primary" onClick={() => deploy('oracle_registry')} disabled={busy}>
            {busy ? 'Deploying…' : 'Deploy oracle_registry'}
          </button>
          <button className="btn-primary" onClick={() => deploy('trust_attestation')} disabled={busy}>
            {busy ? 'Deploying…' : 'Deploy trust_attestation'}
          </button>
          <button className="btn-primary" onClick={verify} disabled={busy}>
            {busy ? 'Proving…' : 'Prove trust score > 70 (privately)'}
          </button>
          <button className="btn-outline" onClick={disconnect} disabled={busy}>
            Disconnect
          </button>
        </>
      )}

      {(deployed.oracle_registry || deployed.trust_attestation) && (
        <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {deployed.oracle_registry && (
            <div>
              <strong>oracle_registry:</strong>{' '}
              <code style={{ wordBreak: 'break-all', opacity: 0.85 }}>{deployed.oracle_registry}</code>
            </div>
          )}
          {deployed.trust_attestation && (
            <div>
              <strong>trust_attestation:</strong>{' '}
              <code style={{ wordBreak: 'break-all', opacity: 0.85 }}>{deployed.trust_attestation}</code>
            </div>
          )}
        </div>
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
