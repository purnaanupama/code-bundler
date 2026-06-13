'use client'

import { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, File } from 'lucide-react'
import { TreeNode } from '@/types'
import { getSelectableFilesUnder, formatSize } from '@/lib/api'

interface FileTreeProps {
    nodes: TreeNode[]
    selectedFiles: Set<string>
    onSelectionChange: (files: Set<string>) => void
    changedFiles?: Set<string>   // files changed since last bundle (orange)
    addedFiles?: Set<string>     // new files not in last bundle (green)
    deletedFiles?: Set<string>   // files deleted since last bundle (red)
}

interface TreeNodeRowProps {
    node: TreeNode
    depth: number
    selectedFiles: Set<string>
    onSelectionChange: (files: Set<string>) => void
    changedFiles: Set<string>
    addedFiles: Set<string>
    deletedFiles: Set<string>
}

// ── File extension → colour mapping ──────────────────────────
function getExtColor(ext: string): string {
    const map: Record<string, string> = {
        py: '#3572A5',
        js: '#f1e05a',
        jsx: '#61dafb',
        ts: '#3178c6',
        tsx: '#61dafb',
        css: '#563d7c',
        scss: '#c6538c',
        html: '#e34c26',
        json: '#8bc34a',
        md: '#8b949e',
        yaml: '#cb171e',
        yml: '#cb171e',
        toml: '#9c4221',
        sh: '#89e051',
        bash: '#89e051',
        go: '#00add8',
        rs: '#dea584',
        java: '#b07219',
        kt: '#A97BFF',
        swift: '#F05138',
        php: '#4F5D95',
        rb: '#701516',
        sql: '#e38c00',
        tf: '#844FBA',
        vue: '#41b883',
        svelte: '#ff3e00',
        prisma: '#2D3748',
        graphql: '#e535ab',
        dart: '#00B4AB',
    }
    return map[ext] || '#8b949e'
}

// ── Diff badge shown next to changed/added files ──────────────
function DiffBadge({ type }: { type: 'changed' | 'added' | 'deleted' }) {
    const styles = {
        changed: { bg: 'var(--orange-subtle)', color: 'var(--orange)', label: 'M' },
        added: { bg: 'var(--green-subtle)', color: 'var(--green)', label: 'A' },
        deleted: { bg: 'var(--red-subtle)', color: 'var(--red)', label: 'D' },
    }
    const s = styles[type]
    return (
        <span style={{
            background: s.bg,
            color: s.color,
            borderRadius: '3px',
            padding: '0 4px',
            fontSize: '10px',
            fontWeight: 700,
            fontFamily: 'monospace',
            marginLeft: '6px',
            flexShrink: 0,
        }}>
            {s.label}
        </span>
    )
}

