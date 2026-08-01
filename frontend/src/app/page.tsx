import React from 'react';
import { Play, Shield, Layers, CheckCircle2, Puzzle, Hexagon, ShieldCheck, UserCheck, Key, Star } from 'lucide-react';

export default function Home() {
  return (
    <>
      <nav className="navbar">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
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
        <div className="nav-links">
          <a href="#">Product</a>
          <a href="#">How It Works</a>
          <a href="#">Developers</a>
          <a href="#">Docs</a>
          <a href="#">About</a>
        </div>
        <button className="btn-primary">Launch App</button>
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
                Launch App <span style={{ marginLeft: '4px' }}>→</span>
              </button>
              <button className="btn-outline">
                How It Works <Play size={16} />
              </button>
            </div>
            
            <div className="trust-badge" style={{ marginTop: '3rem', justifyContent: 'flex-start' }}>
              <span><Shield size={16} color="#A855F7" /> Built on Midnight</span>
              <span style={{ margin: '0 10px', color: '#4B5563' }}>•</span>
              <span>Powered by Zero-Knowledge Proofs</span>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="glass-card"></div>
            <div className="glass-card"></div>
            <div className="glass-card">
              <div className="glass-card-logo">V</div>
            </div>
            <div className="glowing-base"></div>
            <div className="glowing-base-inner"></div>
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
            <div className="badge"><Hexagon size={16} color="#A855F7"/> DeFi</div>
            <div className="badge"><ShieldCheck size={16} color="#A855F7"/> Lending</div>
            <div className="badge"><UserCheck size={16} color="#A855F7"/> Hiring</div>
            <div className="badge"><Key size={16} color="#A855F7"/> Access Control</div>
            <div className="badge"><Star size={16} color="#A855F7"/> Reputation</div>
            <div className="badge" style={{ fontStyle: 'italic' }}>And more...</div>
          </div>
        </section>
      </main>
    </>
  );
}
