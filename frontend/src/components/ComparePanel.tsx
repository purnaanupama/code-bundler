'use client'

import { useState, useRef } from 'react'
import { Upload, GitCompare, X, FileText } from 'lucide-react'
import { CompareResponse } from '@/types'

interface ComparePanelProps {
    owner: string
    repo: string
    token: string | null
    onCompareComplete: (result: CompareResponse | null) => void
    onClose: () => void
    isLoading: boolean
    onCompare: (file: File) => void
    result: CompareResponse | null
    onReset?: () => void
}

interface DiffSectionProps {
    title: string
    files: string[]
    color: string
    bg: string
    badge: string
}

function DiffSection({ title, files, color, bg, badge }: DiffSectionProps) {
    if (files.length === 0) return null

    return (
        <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span
                    style={{
                        background: bg,
                        color: color,
                        borderRadius: '3px',
                        padding: '1px 6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                    }}
                >
                    {badge}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {title}
                    <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                        ({files.length})
                    </span>
                </span>
            </div>

            <div
                style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '5px',
                    overflow: 'hidden',
                }}
            >
                {files.map((f, i) => (
                    <div
                        key={f}
                        style={{
                            padding: '5px 10px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            color: color,
                            borderBottom: i < files.length - 1 ? '1px solid var(--border)' : 'none',
                            background: bg,
                        }}
                    >
                        {f}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function ComparePanel({
    onClose,
    isLoading,
    onCompare,
    result,
    onReset,
}: ComparePanelProps) {
    const [dragOver, setDragOver] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    function handleFile(file: File) {
        setSelectedFile(file)
        onReset?.()
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }

    async function handleCompare() {
        if (!selectedFile) return
        onCompare(selectedFile)
    }

    const totalChanged = result ? result.summary.changed + result.summary.deleted : 0

    return (
        <div
            style={{
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--blue-subtle)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GitCompare size={14} color="var(--blue)" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Find changes since last bundle
                    </span>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px',
                    }}
                >
                    <X size={16} />
                </button>
            </div>

            <div style={{ padding: '16px' }}>
                {!result && (
                    <>
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: `2px dashed ${dragOver ? 'var(--blue)' : selectedFile ? 'var(--accent)' : 'var(--border)'}`,
                                borderRadius: '6px',
                                padding: '24px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: dragOver ? 'var(--blue-subtle)' : 'var(--bg-primary)',
                                transition: 'all 0.15s ease',
                                marginBottom: '12px',
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt"
                                style={{ display: 'none' }}
                                onChange={e => {
                                    const file = e.target.files?.[0]
                                    if (file) handleFile(file)
                                }}
                            />

                            {selectedFile ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <FileText size={16} color="var(--accent-hover)" />
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                                        {selectedFile.name}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <Upload size={20} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                        Drop your previous bundle here
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        We'll re-bundle only the files it contains and compare
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleCompare}
                            disabled={!selectedFile || isLoading}
                            style={{
                                width: '100%',
                                padding: '9px',
                                background: selectedFile && !isLoading ? 'var(--blue)' : 'var(--bg-tertiary)',
                                color: selectedFile && !isLoading ? 'white' : 'var(--text-muted)',
                                border: `1px solid ${selectedFile && !isLoading ? 'var(--blue)' : 'var(--border)'}`,
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: selectedFile && !isLoading ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            <GitCompare size={14} />
                            {isLoading ? 'Comparing...' : 'Find changes'}
                        </button>
                    </>
                )}

                {result && (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                padding: '10px 12px',
                                background: 'var(--bg-primary)',
                                borderRadius: '6px',
                                marginBottom: '16px',
                                flexWrap: 'wrap',
                            }}
                        >
                            {result.summary.changed > 0 && (
                                <span style={{ fontSize: '12px', color: 'var(--orange)' }}>
                                    {result.summary.changed} modified
                                </span>
                            )}
                            {result.summary.deleted > 0 && (
                                <span style={{ fontSize: '12px', color: 'var(--red)' }}>
                                    {result.summary.deleted} deleted
                                </span>
                            )}
                            {result.summary.unchanged > 0 && (
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {result.summary.unchanged} unchanged
                                </span>
                            )}
                            {totalChanged === 0 && (
                                <span style={{ fontSize: '12px', color: 'var(--green)' }}>
                                    ✓ No changes detected
                                </span>
                            )}
                        </div>

                        <DiffSection
                            title="Modified"
                            files={result.changed}
                            color="var(--orange)"
                            bg="var(--orange-subtle)"
                            badge="M"
                        />
                        <DiffSection
                            title="Deleted"
                            files={result.deleted}
                            color="var(--red)"
                            bg="var(--red-subtle)"
                            badge="D"
                        />

                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                                onClick={() => {
                                    onReset?.()
                                    setSelectedFile(null)
                                }}
                                style={{
                                    flex: 1,
                                    padding: '7px',
                                    background: 'var(--bg-tertiary)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '5px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                }}
                            >
                                Compare another
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    padding: '7px',
                                    background: 'var(--accent)',
                                    color: 'white',
                                    border: '1px solid var(--accent)',
                                    borderRadius: '5px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Done — select files
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}