# github.ts

Service de lecture/écriture de fichiers JSON via l'API REST GitHub.
Utilise les variables d'environnement du fichier .env (voir \_env).

Endpoints utilisés :
    GET  /users/{username}/repos                    → lister les repos publics d'un user
    GET  /user/repos                                → lister tous les repos (public + private) du token
    GET  /repos/{owner}/{repo}/contents/{path}      → lire un fichier
    PUT  /repos/{owner}/{repo}/contents/{path}      → créer ou mettre à jour un fichier

Comment obtenir un GitHub Token:
https://github.com/settings/tokens?type=beta
    Aller sur GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
    Generate new token, de type repo (full control)

Doc officielle : 
    https://docs.github.com/fr/rest/repos/repos?apiVersion=2022-11-28
    https://docs.github.com/fr/rest/repos/contents?apiVersion=2022-11-28


## branches

curl https://api.github.com/repos/shaan-Mx/myStorage/branches -L -H "Authorization: Bearer <TOKEN>" -H "X-GitHub-Api-Version: 2022-11-28"
  
## token

Fine-grained PAT (recommandé — github_pat_...)
Aller sur : GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
Sélectionner le token → Repository permissions → chercher Contents :
Contents    Read-only   ← ton cas actuel
            ↓ changer en
Contents    Read and write  ✅

Le fine-grained PAT nécessite aussi de sélectionner explicitement le repository cible (myStorage) dans la section "Repository access" du token — "All repositories" ou "Only select repositories".

## Pourquoi deux endpoints différents

L'API GitHub impose une distinction importante que la doc confirme :

Visibilité      : public
Endpoint        : GET /users/{username}/repos
Token requis    : Non (optionnel)

Visibilité      : private
Endpoint        : GET /user/repos
Token requis    : Oui — fine-grained PAT avec Metadata: Read, ou classic PAT avec scope repo

## Lister les repos

// Tous les repos (public + private) — défaut
const repos = await listRepos()

// Publics seulement, triés par activité
const repos = await listRepos({ visibility: "public", sort: "updated", direction: "desc" })

// Privés seulement
const repos = await listRepos({ visibility: "private" })

## samples

1. Lister tous les repos (public + private)
npx tsx src/scripts/sample-github.ts list

══ CONFIGURATION ══
  GITHUB_OWNER        shaan-Mx
  GITHUB_REPO         myStorage
  GITHUB_BRANCH       main
  GITHUB_TOKEN        github_pat************vlyn
  DATA_SOURCE         github

══ LIST REPOS  [all] ══
ℹ  Owner : shaan-Mx
ℹ  Endpoint : GET /user/repos

✅ 2 repo(s) trouvé(s) pour "shaan-Mx" [visibility: all]

  1. myStorage [public]
  full_name           shaan-Mx/myStorage
  language            HTML
  description         data storage
  default_branch      master
  stars / forks       ⭐ 0  🍴 0
  pushed_at           2026-02-17T22:17:05Z
  clone_url           https://github.com/shaan-Mx/myStorage.git

  2. project-api [public]
  full_name           shaan-Mx/project-api
  language            Vue
  description         (aucune)
  default_branch      master
  stars / forks       ⭐ 0  🍴 0
  pushed_at           2026-02-16T01:42:48Z
  clone_url           https://github.com/shaan-Mx/project-api.git

────────────────────────────────────────────────────────────
✔  2 repo(s) listés (1493ms)
  publics / privés    2 / 0
  langages            HTML, Vue

2. Publics uniquement
npx tsx src/scripts/sample-github.ts list:public

3. Privés uniquement
npx tsx src/scripts/sample-github.ts list:private

══ CONFIGURATION ══
  GITHUB_OWNER        shaan-Mx
  GITHUB_REPO         myStorage
  GITHUB_BRANCH       main
  GITHUB_TOKEN        github_pat************vlyn
  DATA_SOURCE         github

