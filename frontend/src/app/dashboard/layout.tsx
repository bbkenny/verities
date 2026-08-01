import './dashboard.css';
import { Home, FileCheck, ShieldAlert, GitPullRequest, Network, Activity, Code, Settings } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/Verities-logo.png" alt="Verities Logo" style={{ height: '32px', objectFit: 'contain' }} />
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
        </nav>
        
        <div className="wallet-widget">
          <div className="wallet-avatar"></div>
          <div className="wallet-info">
            <span className="wallet-address">0xA12f...7c89</span>
            <span className="wallet-status">
              <span className="status-dot"></span> Connected
            </span>
          </div>
        </div>
      </aside>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
