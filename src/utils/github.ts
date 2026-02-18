// src/utils/github.ts
import { config } from "../config/env"
//import dotenv from "dotenv"
//dotenv.config()

const GITHUB_API = "https://api.github.com"
const API_VERSION = "2022-11-28"
// ou utiliser config.github
const OWNER  = config.github.owner  || ""
const REPO   = config.github.repo   || ""
const BRANCH = config.github.branch || "main"
const TOKEN  = config.github.token  || ""

if (!OWNER || !REPO || !TOKEN) {
  console.warn(
    "⚠️  Variables GitHub manquantes dans .env : GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN"
  )
}

interface GitHubFileResponse {
  type: string
  name: string
  path: string
  sha:  string
  size: number
  content: string   // base64
  encoding: string
  download_url: string
  url: string
}

// ─── Headers communs ──────────────────────────────────────────────────────────
function buildHeaders(): Record<string, string> {
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${TOKEN}`,
    "X-GitHub-Api-Version": API_VERSION,
    "Content-Type": "application/json",
  }
}

/**
 * READ, WRITE, UPDATE
 */

/**
 * Lit un fichier JSON depuis GitHub.
 * Équivalent de readFromJson() dans file.ts.
 *
 * @param filePath  Chemin dans le repo, ex: "src/data/products.json"
 * @returns         Le tableau d'objets parsé, et le sha courant du fichier
 */
export async function readFromGitHub<T>(
  filePath: string
): Promise<{ data: T[]; sha: string }> {
  const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`
  try {
    const response = await fetch(url, {
      method:  "GET",
      headers: buildHeaders(),
    })
    if (!response.ok) {
      const err = await response.json() as { message: string }
      throw new Error(`GitHub API [${response.status}] : ${err.message}`)
    }
    const file = await response.json() as GitHubFileResponse
    if (file.type !== "file") {
      throw new Error(`Le chemin "${filePath}" n'est pas un fichier (type: ${file.type})`)
    }
    // Le contenu est encodé en base64 (avec des sauts de ligne dans la réponse)
    const decoded = Buffer.from(file.content, "base64").toString("utf-8")
    const parsed  = JSON.parse(decoded) as T[]
    return { data: parsed, sha: file.sha }
  } catch (error) {
    console.error("❌ Erreur lecture GitHub:", error)
    return { 
      data: [], 
      sha: "",
    }
  }
}

/**
 * Écrit (crée ou met à jour) un fichier JSON sur GitHub.
 * Équivalent de writeToJson() dans file.ts.
 *
 * ⚠️  Pour une mise à jour, le sha du fichier existant EST OBLIGATOIRE
 *     (récupéré via readFromGitHub).
 *
 * @param data      Tableau de données à sérialiser
 * @param filePath  Chemin dans le repo, ex: "src/data/products.json"
 * @param sha       SHA du fichier existant (requis si le fichier existe déjà)
 * @param message   Message de commit (optionnel)
 * @returns         true si succès
 */
