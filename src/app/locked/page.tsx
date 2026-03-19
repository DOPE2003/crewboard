"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LockedPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set the cookie (Expires in 30 days)
    document.cookie = `site-access=${password}; path=/; max-age=${60 * 60 * 24 * 30}`;
    
    // Refresh to trigger middleware check
    router.refresh();
    router.push('/');
  };

  return (
    <main style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      color: '#fff',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '0.1em' }}>CREWBOARD</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          WE ARE CURRENTLY UNDER MAINTENANCE. <br/> PLEASE ENTER ACCESS KEY TO PROCEED.
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="password"
            placeholder="ENTER ACCESS KEY"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              textAlign: 'center',
              fontSize: '0.8rem',
              letterSpacing: '0.2em'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#2DD4BF',
              color: '#000',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.1em'
            }}
          >
            UNLOCK ACCESS
          </button>
        </form>
        
        <p style={{ marginTop: '2rem', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
          © 2026 CREWBOARD LABS
        </p>
      </div>
    </main>
  );
}
