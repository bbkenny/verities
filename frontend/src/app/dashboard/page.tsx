'use client';

import { Bell, Shield, Users, Network, Clock, ShieldCheck, FileCheck, DollarSign, Wallet, FileText, Lock } from 'lucide-react';
import WalletPanel from '@/components/wallet-panel';
import NetworkSelector from '@/components/network-selector';
import { useWallet } from '@/context/wallet-context';

export default function Dashboard() {
  const { connected, address, attestations } = useWallet();
  const latest = attestations[0];

  return (
    <>
      <div className="top-bar">
        <div className="welcome-msg">
          <h1>{connected ? 'Welcome back 👋' : 'Welcome to Verities 👋'}</h1>
          <p>{connected ? 'Your privacy-preserving trust, on-chain' : 'Connect your wallet to get started'}</p>
        </div>
        <div className="top-bar-right">
          <button className="notification-btn">
            <Bell size={20} />
          </button>
          <NetworkSelector />
        </div>
      </div>

      <WalletPanel />

      <div className="dashboard-grid-top">
        {/* Trust Overview Card */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Trust Overview</h3>
          </div>
          <div className="trust-score-container">
            <div className="score-circle">
              <div className="score-content">
                <div className="score-number">{attestations.length}</div>
                <div className="score-badge">
                  <ShieldCheck size={12} /> Attestations
                </div>
              </div>
            </div>
            <div className="score-stats">
              <div className="stat-item">
                <Shield size={20} className="stat-icon" />
                <div className="stat-info">
                  <h4>Private</h4>
                  <p>Your score is never stored</p>
                </div>
              </div>
              <div className="stat-item">
                <Users size={20} className="stat-icon" />
                <div className="stat-info neutral">
                  <h4>{attestations.length}</h4>
                  <p>Categories attested</p>
                </div>
              </div>
              <div className="stat-item">
                <Network size={20} className="stat-icon" />
                <div className="stat-info neutral">
                  <h4>{connected ? address?.slice(0, 6) + '…' : '—'}</h4>
                  <p>Connected wallet</p>
                </div>
              </div>
            </div>
          </div>
          <div className="score-footer">
            <Clock size={14} /> Live on-chain data
          </div>
        </div>

        {/* Recent Attestation Card */}
        <div className="dashboard-card recent-attestation">
          <div className="card-header" style={{ width: '100%', marginBottom: '0.5rem' }}>
            <h3 className="card-title">Recent Attestation</h3>
          </div>
          {latest ? (
            <>
              <div className="attestation-icon" style={{ marginTop: '1rem' }}>
                <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #DDA61A, #B38515)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 20px rgba(221, 166, 26, 0.3)' }}>
                  <Shield size={32} color="white" />
                </div>
              </div>
              <h3 className="attestation-title">{latest.category || 'Attestation'}</h3>
              <p className="attestation-subtitle">Score proven &gt; threshold (private)</p>
              <div className="verified-badge">
                <ShieldCheck size={12} /> Verified
              </div>
              <div className="attestation-meta">
                Issued via self-attestation<br />
                {new Date(latest.timestamp * 1000).toLocaleDateString()}
              </div>
            </>
          ) : (
            <p style={{ opacity: 0.6, padding: '1rem 0' }}>
              {connected ? 'No attestations yet — click "Prove trust score" above to create your first one.' : 'Connect your wallet to see your attestations.'}
            </p>
          )}
          <button className="btn-full">View Attestation</button>
        </div>
      </div>

      <div>
        <div className="card-header">
          <h3 className="card-title">Your Proofs</h3>
          <a href="#" className="card-link">View all</a>
        </div>
        <div className="proofs-grid">
          <div className="proof-card">
            <div className="proof-icon">
              <FileCheck size={20} />
            </div>
            <h4>Payment Reliability</h4>
            <p>On-time payments &gt; 99%</p>
            <button className="proof-btn">Prove <span style={{ marginLeft: '4px' }}>→</span></button>
          </div>
          <div className="proof-card">
            <div className="proof-icon">
              <DollarSign size={20} />
            </div>
            <h4>Income Consistency</h4>
            <p>Stable income &gt; 6 months</p>
            <button className="proof-btn">Prove <span style={{ marginLeft: '4px' }}>→</span></button>
          </div>
          <div className="proof-card">
            <div className="proof-icon">
              <Wallet size={20} />
            </div>
            <h4>Account Integrity</h4>
            <p>No defaults or charge-offs</p>
            <button className="proof-btn">Prove <span style={{ marginLeft: '4px' }}>→</span></button>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-bottom">
        {/* Activity Feed */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Activity Feed</h3>
            <a href="#" className="card-link">View all</a>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon"><FileText size={18} /></div>
              <div className="activity-content">
                <h4>Attestation Issued</h4>
                <p>Financial Reliability score updated</p>
              </div>
              <div className="activity-time">2h ago</div>
            </div>
            <div className="activity-item">
              <div className="activity-icon"><FileCheck size={18} /></div>
              <div className="activity-content">
                <h4>Proof Generated</h4>
                <p>Payment Reliability proof created</p>
              </div>
              <div className="activity-time">1d ago</div>
            </div>
            <div className="activity-item">
              <div className="activity-icon"><ShieldCheck size={18} color="#10B981" /></div>
              <div className="activity-content">
                <h4>Proof Verified</h4>
                <p>Your proof was verified by LendFi</p>
              </div>
              <div className="activity-time">3d ago</div>
            </div>
            <div className="activity-item">
              <div className="activity-icon"><Network size={18} /></div>
              <div className="activity-content">
                <h4>Connection Added</h4>
                <p>Connected to LendFi</p>
              </div>
              <div className="activity-time">3d ago</div>
            </div>
          </div>
        </div>

        {/* Connections */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Connections</h3>
            <a href="#" className="card-link">View all</a>
          </div>
          <div className="connections-list">
            <div className="connection-item">
              <div className="connection-info">
                <div className="connection-logo" style={{ background: '#3B82F6', color: 'white' }}>L</div>
                <div className="connection-name">LendFi</div>
              </div>
              <div className="status-badge status-active">
                <ShieldCheck size={10} style={{ display: 'inline', marginRight: '4px' }}/> Active
              </div>
            </div>
            <div className="connection-item">
              <div className="connection-info">
                <div className="connection-logo" style={{ background: '#6B3F7F', color: 'white' }}>T</div>
                <div className="connection-name">TrustGate</div>
              </div>
              <div className="status-badge status-active">
                <ShieldCheck size={10} style={{ display: 'inline', marginRight: '4px' }}/> Active
              </div>
            </div>
            <div className="connection-item">
              <div className="connection-info">
                <div className="connection-logo" style={{ background: '#EC4899', color: 'white' }}>H</div>
                <div className="connection-name">HireSafe</div>
              </div>
              <div className="status-badge status-pending">Pending</div>
            </div>
            <div className="connection-item">
              <div className="connection-info">
                <div className="connection-logo" style={{ background: '#0F172A', color: 'white', border: '1px solid #334155' }}>K</div>
                <div className="connection-name">KreditDAO</div>
              </div>
              <div className="status-badge status-active">
                <ShieldCheck size={10} style={{ display: 'inline', marginRight: '4px' }}/> Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="bottom-banner">
        <div className="banner-content">
          <div className="banner-icon">
            <Lock size={28} color="white" />
          </div>
          <div className="banner-text">
            <h3>You control your privacy</h3>
            <p>Only you decide what to prove and who can verify it.</p>
          </div>
        </div>
        <button className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
          Create a New Proof +
        </button>
      </div>
    </>
  );
}
