'use client';

import { useMemo, useState } from 'react';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { networkId } from '@/config';
import { installBrowserPolyfills } from '@/lib/polyfills';
import { BrowserVeritiesManager, type ContractName } from '@/services/midnight';

installBrowserPolyfills();
setNetworkId(networkId);

/**
 * Admin page: contract deployment + oracle/admin management.
 * Gated — only the wallet that deployed the contracts (the on-chain `admin`) can use it.
 */
export default function AdminPanel() {
  const manager = useMemo(() => new BrowserVeritiesManager(), []);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string>();
  const [admin, setAdmin] = useState<boolean | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [deployed, setDeployed] = useState<Partial<Record<ContractName, string>>>({});
  const [oracleInput, setOracleInput] = useState('');
  const [newAdminInput, setNewAdminInput] = useState('');

  const connect = async () => {
    setBusy(true);
    setError(undefined);
    setAdmin(undefined);
    try {
      const { address: addr } = await manager.connect();
      setConnected(true);
      setAddress(addr);
      const isAdmin = await manager.isAdmin();
      setAdmin(isAdmin);
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
    setAdmin(undefined);
    setDeployed({});
  };

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
    } catch (e) {
      setError(`${label}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const deploy = (name: ContractName) =>
    run(`Deploy ${name}`, async () => {
      const contractAddress = await manager.deploy(name);
      setDeployed((prev) => ({ ...prev, [name]: contractAddress }));
    });

  const addOracle = () =>
    run('Add oracle', async () => {
      await manager.addOracle(oracleInput);
      setOracleInput('');
    });

  const removeOracle = () =>
    run('Remove oracle', async () => {
      await manager.removeOracle(oracleInput);
      setOracleInput('');
    });

  const transferAdmin = () =>
    run('Transfer admin', async () => {
      await manager.transferAdmin(newAdminInput);
      setNewAdminInput('');
    });

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 720 }}>
      <h1>Admin</h1>
      <p style={{ opacity: 0.6 }}>
        Contract deployment and oracle/admin management. Only the wallet that deployed the
        contracts (the on-chain <code>admin</code>) can use this page.
      </p>

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
          <span style={{ fontWeight: 600 }}>
            {admin === undefined
              ? connected
                ? 'Checking admin…'
                : `Not connected (${networkId})`
              : admin
                ? 'Admin access ✓'
                : 'Access denied'}
          </span>
        </div>

        {address && <code style={{ fontSize: '0.8rem', opacity: 0.7, wordBreak: 'break-all' }}>{address}</code>}

        {!connected ? (
          <button className="btn-primary" onClick={connect} disabled={busy}>
            {busy ? 'Connecting…' : 'Connect Wallet'}
          </button>
        ) : admin === undefined ? (
          <div style={{ opacity: 0.6 }}>Loading admin status…</div>
        ) : !admin ? (
          <div style={{ color: '#F59E0B' }}>
            This wallet is not the contract admin. Connect the deployer wallet to manage the contracts.
          </div>
        ) : (
          <>
            <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            <h3>Deploy</h3>
            <button className="btn-primary" onClick={() => deploy('oracle_registry')} disabled={busy}>
              {busy ? 'Deploying…' : 'Deploy oracle_registry'}
            </button>
            <button className="btn-primary" onClick={() => deploy('trust_attestation')} disabled={busy}>
              {busy ? 'Deploying…' : 'Deploy trust_attestation'}
            </button>

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

            <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            <h3>Oracle whitelist</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={oracleInput}
                onChange={(e) => setOracleInput(e.target.value)}
                placeholder="oracle address (mn_… or 0x…)"
                style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'inherit' }}
              />
              <button className="btn-primary" onClick={addOracle} disabled={busy || !oracleInput}>
                Add
              </button>
              <button className="btn-outline" onClick={removeOracle} disabled={busy || !oracleInput}>
                Remove
              </button>
            </div>

            <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            <h3>Transfer admin</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={newAdminInput}
                onChange={(e) => setNewAdminInput(e.target.value)}
                placeholder="new admin address"
                style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'inherit' }}
              />
              <button className="btn-primary" onClick={transferAdmin} disabled={busy || !newAdminInput}>
                Transfer
              </button>
            </div>

            <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            <button className="btn-outline" onClick={disconnect} disabled={busy}>
              Disconnect
            </button>
          </>
        )}

        {error && <div style={{ color: '#EF4444', fontSize: '0.85rem' }}>{error}</div>}
      </div>
    </div>
  );
}