export async function writeToGitHub<T>(
  data:     T[],
  filePath: string,
  sha?:     string,
  message?: string
): Promise<boolean> {
  const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${filePath}`
  // Le contenu doit être encodé en base64
  const jsonString = JSON.stringify(data, null, 2)
  const encoded    = Buffer.from(jsonString, "utf-8").toString("base64")
  const commitMessage = message ?? `chore: update ${filePath} via API [${new Date().toISOString()}]`
  const body: Record<string, unknown> = {
    message: commitMessage,
    content: encoded,
    branch:  BRANCH,
    committer: {
      name:  "API Server",
      email: "api@project-api.local",
    },
  }
  // sha requis pour une mise à jour (PUT sur un fichier existant)
  if (sha) {
    body.sha = sha
  }
  try {
    const response = await fetch(url, {
      method:  "PUT",
      headers: buildHeaders(),
      body:    JSON.stringify(body),
    })
    if (!response.ok) {
      const err = await response.json() as { message: string }
      throw new Error(`GitHub API [${response.status}] : ${err.message}`)
    }
    const result = await response.json() as { content: { sha: string } }
    console.log(`✅ Fichier "${filePath}" mis à jour. Nouveau sha: ${result.content?.sha}`)
    return true
  } catch (error) {
    console.error("❌ Erreur écriture GitHub:", error)
    return false
  }
}

/**
 * Applique une fonction de transformation sur les données et les réécrit.
 * Gère automatiquement le sha pour la mise à jour.
 *
 * Exemple :
 *   await updateGitHubFile("src/data/products.json", (items) => [...items, newItem])
 */
export async function updateGitHubFile<T>(
  filePath:  string,
  transform: (data: T[]) => T[],
  message?:  string
): Promise<boolean> {
  const { data, sha } = await readFromGitHub<T>(filePath)
  if (!sha) {
    console.error("❌ Impossible de lire le sha du fichier, abandon de la mise à jour.")
    return false
  }
  const updated = transform(data)
  return writeToGitHub(updated, filePath, sha, message)
}

// ─── Types : Repository ───────────────────────────────────────────────────────

/** Visibilité des repos à retourner */
export type RepoVisibility = "all" | "public" | "private"
/** Champ de tri */
export type RepoSort = "created" | "updated" | "pushed" | "full_name"
/** Options de listage */
export interface ListReposOptions {
  /**
   * "all"     → public + private (nécessite un token avec scope repo/Metadata:read)
   * "public"  → seulement les repos publics
   * "private" → seulement les repos privés
   * @default "all"
   */
  visibility?: RepoVisibility

  /** Champ de tri   @default "full_name" */
  sort?: RepoSort

  /** Sens du tri    @default "asc" */
  direction?: "asc" | "desc"

  /**
   * Nombre max de repos par page (1-100).
   * La fonction pagine automatiquement pour tout récupérer.
   * @default 100
   */
  perPage?: number
}
/** Données essentielles d'un repository retournées par l'API */
export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  description: string | null
  fork: boolean
  url: string
  clone_url: string
  ssh_url: string
  default_branch: string
  visibility: string // "public" | "private" | "internal"
  created_at: string
  updated_at: string
  pushed_at: string
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  topics: string[]
  owner: {
    login: string
    avatar_url: string
    html_url: string
  }
}

/**
 * Liste les repositories de GITHUB_OWNER.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Endpoint selon la visibilité demandée :                            │
 * │                                                                     │
 * │  "public" uniquement   → GET /users/{username}/repos                │
 * │    • Pas besoin de token ; retourne seulement les repos publics.    │
 * │                                                                     │
 * │  "all" ou "private"    → GET /user/repos                            │
 * │    • Requiert un token authentifié.                                 │
 * │    • Fine-grained PAT  : permission "Metadata" (read)               │
 * │    • Classic PAT       : scope "repo"                               │
 * │    • Filtre ensuite côté client si visibility = "private"           │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * La pagination est gérée automatiquement : tous les repos sont retournés, quelle que soit leur quantité.
 *
 * @param options  Options de filtrage, tri et pagination
 * @returns        Tableau de GitHubRepo (vide en cas d'erreur)
 *
 * @example
 *   // Tous les repos (public + private)
 *   const repos = await listRepos()
 *
 *   // Repos publics seulement, triés par date de mise à jour
 *   const repos = await listRepos({ visibility: "public", sort: "updated", direction: "desc" })
 *
 *   // Repos privés seulement
 *   const repos = await listRepos({ visibility: "private" })
 */
export async function listRepos(
  options: ListReposOptions = {}
): Promise<GitHubRepo[]> {
  const {
    visibility = "all",
    sort       = "full_name",
    direction  = "asc",
    perPage    = 100,
  } = options
  // Choix de l'endpoint selon la visibilité voulue
  // /user/repos  → authentifié, voit ses repos privés
  // /users/{u}/repos → public uniquement (pas besoin de token)
  const useAuthEndpoint = visibility !== "public"
  const baseUrl = useAuthEndpoint
    ? `${GITHUB_API}/user/repos`
    : `${GITHUB_API}/users/${OWNER}/repos`
  const allRepos: GitHubRepo[] = []
  let page = 1
  let hasMore = true
  try {
    while (hasMore) {
      const params = new URLSearchParams({
        sort,
        direction,
        per_page: String(perPage),
        page:     String(page),
        // "affiliation" non-nécessaire : on filtre manuellement sur owner
        // Pour /user/repos : on peut passer "type=owner" pour ne voir que ses propres repos
        ...(useAuthEndpoint ? { type: "owner" } : {}),
      })
      const url      = `${baseUrl}?${params.toString()}`
      const response = await fetch(url, {
        method:  "GET",
        headers: buildHeaders(),
      })
      if (!response.ok) {
        const err = await response.json() as { message: string }
        throw new Error(`GitHub API [${response.status}] : ${err.message}`)
      }
      const page_repos = await response.json() as GitHubRepo[]
      // Pagination : si la page retourne moins que perPage, c'est la dernière
      allRepos.push(...page_repos)
      hasMore = page_repos.length === perPage
      page++
    }
    // Filtre côté client si on veut seulement les privés
    // (l'API /user/repos ne filtre pas nativement par "private" seul avec fine-grained PAT)
    const filtered = visibility === "private"
      ? allRepos.filter(r => r.private)
      : allRepos
    console.log(
      `✅ ${filtered.length} repo(s) trouvé(s) pour "${OWNER}"` +
      ` [visibility: ${visibility}]`
    )
    return filtered
  } catch (error) {
    console.error("❌ Erreur listage des repositories GitHub:", error)
    return []
  }
}
