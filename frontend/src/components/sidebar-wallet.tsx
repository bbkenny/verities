'use client';

import { useWallet } from '@/context/wallet-context';

const shortAddr = (addr?: string): string =>
  addr ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : 'Not connected';

/** Sidebar wallet status — reflects the real connected wallet. */
export default function SidebarWallet() {
  const { connected, address, walletName } = useWallet();

  return (
    <div className="wallet-widget">
      <div className="wallet-avatar" style={{ background: connected ? '#10B981' : undefined }}></div>
      <div className="wallet-info">
        <span className="wallet-address">{connected ? (walletName ?? shortAddr(address)) : 'Not connected'}</span>
        <span className="wallet-status">
          <span className="status-dot" style={{ background: connected ? '#10B981' : '#64748b' }}></span>{' '}
          {connected ? 'Connected' : 'Not connected'}
        </span>
      </div>
    </div>
  );
}
