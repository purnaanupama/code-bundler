// Represents a single file or folder from the GitHub repo tree
export interface TreeItem {
    path: string
    type: 'blob' | 'tree'   // blob = file, tree = folder
    size: number
    sha: string
    extension: string
    is_binary: boolean
    ignored: boolean
}

// What we get back when we load a repo
export interface LoadRepoResponse {
    owner: string
    repo: string
    default_branch: string
    branch: string
    branches: string[]
    tree: TreeItem[]
    ascii_tree: string
}

// What we send when generating a bundle
export interface BundleRequest {
    owner: string
    repo: string
    token: string | null
    branch?: string | null
    files: string[]
    ascii_tree: string | null
    include_structure: boolean
    strip_empty_lines: boolean
}

// What we get back after generating a bundle
export interface BundleResponse {
    bundle: string
    token_estimate: number
    file_count: number
}

// What we get back after comparing with a previous bundle
export interface CompareResponse {
    changed: string[]
    added: string[]
    deleted: string[]
    unchanged: string[]
    summary: {
        changed: number
        added: number
        deleted: number
        unchanged: number
    }
}

// A node in our rendered file tree (nested structure)
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