export interface TreeItem {
    path: string
    type: 'blob' | 'tree'
    size: number
    sha: string
    extension: string
    is_binary: boolean
    ignored: boolean
}

export interface LoadRepoResponse {
    owner: string
    repo: string
    default_branch: string
    branch: string
    branches: string[]
    tree: TreeItem[]
    ascii_tree: string
}

export interface BundleRequest {
    owner: string
    repo: string
    token: string | null
    branch?: string | null
    files: string[]
    ascii_tree: string | null
    include_structure: boolean
    // strip_empty_lines removed — always applied on backend now
}

export interface BundleResponse {
    bundle: string
    token_estimate: number
    file_count: number
}

export interface CompareResponse {
    files: string[]      // file paths found in the uploaded bundle
    changed: string[]
    deleted: string[]
    unchanged: string[]
    summary: {
        changed: number
        deleted: number
        unchanged: number
    }
}

export interface TreeNode {
    name: string
    path: string
    type: 'blob' | 'tree'
    size: number
    extension: string
    is_binary: boolean
    ignored: boolean
    children: TreeNode[]
}