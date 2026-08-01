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
        <div className="sidebar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 22H12L22 2H12Z" fill="url(#paint0_linear)"/>
            <path d="M12 2L22 22H12L2 2H12Z" fill="url(#paint1_linear)" fillOpacity="0.5"/>
            <defs>
              <linearGradient id="paint0_linear" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D8B4FE"/>
                <stop offset="1" stopColor="#7C3AED"/>
              </linearGradient>
              <linearGradient id="paint1_linear" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4C1D95"/>
                <stop offset="1" stopColor="#A855F7"/>
              </linearGradient>
            </defs>
          </svg>
          verities
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
