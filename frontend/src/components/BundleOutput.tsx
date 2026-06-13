'use client'

import { useState } from 'react'
import { Copy, Download, Check, FileText } from 'lucide-react'
import { BundleResponse } from '@/types'

interface BundleOutputProps {
    result: BundleResponse
    repoName: string
}

export default function BundleOutput({ result, repoName }: BundleOutputProps) {
    const [copied, setCopied] = useState(false)

    function handleCopy() {
        navigator.clipboard.writeText(result.bundle).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    function handleDownload() {
        const blob = new Blob([result.bundle], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const safeName = repoName.replace('/', '_')
        a.href = url
        a.download = `${safeName}_bundle.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    // Format token count nicely
    function formatTokens(n: number): string {
        if (n >= 1000) return `~${(n / 1000).toFixed(1)}k`
        return `~${n}`
    }

    // Token count colour — green is fine, orange is getting heavy, red is a lot
    function tokenColor(n: number): string {
        if (n < 20000) return 'var(--green)'
        if (n < 80000) return 'var(--orange)'
        return 'var(--red)'
    }

    return (
        <div
            style={{
                border: '1px solid var(--accent)',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'var(--bg-secondary)',
            }}
        >
            {/* Header bar */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--accent-subtle)',
                    flexWrap: 'wrap',
                    gap: '8px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={14} color="var(--accent-hover)" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Bundle ready
                    </span>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {result.file_count} files
                    </span>
                    <span
                        style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: tokenColor(result.token_estimate),
                        }}
                    >
                        {formatTokens(result.token_estimate)} tokens
                    </span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleCopy}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 12px',
                            background: copied ? 'var(--green-subtle)' : 'var(--bg-tertiary)',
                            color: copied ? 'var(--green)' : 'var(--text-primary)',
                            border: `1px solid ${copied ? 'var(--green)' : 'var(--border)'}`,
                            borderRadius: '5px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>

                    <button
                        onClick={handleDownload}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 12px',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                            borderRadius: '5px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                        onMouseEnter={e =>
                            ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--text-secondary)')
                        }
                        onMouseLeave={e =>
                            ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)')
                        }
                    >
                        <Download size={13} />
                        Download
                    </button>
                </div>
            </div>

            {/* Bundle preview */}
            <pre
                style={{
                    padding: '16px',
                    margin: 0,
                    fontSize: '11px',
                    lineHeight: '1.6',
                    color: 'var(--text-secondary)',
                    fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    maxHeight: '420px',
                    whiteSpace: 'pre',
                    background: 'var(--bg-primary)',
                }}
            >
                {result.bundle}
            </pre>

            {/* Footer tip */}
            <div
                style={{
                    padding: '8px 14px',
                    borderTop: '1px solid var(--border)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                }}
            >
                💡 Copy the bundle and paste it directly into Claude, ChatGPT, or any AI chat.
                Save the downloaded file to use the compare feature next time.
            </div>
        </div>
    )
}