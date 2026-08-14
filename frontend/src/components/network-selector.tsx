'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useWallet } from '@/context/wallet-context';

/** Dropdown to switch between Preview / Preprod / Mainnet. */
export default function NetworkSelector() {
  const { network, networks, switchNetwork } = useWallet();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <div className="network-selector" onClick={() => setOpen((o) => !o)} style={{ cursor: 'pointer' }}>
        <span className="status-dot"></span>
        {network.label}
        <ChevronDown size={14} />
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 4,
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            zIndex: 50,
            minWidth: 140,
            overflow: 'hidden',
          }}
        >
          {networks.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                switchNetwork(n);
                setOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem 1rem',
                textAlign: 'left',
                background: n.id === network.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
