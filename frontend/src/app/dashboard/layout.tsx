import './dashboard.css';
import { Home, FileCheck, ShieldAlert, GitPullRequest, Network, Activity, Code, Settings, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { WalletProvider } from '@/context/wallet-context';
import SidebarWallet from '@/components/sidebar-wallet';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WalletProvider>
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img src="/Verities-logo.png" alt="Verities Logo" style={{ height: '32px', objectFit: 'contain' }} />
            <span>verities</span>
          </div>
          
          <nav className="nav-menu">
            <Link href="/dashboard" className="nav-item active">
              <Home size={18} /> Overview
            </Link>
            <Link href="/dashboard/proofs" className="nav-item">
              <FileCheck size={18} /> My Proofs
            </Link>
            <Link href="/dashboard/attestations" className="nav-item">
              <ShieldAlert size={18} /> Attestations
            </Link>
            <Link href="/dashboard/requests" className="nav-item">
              <GitPullRequest size={18} /> Requests
            </Link>
            <Link href="/dashboard/connections" className="nav-item">
              <Network size={18} /> Connections
            </Link>
            <Link href="/dashboard/activity" className="nav-item">
              <Activity size={18} /> Activity
            </Link>
            <Link href="/dashboard/developers" className="nav-item">
              <Code size={18} /> Developers
            </Link>
            <Link href="/dashboard/settings" className="nav-item">
              <Settings size={18} /> Settings
            </Link>
            <Link href="/dashboard/admin" className="nav-item">
              <ShieldCheck size={18} /> Admin
            </Link>
          </nav>
          
          <SidebarWallet />
        </aside>
        
        <main className="main-content">
          {children}
        </main>
      </div>
    </WalletProvider>
  );
}
