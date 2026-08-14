import Link from 'next/link';
import { HardHat, ArrowLeft } from 'lucide-react';

/**
 * Catch-all for dashboard sub-routes that aren't built yet
 * (My Proofs, Attestations, Requests, Connections, Activity, Developers, Settings).
 */
export default function ComingSoonPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: 'rgba(221,166,26,0.1)',
          border: '1px solid rgba(221,166,26,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <HardHat size={42} color="#DDA61A" />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Under construction</h2>
      <p style={{ opacity: 0.6, maxWidth: 360 }}>
        This feature is part of a future level. We&apos;re building it out — check back soon.
      </p>
      <Link href="/dashboard" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Back to overview
      </Link>
    </div>
  );
}
