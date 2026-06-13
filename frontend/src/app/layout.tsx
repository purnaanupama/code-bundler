import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RepoBundle — Pack your GitHub repo for AI',
  description:
    'Select files from any GitHub repo and bundle them into a single optimized file ready to paste into Claude, ChatGPT, or any AI.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Top navbar */}
        <header
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            padding: '0 24px',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Logo icon */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent-hover)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span
              style={{
                fontWeight: 600,
                fontSize: '15px',
                color: 'var(--text-primary)',
                letterSpacing: '-0.3px',
              }}
            >
              RepoBundle
            </span>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '1px 6px',
              }}
            >
              beta
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Pack your repo. Paste to AI.
            </span>
          </div>
        </header>

        {/* Page content */}
        <main
          style={{
            minHeight: 'calc(100vh - 52px)',
            background: 'var(--bg-primary)',
          }}
        >
          {children}
        </main>
      </body>
    </html>
  )
}