══ LIST REPOS  [private] ══
ℹ  Owner : shaan-Mx
ℹ  Endpoint : GET /user/repos

✅ 0 repo(s) trouvé(s) pour "shaan-Mx" [visibility: private]
⚠  Aucun repo trouvé — vérifiez GITHUB_OWNER et GITHUB_TOKEN

4. Lire un fichier JSON depuis GitHub
npx tsx src/scripts/sample-github.ts read json/tuto-api-products-full.json

══ CONFIGURATION ══
  GITHUB_OWNER        shaan-Mx
  GITHUB_REPO         myStorage
  GITHUB_BRANCH       master
  GITHUB_TOKEN        github_pat************vlyn
  DATA_SOURCE         github

══ READ FILE ══
ℹ  Fichier : json/tuto-api-products-full.json
ℹ  Repo    : shaan-Mx/myStorage
ℹ  Branch  : master

✔  Fichier lu avec succès (774ms)
  sha                 3cbc0eb042a1bc5efa54e696a4ec2deee82eb821
  items               156

Aperçu (2 premiers éléments) :
  [
    {
      "id": "14ea3aef",
      "title": "Generic Soft Keyboard",
      "category": "3dd19955-32de-4aa9-bd63-60c21070c1cc"
    },
    {
      "id": "b2d3f4f7",
      "title": "Unbranded Fresh Ball",
      "category": "3dd19955-32de-4aa9-bd63-60c21070c1cc"
    }
  ]

5. Vérifier qu'une écriture est possible (dry-run, rien n'est écrit)
npx tsx src/scripts/sample-github.ts write json/products.json

══ CONFIGURATION ══
  GITHUB_OWNER        shaan-Mx
  GITHUB_REPO         myStorage
  GITHUB_BRANCH       master
  GITHUB_TOKEN        github_pat************vlyn
  DATA_SOURCE         github

══ WRITE FILE ══
ℹ  Fichier  : json/products.json
⚠  Mode DRY-RUN — aucune écriture réelle (passez --write pour écrire)

✔  Accès en lecture OK, sha=fe51488c7066f6687ef680d6bfaa4f7768ef205c
✔  Écriture possible (token et droits OK)

Note : write sans --write est toujours un dry-run — il lit le fichier pour vérifier que l'accès et le sha sont OK, mais n'écrit rien. Le flag --write est explicitement requis pour déclencher une vraie écriture.

6. Écriture réelle (ajoute un item de test dans le fichier)
npx tsx src/scripts/sample-github.ts write json/products.json --write

══ CONFIGURATION ══
  GITHUB_OWNER        shaan-Mx
  GITHUB_REPO         myStorage
  GITHUB_BRANCH       master
  GITHUB_TOKEN        github_pat************vlyn
  DATA_SOURCE         github

══ WRITE FILE ══
ℹ  Fichier  : json/products.json
ℹ  Lecture du sha courant...
✅ Fichier "json/products.json" mis à jour. Nouveau sha: fb5568e00aa7ab44b4d5a10c5c873fdecae27dfc
✔  Écriture réussie (3797ms)
⚠  N'oubliez pas de supprimer l'item de test du fichier !

7. Enchaîner tous les tests d'un coup
npx tsx src/scripts/sample-github.ts all

## github.ts OU file.ts

products.ts / users.ts
  │
  └─ readFromJson(filePath)  /  writeToJson(data, filePath)
            │
            ▼
         file.ts  ──── DATA_SOURCE=local  →  fs.readFile / fs.writeFile
                   └── DATA_SOURCE=github →  readFromGitHub / writeToGitHub
                                                    ↑
                                              github.ts

## Le problème du sha — résolu par le cache interne

read  → GitHub retourne { data, sha }
          sha stocké dans _shaCache["json/products.json"]
                    ↓
write → sha récupéré depuis _shaCache
          envoyé au PUT GitHub
          sha invalidé après succès  ← la prochaine lecture le rafraîchira

