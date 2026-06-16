'use client'

import { Layers, Zap } from 'lucide-react'

interface BundleOptionsProps {
    includeStructure: boolean
    onIncludeStructureChange: (val: boolean) => void
    selectedCount: number
    totalCount: number
    onGenerate: () => void
    isLoading: boolean
}

interface ToggleRowProps {
    icon: React.ReactNode
    label: string
    description: string
    checked: boolean
    onChange: (val: boolean) => void
}

function ToggleRow({ icon, label, description, checked, onChange }: ToggleRowProps) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                <span style={{ color: 'var(--text-secondary)', marginTop: '1px', flexShrink: 0 }}>
                    {icon}
                </span>
                <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {description}
                    </div>
                </div>
            </div>

            <div
                onClick={() => onChange(!checked)}
                style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '10px',
                    background: checked ? 'var(--accent)' : 'var(--bg-tertiary)',
                    border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '2px',
                        left: checked ? '18px' : '2px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: 'white',
                        transition: 'left 0.2s ease',
                    }}
                />
            </div>
        </div>
    )
}

export default function BundleOptions({
    includeStructure,
    onIncludeStructureChange,
    selectedCount,
    totalCount,
    onGenerate,
    isLoading,
}: BundleOptionsProps) {
    const canGenerate = selectedCount > 0 && !isLoading

    return (
        <div>
            <ToggleRow
                icon={<Layers size={15} />}
                label="Include project structure"
                description="Adds the full folder tree at the top of the bundle so the AI understands the project layout"
                checked={includeStructure}
                onChange={onIncludeStructureChange}
            />

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0 0',
                }}
            >
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {selectedCount === 0
                        ? 'No files selected'
                        : `${selectedCount} of ${totalCount} files selected`}
                </span>
            </div>

            <button
                onClick={onGenerate}
                disabled={!canGenerate}
                style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '10px',
                    background: canGenerate ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: canGenerate ? 'white' : 'var(--text-muted)',
                    border: `1px solid ${canGenerate ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: canGenerate ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                }}
                onMouseEnter={e => {
                    if (canGenerate)
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)'
                }}
                onMouseLeave={e => {
                    if (canGenerate)
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'
                }}
            >
                <Zap size={14} />
                {isLoading ? 'Generating...' : 'Generate Bundle'}
            </button>
        </div>
    )
}