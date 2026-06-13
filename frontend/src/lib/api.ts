import {
    LoadRepoResponse,
    BundleRequest,
    BundleResponse,
    CompareResponse,
    TreeItem,
    TreeNode,
} from '@/types'

const API_BASE = 'http://localhost:8000/api'

// ──────────────────────────────────────────────
// API CALLS
// ──────────────────────────────────────────────

export async function loadRepo(
    url: string,
    token: string | null,
    branch: string | null = null
): Promise<LoadRepoResponse> {
    const res = await fetch(`${API_BASE}/repo/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, token: token || null, branch: branch || null }),
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to load repository.')
    }

    return res.json()
}

export async function generateBundle(
    body: BundleRequest
): Promise<BundleResponse> {
    const res = await fetch(`${API_BASE}/bundle/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to generate bundle.')
    }

    return res.json()
}

export async function compareBundle(
    owner: string,
    repo: string,
    token: string | null,
    previousBundleFile: File
): Promise<CompareResponse> {
    // Compare uses multipart form data because we're uploading a file
    const formData = new FormData()
    formData.append('previous_bundle', previousBundleFile)
    formData.append(
        'request',
        JSON.stringify({ owner, repo, token: token || null })
    )

    const res = await fetch(`${API_BASE}/bundle/compare`, {
        method: 'POST',
        body: formData,
    })

    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to compare bundles.')
    }

    return res.json()
}

// ──────────────────────────────────────────────
// TREE HELPERS
// ──────────────────────────────────────────────

// Converts the flat list GitHub gives us into a nested tree
// that the FileTree component can render
export function buildTreeNodes(flatTree: TreeItem[]): TreeNode[] {
    const root: TreeNode[] = []
    const map: Record<string, TreeNode> = {}

    // Sort so folders come before files at each level
    const sorted = [...flatTree].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
        return a.path.localeCompare(b.path)
    })

    for (const item of sorted) {
        const parts = item.path.split('/')
        const name = parts[parts.length - 1]

        const node: TreeNode = {
            name,
            path: item.path,
            type: item.type,
            size: item.size,
            extension: item.extension,
            is_binary: item.is_binary,
            ignored: item.ignored,
            children: [],
        }

        map[item.path] = node

        if (parts.length === 1) {
            // Top-level item
            root.push(node)
        } else {
            // Find parent folder and add this as a child
            const parentPath = parts.slice(0, -1).join('/')
            if (map[parentPath]) {
                map[parentPath].children.push(node)
            }
        }
    }

    return root
}

// Given a folder node, returns all selectable file paths underneath it
// Selectable = not binary, not ignored
export function getSelectableFilesUnder(node: TreeNode): string[] {
    const paths: string[] = []

    function walk(n: TreeNode) {
        if (n.type === 'blob') {
            if (!n.is_binary && !n.ignored) {
                paths.push(n.path)
            }
        } else {
            for (const child of n.children) {
                walk(child)
            }
        }
    }

    walk(node)
    return paths
}

// Returns all selectable file paths in the entire tree
export function getAllSelectableFiles(nodes: TreeNode[]): string[] {
    return nodes.flatMap((node) => getSelectableFilesUnder(node))
}

// Formats bytes into a human readable size string
export function formatSize(bytes: number): string {
    if (bytes === 0) return ''
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}