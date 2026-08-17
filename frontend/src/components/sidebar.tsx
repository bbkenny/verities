'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, FileCheck, ShieldAlert, GitPullRequest, Network, Activity, Code, Settings,
  ShieldCheck, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useWallet } from '@/context/wallet-context';
import SidebarWallet from './sidebar-wallet';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Overview' },
  { href: '/dashboard/proofs', icon: FileCheck, label: 'My Proofs' },
  { href: '/dashboard/attestations', icon: ShieldAlert, label: 'Attestations' },
  { href: '/dashboard/requests', icon: GitPullRequest, label: 'Requests' },
  { href: '/dashboard/connections', icon: Network, label: 'Connections' },
  { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
  { href: '/dashboard/developers', icon: Code, label: 'Developers' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

/** Collapsible dashboard sidebar. The Admin link only appears for admin wallets. */
export default function Sidebar() {
  const { isAdmin } = useWallet();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className="sidebar"
      style={{ width: collapsed ? 76 : 260, transition: 'width 0.2s ease', padding: collapsed ? '1rem 0.6rem' : '1.5rem' }}
    >
      <Link
        href="/"
        className="sidebar-logo"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit', justifyContent: collapsed ? 'center' : 'flex-start', paddingLeft: collapsed ? 0 : undefined }}
      >
        <img src="/Verities-logo.png" alt="Verities Logo" style={{ height: '32px', objectFit: 'contain' }} />
        {!collapsed && <span>verities</span>}
      </Link>

      <nav className="nav-menu">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            className={`nav-item${isActive(href) ? ' active' : ''}`}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        {isAdmin && (
          <Link
            href="/dashboard/admin"
            title={collapsed ? 'Admin' : undefined}
            className={`nav-item${isActive('/dashboard/admin') ? ' active' : ''}`}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <ShieldCheck size={18} />
            {!collapsed && <span>Admin</span>}
          </Link>
        )}
      </nav>

      <SidebarWallet collapsed={collapsed} />

      <button
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginTop: '0.75rem',
          padding: '0.5rem',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--card-border)',
          color: 'var(--text-muted)',
          cursor: 'pointer',
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        {!collapsed && <span style={{ fontSize: '0.8rem' }}>Collapse</span>}
      </button>
    </aside>
  );
}
