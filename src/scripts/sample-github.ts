/**
 * sample-github.ts
 * Script de test en terminal pour toutes les fonctions de github.ts
 *
 * Usage :
 *   npx tsx scripts/test-github.ts [commande] [options]
 *
 * Commandes disponibles :
 *   list              → liste tous les repos (public + private)
 *   list:public       → liste les repos publics seulement
 *   list:private      → liste les repos privés seulement
 *   read  <path>      → lit un fichier JSON du repo configuré
 *   write <path>      → écrit un fichier de test (dry-run par défaut)
 *   all               → enchaîne tous les tests
 *
 * Exemples :
 *   npx tsx scripts/sample-github.ts list
 *   npx tsx scripts/sample-github.ts list:public
 *   npx tsx scripts/sample-github.ts read src/data/products.json
 *   npx tsx src/scripts/sample-github.ts write json/products.json --write
 *   npx tsx scripts/sample-github.ts all
 */

import dotenv from "dotenv"
dotenv.config()

import {
  listRepos,
  readFromGitHub,
  writeToGitHub,
  type GitHubRepo,
  type RepoVisibility,
} from "../utils/github"   // ← extension .js requise avec ESM/tsx

// ─── Utilitaires d'affichage ──────────────────────────────────────────────────

const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  blue:   "\x1b[34m",
  cyan:   "\x1b[36m",
  red:    "\x1b[31m",
  gray:   "\x1b[90m",
  white:  "\x1b[97m",
}

const fmt = {
  title:   (s: string) => `\n${C.bold}${C.cyan}══ ${s} ══${C.reset}`,
  ok:      (s: string) => `${C.green}✔${C.reset}  ${s}`,
  err:     (s: string) => `${C.red}✖${C.reset}  ${s}`,
  info:    (s: string) => `${C.blue}ℹ${C.reset}  ${s}`,
  warn:    (s: string) => `${C.yellow}⚠${C.reset}  ${s}`,
  key:     (k: string, v: unknown) => `  ${C.gray}${k.padEnd(20)}${C.reset}${v}`,
  sep:     () => `${C.dim}${"─".repeat(60)}${C.reset}`,
  badge:   (s: string, color: string) => `${color}[${s}]${C.reset}`,
}

function elapsed(start: number): string {
  return `${C.dim}(${Date.now() - start}ms)${C.reset}`
}

// ─── Affichage d'un repo ──────────────────────────────────────────────────────

