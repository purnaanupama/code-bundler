'use client'

import { useState, useCallback } from 'react'
import { GitCompare, X, ChevronDown, ChevronUp } from 'lucide-react'
import GithubIcon from '@/components/GithubIcon'
import FileTree from '@/components/FileTree'
import BundleOptions from '@/components/BundleOptions'
import BundleOutput from '@/components/BundleOutput'
import ComparePanel from '@/components/ComparePanel'
import {
  loadRepo,
  generateBundle,
  compareBundle,
  buildTreeNodes,
  getAllSelectableFiles,
} from '@/lib/api'
import {
  LoadRepoResponse,
  BundleResponse,
  CompareResponse,
  TreeNode,
} from '@/types'

// ── Small helper components ───────────────────────────────────

function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: '12px', padding: '12px 16px',
      background: 'var(--red-subtle)', border: '1px solid var(--red)',
      borderRadius: '6px', marginBottom: '16px',
    }}>
      <span style={{ fontSize: '13px', color: 'var(--red)', lineHeight: 1.5 }}>{message}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--red)', flexShrink: 0, padding: '0',
      }}>
        <X size={15} />
      </button>
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.6px',
      padding: '0 0 8px 0', marginBottom: '8px',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span>{title}</span>
      {count !== undefined && (
        <span style={{
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '1px 7px',
          fontSize: '11px', fontWeight: 500,
          color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0,
        }}>
          {count}
        </span>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────

export default function Home() {
  // Repo input state
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [branch, setBranch] = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)
  const [tokenVisible, setTokenVisible] = useState(false)

  // Repo data state
  const [repoData, setRepoData] = useState<LoadRepoResponse | null>(null)
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([])

  // Selection state
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  // Bundle options
  const [includeStructure, setIncludeStructure] = useState(true)
  const [stripEmptyLines, setStripEmptyLines] = useState(false)

  // Output state
  const [bundleResult, setBundleResult] = useState<BundleResponse | null>(null)

  // Compare state
  const [showCompare, setShowCompare] = useState(false)
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null)

  // Loading / error state
  const [loadingRepo, setLoadingRepo] = useState(false)
  const [loadingBundle, setLoadingBundle] = useState(false)
  const [loadingCompare, setLoadingCompare] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Selectable file count (non-binary, non-ignored files only)
  const totalSelectable = treeNodes.length > 0
    ? getAllSelectableFiles(treeNodes).length
    : 0

  // ── Load repo ───────────────────────────────────────────────
  async function handleLoadRepo(branchOverride?: string | null) {
    if (!url.trim()) return
    setError(null)
    setLoadingRepo(true)
    setRepoData(null)
    setTreeNodes([])
    setSelectedFiles(new Set())
    setBundleResult(null)
    setCompareResult(null)
    setShowCompare(false)

    try {
      const data = await loadRepo(
        url.trim(),
        token.trim() || null,
        branchOverride !== undefined ? branchOverride : branch
      )
      const nodes = buildTreeNodes(data.tree)
      setRepoData(data)
      setBranch(data.branch)
      setTreeNodes(nodes)

      // Auto-select all selectable files by default
      const allSelectable = getAllSelectableFiles(nodes)
      setSelectedFiles(new Set(allSelectable))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load repository.')
    } finally {
      setLoadingRepo(false)
    }
  }

  // ── Generate bundle ─────────────────────────────────────────
  async function handleGenerate() {
    if (!repoData || selectedFiles.size === 0) return
    setError(null)
    setLoadingBundle(true)
    setBundleResult(null)

    try {
      const result = await generateBundle({
        owner: repoData.owner,
        repo: repoData.repo,
        token: token.trim() || null,
        branch: branch,
        files: Array.from(selectedFiles),
        ascii_tree: repoData.ascii_tree,
        include_structure: includeStructure,
        strip_empty_lines: stripEmptyLines,
      })
      setBundleResult(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate bundle.')
    } finally {
      setLoadingBundle(false)
    }
  }

  // ── Compare bundles ─────────────────────────────────────────
  async function handleCompare(file: File) {
    if (!repoData) return
    setError(null)
    setLoadingCompare(true)

    try {
      const result = await compareBundle(
        repoData.owner,
        repoData.repo,
        token.trim() || null,
        file
      )
      setCompareResult(result)

      // Auto-select only changed + added files in the tree
      const autoSelect = new Set([...result.changed, ...result.added])
      setSelectedFiles(autoSelect)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to compare bundles.')
    } finally {
      setLoadingCompare(false)
    }
  }

  const handleSelectionChange = useCallback((files: Set<string>) => {
    setSelectedFiles(files)
  }, [])

  // ── Select all / none helpers ───────────────────────────────
  function selectAll() {
    setSelectedFiles(new Set(getAllSelectableFiles(treeNodes)))
  }
  function selectNone() {
    setSelectedFiles(new Set())
  }

  // Sets for diff highlighting in the tree
  const changedSet = new Set(compareResult?.changed ?? [])
  const addedSet = new Set(compareResult?.added ?? [])
  const deletedSet = new Set(compareResult?.deleted ?? [])

  // ── Render ──────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>

      {/* ── Repo input card ── */}
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '20px', marginBottom: '20px',
      }}>
        <SectionHeader title="Repository" />

        {/* URL row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--bg-primary)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '0 12px',
          }}>
            <GithubIcon size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="https://github.com/owner/repo"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLoadRepo()}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: '13px', padding: '10px 0',
              }}
            />
          </div>
          <button
            onClick={() => handleLoadRepo()}
            disabled={!url.trim() || loadingRepo}
            style={{
              padding: '0 20px', background: url.trim() && !loadingRepo ? 'var(--blue)' : 'var(--bg-tertiary)',
              color: url.trim() && !loadingRepo ? 'white' : 'var(--text-muted)',
              border: `1px solid ${url.trim() && !loadingRepo ? 'var(--blue)' : 'var(--border)'}`,
              borderRadius: '6px', fontSize: '13px', fontWeight: 600,
              cursor: url.trim() && !loadingRepo ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
            }}
          >
            {loadingRepo ? 'Loading...' : 'Load Repo'}
          </button>
        </div>

        {/* PAT toggle */}
        <div>
          <button
            onClick={() => setShowToken(t => !t)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '12px',
              display: 'flex', alignItems: 'center', gap: '4px', padding: '0',
            }}
          >
            {showToken ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Private repo? Add Personal Access Token
          </button>

          {showToken && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--bg-primary)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '0 12px', marginTop: '8px',
            }}>
              <input
                type={tokenVisible ? 'text' : 'password'}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={e => setToken(e.target.value)}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontSize: '13px', padding: '10px 0',
                  fontFamily: 'monospace',
                }}
              />
              <button
                onClick={() => setTokenVisible(v => !v)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '11px', padding: '0',
                }}
              >
                {tokenVisible ? 'Hide' : 'Show'}
              </button>
            </div>
          )}
          {showToken && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Your token is only used to call the GitHub API and is never stored anywhere.
            </p>
          )}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {/* ── Main content (tree + options) ── */}
      {repoData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '16px',
          alignItems: 'start',
        }}>

          {/* Left column — file tree */}
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: '8px', overflow: 'hidden',
          }}>
            {/* Tree toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderBottom: '1px solid var(--border)',
              flexWrap: 'wrap', gap: '8px',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                {repoData.owner}/{repoData.repo}
              </span>
              {repoData.branches.length > 1 && (
                <select
                  value={branch || repoData.default_branch}
                  onChange={e => {
                    const selected = e.target.value
                    setBranch(selected)
                    handleLoadRepo(selected)
                  }}
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {repoData.branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              )}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={selectAll} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '11px', color: 'var(--blue)', padding: '0',
                }}>
                  Select all
                </button>
                <span style={{ color: 'var(--border)' }}>·</span>
                <button onClick={selectNone} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '11px', color: 'var(--text-muted)', padding: '0',
                }}>
                  None
                </button>
              </div>
            </div>

            {/* Tree */}
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <FileTree
                nodes={treeNodes}
                selectedFiles={selectedFiles}
                onSelectionChange={handleSelectionChange}
                changedFiles={changedSet}
                addedFiles={addedSet}
                deletedFiles={deletedSet}
              />
            </div>
          </div>

          {/* Right column — options + compare */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Options card */}
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '16px',
            }}>
              <SectionHeader title="Bundle options" count={selectedFiles.size} />
              <BundleOptions
                includeStructure={includeStructure}
                onIncludeStructureChange={setIncludeStructure}
                stripEmptyLines={stripEmptyLines}
                onStripEmptyLinesChange={setStripEmptyLines}
                selectedCount={selectedFiles.size}
                totalCount={totalSelectable}
                onGenerate={handleGenerate}
                isLoading={loadingBundle}
              />
            </div>

            {/* Compare button */}
            {!showCompare && (
              <button
                onClick={() => setShowCompare(true)}
                style={{
                  width: '100%', padding: '9px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px', fontSize: '13px',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
                onMouseEnter={e =>
                  ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blue)')
                }
                onMouseLeave={e =>
                  ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)')
                }
              >
                <GitCompare size={14} />
                Compare with previous bundle
              </button>
            )}

            {/* Compare panel */}
            {showCompare && (
              <ComparePanel
                owner={repoData.owner}
                repo={repoData.repo}
                token={token.trim() || null}
                onCompareComplete={setCompareResult}
                onClose={() => setShowCompare(false)}
                isLoading={loadingCompare}
                onCompare={handleCompare}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Bundle output ── */}
      {bundleResult && (
        <div style={{ marginTop: '20px' }}>
          <BundleOutput
            result={bundleResult}
            repoName={`${repoData?.owner}/${repoData?.repo}`}
          />
        </div>
      )}

      {/* ── Empty state ── */}
      {!repoData && !loadingRepo && (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          color: 'var(--text-muted)',
        }}>
          <GithubIcon size={40} color="var(--border)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Paste a GitHub URL above to get started
          </div>
          <div style={{ fontSize: '13px' }}>
            Works with public repos. Add a Personal Access Token for private repos.
          </div>
        </div>
      )}
    </div>
  )
}