// ── Single row in the tree (file or folder) ───────────────────
function TreeNodeRow({
    node,
    depth,
    selectedFiles,
    onSelectionChange,
    changedFiles,
    addedFiles,
    deletedFiles,
}: TreeNodeRowProps) {
    const [isOpen, setIsOpen] = useState(depth < 2)

    const isFolder = node.type === 'tree'
    const isDeleted = deletedFiles.has(node.path)

    // Work out checkbox state for this node
    const getCheckState = useCallback((): 'checked' | 'unchecked' | 'indeterminate' => {
        if (!isFolder) {
            return selectedFiles.has(node.path) ? 'checked' : 'unchecked'
        }
        const selectable = getSelectableFilesUnder(node)
        if (selectable.length === 0) return 'unchecked'
        const selectedCount = selectable.filter(p => selectedFiles.has(p)).length
        if (selectedCount === 0) return 'unchecked'
        if (selectedCount === selectable.length) return 'checked'
        return 'indeterminate'
    }, [isFolder, node, selectedFiles])

    const checkState = getCheckState()

    // Diff state for this node
    const diffType = changedFiles.has(node.path)
        ? 'changed'
        : addedFiles.has(node.path)
            ? 'added'
            : isDeleted
                ? 'deleted'
                : null

    // For folders — check if any child has a diff
    const folderHasDiff = isFolder && getSelectableFilesUnder(node).some(
        p => changedFiles.has(p) || addedFiles.has(p) || deletedFiles.has(p)
    )

    function handleCheck() {
        const next = new Set(selectedFiles)
        if (isFolder) {
            const selectable = getSelectableFilesUnder(node)
            if (checkState === 'checked') {
                selectable.forEach(p => next.delete(p))
            } else {
                selectable.forEach(p => next.add(p))
            }
        } else {
            if (selectedFiles.has(node.path)) {
                next.delete(node.path)
            } else {
                if (!node.is_binary && !node.ignored) {
                    next.add(node.path)
                }
            }
        }
        onSelectionChange(next)
    }

    const isDisabled = !isFolder && (node.is_binary || node.ignored)

    // Set indeterminate via ref (can't do this with just HTML attributes)
    const checkboxRef = useCallback((el: HTMLInputElement | null) => {
        if (el) el.indeterminate = checkState === 'indeterminate'
    }, [checkState])

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px 2px 0',
                    paddingLeft: `${depth * 16 + 8}px`,
                    borderRadius: '4px',
                    cursor: isDisabled ? 'default' : 'pointer',
                    opacity: isDisabled ? 0.4 : 1,
                    background: 'transparent',
                    userSelect: 'none',
                }}
                onMouseEnter={e => {
                    if (!isDisabled)
                        (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-tertiary)'
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                }}
                onClick={() => {
                    if (isFolder) setIsOpen(o => !o)
                    else if (!isDisabled) handleCheck()
                }}
            >
                {/* Expand/collapse chevron for folders */}
                <span style={{ width: '16px', flexShrink: 0, color: 'var(--text-muted)' }}>
                    {isFolder
                        ? isOpen
                            ? <ChevronDown size={14} />
                            : <ChevronRight size={14} />
                        : null}
                </span>

                {/* Checkbox — stop propagation so clicking it doesn't also toggle folder */}
                <span onClick={e => { e.stopPropagation(); handleCheck() }}>
                    <input
                        ref={checkboxRef}
                        type="checkbox"
                        checked={checkState === 'checked'}
                        onChange={() => { }}
                        disabled={isDisabled}
                        style={{ cursor: isDisabled ? 'default' : 'pointer' }}
                    />
                </span>

                {/* Folder or file icon */}
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {isFolder
                        ? isOpen
                            ? <FolderOpen size={15} color="#d29922" />
                            : <Folder size={15} color="#d29922" />
                        : <File size={14} color={getExtColor(node.extension)} />}
                </span>

                {/* File / folder name */}
                <span style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '13px',
                    color: isDeleted
                        ? 'var(--red)'
                        : diffType === 'added'
                            ? 'var(--green)'
                            : diffType === 'changed'
                                ? 'var(--orange)'
                                : 'var(--text-primary)',
                    textDecoration: isDeleted ? 'line-through' : 'none',
                }}>
                    {node.name}
                </span>

                {/* Diff badge (M / A / D) */}
                {diffType && <DiffBadge type={diffType} />}
                {!diffType && folderHasDiff && (
                    <span style={{
                        width: '6px', height: '6px',
                        borderRadius: '50%',
                        background: 'var(--orange)',
                        flexShrink: 0,
                        marginLeft: '6px',
                    }} />
                )}

                {/* File size */}
                {!isFolder && node.size > 0 && (
                    <span style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        flexShrink: 0,
                        marginLeft: '4px',
                    }}>
                        {formatSize(node.size)}
                    </span>
                )}
            </div>

            {/* Render children if folder is open */}
            {isFolder && isOpen && (
                <div>
                    {node.children.map(child => (
                        <TreeNodeRow
                            key={child.path}
                            node={child}
                            depth={depth + 1}
                            selectedFiles={selectedFiles}
                            onSelectionChange={onSelectionChange}
                            changedFiles={changedFiles}
                            addedFiles={addedFiles}
                            deletedFiles={deletedFiles}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Main FileTree component ───────────────────────────────────
export default function FileTree({
    nodes,
    selectedFiles,
    onSelectionChange,
    changedFiles = new Set(),
    addedFiles = new Set(),
    deletedFiles = new Set(),
}: FileTreeProps) {
    if (nodes.length === 0) {
        return (
            <div style={{ padding: '24px', color: 'var(--text-muted)', textAlign: 'center' }}>
                No files to display.
            </div>
        )
    }

    return (
        <div style={{ padding: '8px 0' }}>
            {nodes.map(node => (
                <TreeNodeRow
                    key={node.path}
                    node={node}
                    depth={0}
                    selectedFiles={selectedFiles}
                    onSelectionChange={onSelectionChange}
                    changedFiles={changedFiles}
                    addedFiles={addedFiles}
                    deletedFiles={deletedFiles}
                />
            ))}
        </div>
    )
}