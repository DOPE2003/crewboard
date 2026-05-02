'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HeroSearch() {
  const [q, setQ] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) router.push(`/talent?q=${encodeURIComponent(q.trim())}`)
    else router.push('/talent')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hero-search-form"
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: 420,
        background: 'var(--surface, #fff)',
        border: '1.5px solid var(--card-border, #e5e7eb)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <svg
        width="15" height="15"
        viewBox="0 0 24 24" fill="none"
        stroke="var(--text-muted, #9ca3af)"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0, marginLeft: 14 }}
      >
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search freelancers or services…"
        style={{
          flex: 1,
          border: 'none',
          background: 'transparent',
          outline: 'none',
          padding: '13px 10px 13px 10px',
          fontSize: 14,
          color: 'var(--foreground, #111827)',
          fontFamily: 'Inter, sans-serif',
          minHeight: 48,
        }}
      />
      <button
        type="submit"
        style={{
          flexShrink: 0,
          height: 48,
          padding: '0 18px',
          background: '#14B8A6',
          color: '#fff',
          border: 'none',
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.02em',
          transition: 'background 0.15s',
        }}
      >
        Search
      </button>
    </form>
  )
}
