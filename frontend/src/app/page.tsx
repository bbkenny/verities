import React from 'react';
import Link from 'next/link';
import { Play, Shield, Layers, CheckCircle2, Puzzle, Hexagon, ShieldCheck, UserCheck, Key, Star } from 'lucide-react';

export default function Home() {
  return (
    <>
      <nav className="navbar">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/Verities-logo.png" alt="Verities Logo" style={{ height: '32px', objectFit: 'contain' }} />
          <span>verities</span>
        </div>
        <div className="nav-links">
          <a href="#">Product</a>
          <a href="#">How It Works</a>
          <a href="#">Developers</a>
          <a href="#">Docs</a>
          <a href="#">About</a>
        </div>
        <button className="btn-primary">
          <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Launch App</Link>
        </button>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1>
              Prove your trust.<br/>
              <span className="highlight">Protect your privacy.</span>
            </h1>
            <p>
              Verities is a privacy-first reputation layer that lets you prove what matters — without revealing what doesn't.
            </p>
            <div className="hero-actions">
              <button className="btn-primary">
                <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Launch App <span style={{ marginLeft: '4px' }}>→</span>
                </Link>
              </button>
              <button className="btn-outline">
                How It Works <Play size={16} />
              </button>
            </div>
            
            <div className="trust-badge" style={{ marginTop: '3rem', justifyContent: 'flex-start' }}>
              <span><Shield size={16} color="#B899D4" /> Built on Midnight</span>
              <span style={{ margin: '0 10px', color: '#AFA8C3' }}>•</span>
              <span>Powered by Zero-Knowledge Proofs</span>
            </div>
          </div>
          
          <div className="hero-visual">
            <img src="/Verities-heroimg.png" alt="Verities Hero" style={{ width: '100%', maxWidth: '500px', height: 'auto', objectFit: 'contain' }} />
          </div>
        </section>

        <section className="middle-section">
          <div className="middle-header">
            <h2>The operating system for <span className="highlight">digital trust.</span></h2>
            <p>Verities turns your verified behavior into cryptographic proofs that you control and choose to share.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={24} />
              </div>
              <h3>Privacy by Design</h3>
              <p>Zero-knowledge proofs ensure your data stays private while proving what matters.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Layers size={24} />
              </div>
              <h3>You're in Control</h3>
              <p>You decide what to prove, who to prove it to, and when.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <CheckCircle2 size={24} />
              </div>
              <h3>Verifiable Trust</h3>
              <p>Cryptographically verified attestations you can rely on anywhere.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Puzzle size={24} />
              </div>
              <h3>Composable & Open</h3>
              <p>Built as infrastructure for developers, platforms, and ecosystems.</p>
            </div>
          </div>
        </section>

        <section className="bottom-section">
          <h3>Designed for the future of trust.</h3>
          <div className="badges">
            <div className="badge"><Hexagon size={16} color="#B899D4"/> DeFi</div>
            <div className="badge"><ShieldCheck size={16} color="#B899D4"/> Lending</div>
            <div className="badge"><UserCheck size={16} color="#B899D4"/> Hiring</div>
            <div className="badge"><Key size={16} color="#B899D4"/> Access Control</div>
            <div className="badge"><Star size={16} color="#B899D4"/> Reputation</div>
            <div className="badge" style={{ fontStyle: 'italic' }}>And more...</div>
          </div>
        </section>
      </main>
    </>
  );
}