function printRepo(repo: GitHubRepo, index: number): void {
  const visibility = repo.private
    ? fmt.badge("private", C.yellow)
    : fmt.badge("public", C.green)
  const fork = repo.fork ? fmt.badge("fork", C.gray) : ""
  const lang = repo.language ? `${C.cyan}${repo.language}${C.reset}` : `${C.gray}—${C.reset}`

  console.log(`\n  ${C.bold}${index + 1}. ${repo.name}${C.reset} ${visibility} ${fork}`)
  console.log(fmt.key("full_name",     repo.full_name))
  console.log(fmt.key("language",      lang))
  console.log(fmt.key("description",   repo.description ?? `${C.gray}(aucune)${C.reset}`))
  console.log(fmt.key("default_branch",repo.default_branch))
  console.log(fmt.key("stars / forks", `⭐ ${repo.stargazers_count}  🍴 ${repo.forks_count}`))
  console.log(fmt.key("pushed_at",     repo.pushed_at))
  console.log(fmt.key("clone_url",     `${C.dim}${repo.clone_url}${C.reset}`))
  if (repo.topics?.length) {
    console.log(fmt.key("topics", repo.topics.map(t => `#${t}`).join("  ")))
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function testListRepos(visibility: RepoVisibility = "all"): Promise<void> {
  console.log(fmt.title(`LIST REPOS  [${visibility}]`))
  console.log(fmt.info(`Owner : ${C.bold}${process.env.GITHUB_OWNER || "(non défini)"}${C.reset}`))
  console.log(fmt.info(`Endpoint : ${visibility === "public" ? "GET /users/{u}/repos" : "GET /user/repos"}`))
  console.log()

  const start = Date.now()
  const repos = await listRepos({
    visibility,
    sort:      "updated",
    direction: "desc",
  })

  if (repos.length === 0) {
    console.log(fmt.warn("Aucun repo trouvé — vérifiez GITHUB_OWNER et GITHUB_TOKEN"))
    return
  }

  repos.forEach((repo, i) => printRepo(repo, i))

  console.log()
  console.log(fmt.sep())
  console.log(fmt.ok(`${repos.length} repo(s) listés ${elapsed(start)}`))

  // Résumé
  const pub  = repos.filter(r => !r.private).length
  const priv = repos.filter(r =>  r.private).length
  const langs = [...new Set(repos.map(r => r.language).filter(Boolean))]
  console.log(fmt.key("publics / privés", `${pub} / ${priv}`))
  console.log(fmt.key("langages", langs.join(", ") || "—"))
}

// ─────────────────────────────────────────────────────────────────────────────

async function testReadFile(filePath: string): Promise<void> {
  console.log(fmt.title("READ FILE"))
  console.log(fmt.info(`Fichier : ${C.bold}${filePath}${C.reset}`))
  console.log(fmt.info(`Repo    : ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`))
  console.log(fmt.info(`Branch  : ${process.env.GITHUB_BRANCH || "main"}`))
  console.log()

  const start = Date.now()
  const { data, sha } = await readFromGitHub<unknown>(filePath)

  if (!sha) {
    console.log(fmt.err("Lecture échouée — vérifiez le chemin et les droits du token"))
    return
  }

  console.log(fmt.ok(`Fichier lu avec succès ${elapsed(start)}`))
  console.log(fmt.key("sha",      sha))
  console.log(fmt.key("items",    Array.isArray(data) ? data.length : "N/A (objet)"))
  console.log()

  // Aperçu des 2 premiers éléments
  const preview = Array.isArray(data) ? data.slice(0, 2) : [data]
  console.log(`${C.bold}Aperçu (2 premiers éléments) :${C.reset}`)
  console.log(JSON.stringify(preview, null, 2)
    .split("\n")
    .map(l => `  ${C.dim}${l}${C.reset}`)
    .join("\n")
  )
}

// ─────────────────────────────────────────────────────────────────────────────

async function testWriteFile(filePath: string, dryRun = true): Promise<void> {
  console.log(fmt.title("WRITE FILE"))
  console.log(fmt.info(`Fichier  : ${C.bold}${filePath}${C.reset}`))

  if (dryRun) {
    console.log(fmt.warn("Mode DRY-RUN — aucune écriture réelle (passez --write pour écrire)"))
    console.log()

    // Simule la lecture pour vérifier l'accès
    const { sha } = await readFromGitHub<unknown>(filePath)
    if (sha) {
      console.log(fmt.ok(`Accès en lecture OK, sha=${sha}`))
      console.log(fmt.ok("Écriture possible (token et droits OK)"))
    } else {
      console.log(fmt.err("Accès en lecture échoué — écriture impossible"))
    }
    return
  }

  // Écriture réelle : lit d'abord pour obtenir le sha, puis ajoute un item de test
  console.log(fmt.info("Lecture du sha courant..."))
  const { data, sha } = await readFromGitHub<Record<string, unknown>>(filePath)

  if (!sha) {
    console.log(fmt.err("Impossible de lire le sha — abandon"))
    return
  }

  const testItem = {
    _test:     true,
    _written:  new Date().toISOString(),
    _script:   "test-github.ts",
  }

  const newData = [...data, testItem]
  const start = Date.now()
  const ok = await writeToGitHub(
    newData,
    filePath,
    sha,
    "test: ajout item de test via test-github.ts"
  )

  if (ok) {
    console.log(fmt.ok(`Écriture réussie ${elapsed(start)}`))
    console.log(fmt.warn("N'oubliez pas de supprimer l'item de test du fichier !"))
  } else {
    console.log(fmt.err("Écriture échouée — vérifiez les droits du token (Contents: Write)"))
  }
}

// ─── Affichage de la config ───────────────────────────────────────────────────

function printConfig(): void {
  console.log(fmt.title("CONFIGURATION"))
  const token = process.env.GITHUB_TOKEN
  const tokenDisplay = token
    ? `${token.slice(0, 10)}${"*".repeat(12)}${token.slice(-4)}`
    : `${C.red}(non défini)${C.reset}`

  console.log(fmt.key("GITHUB_OWNER",  process.env.GITHUB_OWNER  || `${C.red}(non défini)${C.reset}`))
  console.log(fmt.key("GITHUB_REPO",   process.env.GITHUB_REPO   || `${C.red}(non défini)${C.reset}`))
  console.log(fmt.key("GITHUB_BRANCH", process.env.GITHUB_BRANCH || "main"))
  console.log(fmt.key("GITHUB_TOKEN",  tokenDisplay))
  console.log(fmt.key("DATA_SOURCE",   process.env.DATA_SOURCE   || "local"))
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const [,, cmd = "help", arg1, arg2] = process.argv
  const writeMode = process.argv.includes("--write")

  console.log(`\n${C.bold}${C.white}GitHub API — Script de test${C.reset}`)
  console.log(fmt.sep())
  printConfig()

  switch (cmd) {
    case "list":
      await testListRepos("all")
      break

    case "list:public":
      await testListRepos("public")
      break

    case "list:private":
      await testListRepos("private")
      break

    case "read":
      if (!arg1) {
        console.log(fmt.err("Chemin manquant. Exemple : npx tsx scripts/test-github.ts read src/data/products.json"))
        process.exit(1)
      }
      await testReadFile(arg1)
      break

    case "write":
      if (!arg1) {
        console.log(fmt.err("Chemin manquant. Exemple : npx tsx scripts/test-github.ts write src/data/products.json [--write]"))
        process.exit(1)
      }
      await testWriteFile(arg1, !writeMode)
      break

    case "all": {
      const filePath = arg1 || process.env.PRODUCTS_FILE_PATH || "src/data/products.json"
      await testListRepos("all")
      await testListRepos("public")
      await testReadFile(filePath)
      await testWriteFile(filePath, true)   // toujours dry-run dans "all"
      break
    }

    default:
      console.log(`
${C.bold}Commandes disponibles :${C.reset}

  ${C.cyan}list${C.reset}                     Tous les repos (public + private)
  ${C.cyan}list:public${C.reset}              Repos publics uniquement
  ${C.cyan}list:private${C.reset}             Repos privés uniquement
  ${C.cyan}read${C.reset}  <path>             Lit un fichier JSON du repo
  ${C.cyan}write${C.reset} <path> [--write]   Vérifie (ou écrit) un fichier JSON
  ${C.cyan}all${C.reset}   [path]             Enchaîne tous les tests (read/write en dry-run)

${C.bold}Exemples :${C.reset}

  npx tsx scripts/test-github.ts list
  npx tsx scripts/test-github.ts list:public
  npx tsx scripts/test-github.ts read src/data/products.json
  npx tsx scripts/test-github.ts write src/data/products.json
  npx tsx scripts/test-github.ts write src/data/products.json --write
  npx tsx scripts/test-github.ts all
  npx tsx scripts/test-github.ts all src/data/users.json
`)
  }

  console.log()
}

main().catch((err) => {
  console.error(fmt.err(`Erreur fatale : ${err.message}`))
  process.exit(1)
})