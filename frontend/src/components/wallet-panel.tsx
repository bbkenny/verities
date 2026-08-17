'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { useWallet } from '@/context/wallet-context';
import { listCompatibleWallets } from '@/services/midnight/wallet';

/**
 * Wallet connect/disconnect, the privacy-preserving `verify_claim` circuit call,
 * and the connected wallet's real on-chain attestations.
 */
export default function WalletPanel() {
  const { connected, address, walletName, attestations, busy, error, connect, disconnect, prove, saveName } = useWallet();
  const [result, setResult] = useState<{ ok: boolean; label: string }>();
  const [nameInput, setNameInput] = useState('');
  const [walletChoices, setWalletChoices] = useState<{ rdns: string; name: string }[]>();

  const handleConnect = () => {
    const wallets = listCompatibleWallets();
    if (wallets.length > 1) {
      setWalletChoices(wallets);
    } else {
      void connect(wallets[0]?.rdns);
    }
  };

  const handleProve = async () => {
    setResult(undefined);
    try {
      const ok = await prove();
      setResult(ok ? { ok: true, label: 'Verified — trust score exceeds 70' } : { ok: false, label: 'Not verified' });
    } catch {
      // error surfaced via context
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
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#10B981' : '#64748b' }} />
        <span style={{ fontWeight: 600 }}>{connected ? 'Wallet connected' : 'Wallet not connected'}</span>
      </div>

      {address && <code style={{ fontSize: '0.8rem', opacity: 0.7, wordBreak: 'break-all' }}>{address}</code>}

      {connected && !walletName && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="What should we call you?"
            style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'inherit' }}
          />
          <button className="btn-primary" onClick={() => nameInput.trim() && saveName(nameInput)} disabled={!nameInput.trim()}>
            Save
          </button>
        </div>
      )}

      {!connected && !walletChoices && (
        <button className="btn-primary" onClick={handleConnect} disabled={busy}>
          {busy ? 'Connecting…' : 'Connect Wallet'}
        </button>
      )}

      {!connected && walletChoices && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Choose a wallet:</span>
          {walletChoices.map((w) => (
            <button
              key={w.rdns}
              className="btn-outline"
              onClick={() => {
                setWalletChoices(undefined);
                void connect(w.rdns);
              }}
              disabled={busy}
            >
              {w.name}
            </button>
          ))}
        </div>
      )}

      {connected && (
        <>
          <button className="btn-primary" onClick={handleProve} disabled={busy}>
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

      {attestations.length > 0 && (
        <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <strong>Your attestations ({attestations.length})</strong>
          {attestations.map((a) => (
            <div key={a.category + a.timestamp} style={{ opacity: 0.8 }}>
              {a.category} · {new Date(a.timestamp * 1000).toLocaleDateString()}
            </div>
          ))}
        </div>
      )}

      {error && <div style={{ color: '#EF4444', fontSize: '0.85rem' }}>{error}</div>}

      <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
        Your score is proven (YES/NO) without ever revealing its value — selective disclosure.
      </div>
    </div>
  );
}
