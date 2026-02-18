# PROMPT

comment creer localement un serveur api ? Vite, vue3, typescript

# Choix possibles

## Option 1 : Serveur Express séparé (recommandé)

https://expressjs.com/

La première option est la plus professionnelle et évolutive. Lancez les deux serveurs avec npm run dev:all et appelez votre API depuis Vue avec fetch('http://localhost:3001/api/users').

### Créez un dossier server à la racine de votre projet :

bashnpm install express cors
npm install -D @types/express @types/cors

### server/index.ts :

import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Vos routes API
app.get('/api/users', (req, res) => {
res.json([
{ id: 1, name: 'Alice' },
{ id: 2, name: 'Bob' }
])
})

app.post('/api/users', (req, res) => {
const newUser = req.body
res.status(201).json(newUser)
})

app.listen(PORT, () => {
console.log(`API serveur démarré sur http://localhost:${PORT}`)
})

### package.json :

{
"scripts": {
"dev": "vite",
"dev:api": "tsx watch server/index.ts",
"dev:all": "concurrently \"npm run dev\" \"npm run dev:api\""
}
}

### Installez tsx et concurrently :

bashnpm install -D tsx concurrently

## Option 2 : Plugin Vite avec middleware

vite.config.ts :
typescriptimport { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
plugins: [
vue(),
{
name: 'api-server',
configureServer(server) {
server.middlewares.use('/api/users', (req, res) => {
res.setHeader('Content-Type', 'application/json')
res.end(JSON.stringify([
{ id: 1, name: 'Alice' },
{ id: 2, name: 'Bob' }
]))
})
}
}
]
})

## Option 3 : Proxy vers un backend externe

vite.config.ts :
typescriptexport default defineConfig({
plugins: [vue()],
server: {
proxy: {
'/api': {
target: 'http://localhost:3001',
changeOrigin: true,
rewrite: (path) => path.replace(/^\/api/, '')
}
}
}
})

# (Option 1 retenue) Node.js + Express

## Installation des dépendances

```
npm install express cors
npm install -D @types/express @types/cors tsx concurrently
```
Le module concurrently reste optionnel.

## 2. Structure du projet

mon-projet/
├── node-modules/
├── public/
│ ├─📄global.css
│ └─📄icon.svg
├─📁src/
│ ├─📁data/
│ │ ├─📄products.json
│ │ └─📄users.json
│ ├─📁routes/
│ │ ├─📄products.ts
│ │ └─📄users.ts
│ ├─📁types/
│ │ └─📄index.ts
│ ├─📁utils/
│ │ ├─📄file.ts
│ │ └─📄query.ts
│ ├─📁views/
│ ├─📄App.vue
│ └─📄main.ts
├─📄.gitignore
├─📄.env
├─📄.env.sample
├─📄package.json
└─📄tsconfig.json

## Créer le serveur API

server/index.ts :
typescriptimport express, { Request, Response } from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Routes GET
app.get('/api/users', (req: Request, res: Response) => {
res.json([
{ id: 1, name: 'Alice', email: 'alice@example.com' },
{ id: 2, name: 'Bob', email: 'bob@example.com' }
])
})

app.get('/api/users/:id', (req: Request, res: Response) => {
const id = parseInt(req.params.id)
res.json({ id, name: 'User ' + id, email: `user${id}@example.com` })
})

// Routes POST
app.post('/api/users', (req: Request, res: Response) => {
const newUser = {
id: Date.now(),
...req.body
}
res.status(201).json(newUser)
})

// Routes PUT
app.put('/api/users/:id', (req: Request, res: Response) => {
const id = parseInt(req.params.id)
const updatedUser = {
id,
...req.body
}
res.json(updatedUser)
})

// Routes DELETE
app.delete('/api/users/:id', (req: Request, res: Response) => {
const id = parseInt(req.params.id)
res.json({ message: `User ${id} deleted` })
})

app.listen(PORT, () => {
console.log(`✅ Serveur API démarré sur http://localhost:${PORT}`)
})

## Client API pour Vue

src/api/client.ts :
typescriptconst API_URL = 'http://localhost:3001/api'

export interface User {
id: number
name: string
email: string
}

export const api = {
async getUsers(): Promise<User[]> {
const response = await fetch(`${API_URL}/users`)
if (!response.ok) throw new Error('Erreur lors de la récupération des utilisateurs')
return response.json()
},

async getUser(id: number): Promise<User> {
const response = await fetch(`${API_URL}/users/${id}`)
if (!response.ok) throw new Error('Utilisateur non trouvé')
return response.json()
},

async createUser(user: Omit<User, 'id'>): Promise<User> {
const response = await fetch(`${API_URL}/users`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(user)
})
if (!response.ok) throw new Error('Erreur lors de la création')
return response.json()
},

async updateUser(id: number, user: Partial<User>): Promise<User> {
const response = await fetch(`${API_URL}/users/${id}`, {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(user)
})
if (!response.ok) throw new Error('Erreur lors de la mise à jour')
return response.json()
},

async deleteUser(id: number): Promise<void> {
const response = await fetch(`${API_URL}/users/${id}`, {
method: 'DELETE'
})
if (!response.ok) throw new Error('Erreur lors de la suppression')
}
}

## Exemple d'utilisation dans Vue

src/App.vue :
vue<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, type User } from './api/client'

const users = ref<User[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const loadUsers = async () => {
loading.value = true
error.value = null
try {
users.value = await api.getUsers()
} catch (e) {
error.value = 'Erreur lors du chargement des utilisateurs'
console.error(e)
} finally {
loading.value = false
}
}

const addUser = async () => {
try {
const newUser = await api.createUser({
name: 'Nouveau User',
email: 'nouveau@example.com'
})
users.value.push(newUser)
} catch (e) {
console.error(e)
}
}

onMounted(() => {
loadUsers()
})
</script>

<template>
  <div class="container">
    <h1>Utilisateurs</h1>
    
    <button @click="addUser">Ajouter un utilisateur</button>
    
    <div v-if="loading">Chargement...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <ul v-else>
      <li v-for="user in users" :key="user.id">
        {{ user.name }} - {{ user.email }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.container {
  padding: 2rem;
}
.error {
  color: red;
}
</style>

## package.json

{
"scripts": {
"dev": "vite",
"dev:api": "tsx watch server/index.ts",
"dev:all": "concurrently \"npm run dev\" \"npm run dev:api\"",
"build": "vue-tsc && vite build",
"preview": "vite preview"
}
}

## Lancer le projet

npm run dev:all
Cela démarre :
Vite (frontend) sur http://localhost:5173
API Express sur http://localhost:3001

# options supplementaires

Ajouter MySQL à son serveur API local
Connaître les autres fonctionnalités possibles

Je vais lui montrer comment intégrer MySQL avec son serveur Express, puis lister les fonctionnalités supplémentaires qu'il peut ajouter.TerminéParfait ! Voici comment intégrer MySQL et les fonctionnalités possibles :

1. Installation MySQL
   bashnpm install mysql2
   npm install -D @types/mysql2
2. Configuration de la base de données
   server/db/config.ts :
   typescriptimport mysql from 'mysql2/promise'

export const pool = mysql.createPool({
host: 'localhost',
user: 'root',
password: 'votre_password',
database: 'mon_app',
waitForConnections: true,
connectionLimit: 10,
queueLimit: 0
})

// Test de connexion
export const testConnection = async () => {
try {
const connection = await pool.getConnection()
console.log('✅ Connexion MySQL réussie')
connection.release()
} catch (error) {
console.error('❌ Erreur de connexion MySQL:', error)
process.exit(1)
}
} 3. Script de création de tables
server/db/schema.sql :
sqlCREATE DATABASE IF NOT EXISTS mon_app;
USE mon_app;

CREATE TABLE IF NOT EXISTS users (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(255) NOT NULL,
email VARCHAR(255) NOT NULL UNIQUE,
password VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
title VARCHAR(255) NOT NULL,
content TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
); 4. Modèles de données
server/models/User.ts :
typescriptimport { pool } from '../db/config'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface User {
id?: number
name: string
email: string
password: string
created_at?: Date
updated_at?: Date
}

export class UserModel {
static async findAll(): Promise<User[]> {
const [rows] = await pool.query<RowDataPacket[]>(
'SELECT id, name, email, created_at FROM users'
)
return rows as User[]
}

static async findById(id: number): Promise<User | null> {
const [rows] = await pool.query<RowDataPacket[]>(
'SELECT id, name, email, created_at FROM users WHERE id = ?',
[id]
)
return rows.length > 0 ? (rows[0] as User) : null
}

static async create(user: Omit<User, 'id'>): Promise<User> {
const [result] = await pool.query<ResultSetHeader>(
'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
[user.name, user.email, user.password]
)
return { id: result.insertId, ...user }
}

static async update(id: number, user: Partial<User>): Promise<boolean> {
const fields: string[] = []
const values: any[] = []

    if (user.name) {
      fields.push('name = ?')
      values.push(user.name)
    }
    if (user.email) {
      fields.push('email = ?')
      values.push(user.email)
    }

    values.push(id)

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
    return result.affectedRows > 0

}

static async delete(id: number): Promise<boolean> {
const [result] = await pool.query<ResultSetHeader>(
'DELETE FROM users WHERE id = ?',
[id]
)
return result.affectedRows > 0
}

static async findByEmail(email: string): Promise<User | null> {
const [rows] = await pool.query<RowDataPacket[]>(
'SELECT \* FROM users WHERE email = ?',
[email]
)
return rows.length > 0 ? (rows[0] as User) : null
}
} 5. Serveur mis à jour
server/index.ts :
typescriptimport express, { Request, Response } from 'express'
import cors from 'cors'
import { testConnection } from './db/config'
import { UserModel } from './models/User'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Initialisation
testConnection()

// Routes
app.get('/api/users', async (req: Request, res: Response) => {
try {
const users = await UserModel.findAll()
res.json(users)
} catch (error) {
res.status(500).json({ error: 'Erreur serveur' })
}
})

app.get('/api/users/:id', async (req: Request, res: Response) => {
try {
const user = await UserModel.findById(parseInt(req.params.id))
if (!user) {
return res.status(404).json({ error: 'Utilisateur non trouvé' })
}
res.json(user)
} catch (error) {
res.status(500).json({ error: 'Erreur serveur' })
}
})

app.post('/api/users', async (req: Request, res: Response) => {
try {
const user = await UserModel.create(req.body)
res.status(201).json(user)
} catch (error) {
res.status(500).json({ error: 'Erreur lors de la création' })
}
})

app.put('/api/users/:id', async (req: Request, res: Response) => {
try {
const success = await UserModel.update(parseInt(req.params.id), req.body)
if (!success) {
return res.status(404).json({ error: 'Utilisateur non trouvé' })
}
res.json({ message: 'Utilisateur mis à jour' })
} catch (error) {
res.status(500).json({ error: 'Erreur lors de la mise à jour' })
}
})

app.delete('/api/users/:id', async (req: Request, res: Response) => {
try {
const success = await UserModel.delete(parseInt(req.params.id))
if (!success) {
return res.status(404).json({ error: 'Utilisateur non trouvé' })
}
res.json({ message: 'Utilisateur supprimé' })
} catch (error) {
res.status(500).json({ error: 'Erreur lors de la suppression' })
}
})

app.listen(PORT, () => {
console.log(`✅ Serveur API démarré sur http://localhost:${PORT}`)
})
Autres fonctionnalités possibles :
🔐 1. Authentification JWT
bashnpm install jsonwebtoken bcrypt
npm install -D @types/jsonwebtoken @types/bcrypt
server/middleware/auth.ts :
typescriptimport jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

const SECRET = 'votre_secret_jwt'

export const generateToken = (userId: number) => {
return jwt.sign({ userId }, SECRET, { expiresIn: '24h' })
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
const token = req.headers.authorization?.split(' ')[1]

if (!token) {
return res.status(401).json({ error: 'Token manquant' })
}

try {
const decoded = jwt.verify(token, SECRET)
req.user = decoded
next()
} catch (error) {
res.status(401).json({ error: 'Token invalide' })
}
}
📁 2. Upload de fichiers
bashnpm install multer
npm install -D @types/multer
typescriptimport multer from 'multer'

const storage = multer.diskStorage({
destination: 'uploads/',
filename: (req, file, cb) => {
cb(null, Date.now() + '-' + file.originalname)
}
})

const upload = multer({ storage })

app.post('/api/upload', upload.single('file'), (req, res) => {
res.json({ filename: req.file?.filename })
})
✅ 3. Validation de données
bashnpm install zod
typescriptimport { z } from 'zod'

const userSchema = z.object({
name: z.string().min(2).max(100),
email: z.string().email(),
password: z.string().min(8)
})

app.post('/api/users', async (req, res) => {
const validation = userSchema.safeParse(req.body)
if (!validation.success) {
return res.status(400).json({ errors: validation.error.errors })
}
// ...
})
📝 4. Logging
bashnpm install winston
🌐 5. WebSocket (temps réel)
bashnpm install socket.io
npm install -D @types/socket.io
📧 6. Envoi d'emails
bashnpm install nodemailer
npm install -D @types/nodemailer
🔍 7. Recherche et pagination
typescriptapp.get('/api/users', async (req, res) => {
const { page = 1, limit = 10, search = '' } = req.query
// Logique de pagination et recherche
})
🔄 8. Cache avec Redis
bashnpm install redis
📊 9. Rate limiting
bashnpm install express-rate-limit
🧪 10. Tests API
bashnpm install -D jest supertest @types/jest @types/supertest

# (framework) express

Express est un framework web minimaliste, rapide et non opinatif pour Node.js, disponible via le gestionnaire de paquets npm. Il est largement utilisé pour développer des applications web, des APIs REST et des serveurs HTTP.

Install as a dependency

## Routing

refers to determining how an application responds to a client request to a particular endpoint, which is a URI (or path) and a specific HTTP request method (GET, POST, and so on).
Each route can have one or more handler functions, which are executed when the route is matched.
`app.METHOD(PATH, HANDLER)`

## Serving static files

`app.use(express.static('public'))`
`app.use(express.static('files'))`
Now, you can load the files that are in the public directory:

```
http://localhost:3000/images/kitten.jpg
http://localhost:3000/css/style.css
http://localhost:3000/js/app.js
http://localhost:3000/images/bg.png
http://localhost:3000/hello.html
```

# (package) cors

Le package cors disponible sur npm est un middleware Node.js conçu pour les applications Express/Connect afin de gérer les en-têtes de partage des ressources cross-origin (CORS). Il permet de définir quels origines peuvent accéder aux réponses de votre serveur depuis un navigateur.

Important : CORS est contrôlé par le navigateur. Les clients non-browseurs (curl, Postman, autres serveurs) ignorent ces en-têtes. Ce package ne bloque pas les requêtes — il ne fait que définir les en-têtes de réponse. Pour protéger votre API, utilisez l’authentification et l’autorisation.

Vérifier votre tsconfig.json
Assurez-vous d'avoir :
tsconfig.json :
json{
"compilerOptions": {
"target": "ES2020",
"module": "ES2020",
"moduleResolution": "node",
"esModuleInterop": true,
"strict": true
}
}
La Solution 1 est la plus robuste et recommandée pour les modules ES ! Le fichier fonctionnera maintenant correctement.

# server/index.ts

import express, { Request, Response } from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
const PORT = 3001

// Recréer **dirname pour les modules ES
const **filename = fileURLToPath(import.meta.url)
const **dirname = path.dirname(**filename)

const DATA_FILE = path.join(\_\_dirname, 'data', 'users.json')

app.use(cors())
app.use(express.json())

// Reste du code identique...
const readUsersFile = async () => {
try {
const data = await fs.readFile(DATA_FILE, 'utf-8')
return JSON.parse(data)
} catch (error) {
console.error('Erreur lecture fichier:', error)
return { users: [] }
}
}

const writeUsersFile = async (data: any) => {
try {
await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
return true
} catch (error) {
console.error('Erreur écriture fichier:', error)
return false
}
}

app.get('/api/users', async (req: Request, res: Response) => {
try {
const data = await readUsersFile()
res.json(data.users)
} catch (error) {
res.status(500).json({ error: 'Erreur lors de la lecture des données' })
}
})

app.get('/api/users/:id', async (req: Request, res: Response) => {
try {
const data = await readUsersFile()
const user = data.users.find((u: any) => u.id === parseInt(req.params.id))

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    res.json(user)

} catch (error) {
res.status(500).json({ error: 'Erreur serveur' })
}
})

app.post('/api/users', async (req: Request, res: Response) => {
try {
const data = await readUsersFile()
const newUser = {
id: data.users.length > 0 ? Math.max(...data.users.map((u: any) => u.id)) + 1 : 1,
...req.body,
created_at: new Date().toISOString()
}

    data.users.push(newUser)
    await writeUsersFile(data)

    res.status(201).json(newUser)

} catch (error) {
res.status(500).json({ error: 'Erreur lors de la création' })
}
})

app.put('/api/users/:id', async (req: Request, res: Response) => {
try {
const data = await readUsersFile()
const index = data.users.findIndex((u: any) => u.id === parseInt(req.params.id))

    if (index === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    data.users[index] = {
      ...data.users[index],
      ...req.body,
      id: parseInt(req.params.id)
    }

    await writeUsersFile(data)
    res.json(data.users[index])

} catch (error) {
res.status(500).json({ error: 'Erreur lors de la mise à jour' })
}
})

app.delete('/api/users/:id', async (req: Request, res: Response) => {
try {
const data = await readUsersFile()
const index = data.users.findIndex((u: any) => u.id === parseInt(req.params.id))

    if (index === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    data.users.splice(index, 1)
    await writeUsersFile(data)

    res.json({ message: 'Utilisateur supprimé' })

} catch (error) {
res.status(500).json({ error: 'Erreur lors de la suppression' })
}
})

app.listen(PORT, () => {
console.log(`✅ Serveur API démarré sur http://localhost:${PORT}`)
console.log(`📁 Fichier de données: ${DATA_FILE}`)
})

=============================================

# parametrage pour data: local / github

1. Installation de dotenv
   bashnpm install dotenv
   npm install -D @types/node
2. Créer le fichier .env
   server/.env :
   env# Source de données : 'local' ou 'github'
   DATA_SOURCE=local

## Configuration pour GitHub (si DATA_SOURCE=github)

GITHUB_OWNER=votre-username
GITHUB_REPO=votre-repo
GITHUB_BRANCH=main
GITHUB_TOKEN=ghp_votre_token_personnel_optionnel

## Chemins des fichiers (relatifs au repo GitHub)

PRODUCTS_FILE_PATH=server/data/products.json
USERS_FILE_PATH=server/data/users.json
server/.env.example (à commiter dans git) :
envDATA_SOURCE=local
GITHUB_OWNER=
GITHUB_REPO=
GITHUB_BRANCH=main
GITHUB_TOKEN=
PRODUCTS_FILE_PATH=server/data/products.json
USERS_FILE_PATH=server/data/users.json 3. Configuration
server/config/env.ts :
typescriptimport dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const **filename = fileURLToPath(import.meta.url)
const **dirname = path.dirname(\_\_filename)

// Charger les variables d'environnement
dotenv.config({ path: path.join(\_\_dirname, '..', '.env') })

export const config = {
dataSource: process.env.DATA_SOURCE || 'local',
github: {
owner: process.env.GITHUB_OWNER || '',
repo: process.env.GITHUB_REPO || '',
branch: process.env.GITHUB_BRANCH || 'main',
token: process.env.GITHUB_TOKEN || '',
},
files: {
products: process.env.PRODUCTS_FILE_PATH || 'server/data/products.json',
users: process.env.USERS_FILE_PATH || 'server/data/users.json',
},
local: {
productsPath: path.join(**dirname, '..', 'data', 'products.json'),
usersPath: path.join(**dirname, '..', 'data', 'users.json'),
}
}

export type DataSource = 'local' | 'github' 4. Helper pour GitHub
server/utils/githubHelper.ts :
typescriptimport { config } from '../config/env.js'

interface GitHubFileResponse {
content: string
sha: string
}

export const readFromGitHub = async (filePath: string): Promise<any[]> => {
try {
const { owner, repo, branch, token } = config.github

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`

    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    }

    // Ajouter le token si disponible (augmente la limite de rate)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    const data: GitHubFileResponse = await response.json()

    // Le contenu est encodé en base64
    const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8')

    return JSON.parse(decodedContent)

} catch (error) {
console.error('Erreur lecture depuis GitHub:', error)
return []
}
}

export const writeToGitHub = async (filePath: string, content: any[]): Promise<boolean> => {
try {
const { owner, repo, branch, token } = config.github

    if (!token) {
      throw new Error('GitHub token requis pour écrire des fichiers')
    }

    // 1. Récupérer le SHA actuel du fichier
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`
    const getResponse = await fetch(getUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`,
      }
    })

    let sha = ''
    if (getResponse.ok) {
      const fileData: GitHubFileResponse = await getResponse.json()
      sha = fileData.sha
    }

    // 2. Encoder le nouveau contenu en base64
    const encodedContent = Buffer.from(JSON.stringify(content, null, 2)).toString('base64')

    // 3. Mettre à jour le fichier
    const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`
    const putResponse = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update ${filePath}`,
        content: encodedContent,
        sha: sha || undefined,
        branch,
      })
    })

    return putResponse.ok

} catch (error) {
console.error('Erreur écriture vers GitHub:', error)
return false
}
} 5. Helper universel mis à jour
server/utils/fileHelper.ts :
typescriptimport fs from 'fs/promises'
import { config, DataSource } from '../config/env.js'
import { readFromGitHub, writeToGitHub } from './githubHelper.js'

export const readFromJson = async <T>(localPath: string, githubPath: string): Promise<T[]> => {
const dataSource = config.dataSource as DataSource

if (dataSource === 'github') {
console.log(`📥 Lecture depuis GitHub: ${githubPath}`)
return readFromGitHub(githubPath) as Promise<T[]>
} else {
console.log(`📁 Lecture depuis fichier local: ${localPath}`)
try {
const data = await fs.readFile(localPath, 'utf-8')
return JSON.parse(data)
} catch (error) {
console.error('Erreur lecture fichier local:', error)
return []
}
}
}

export const writeToJson = async <T>(
data: T[],
localPath: string,
githubPath: string
): Promise<boolean> => {
const dataSource = config.dataSource as DataSource

if (dataSource === 'github') {
console.log(`📤 Écriture vers GitHub: ${githubPath}`)
return writeToGitHub(githubPath, data)
} else {
console.log(`💾 Écriture vers fichier local: ${localPath}`)
try {
await fs.writeFile(localPath, JSON.stringify(data, null, 2), 'utf-8')
return true
} catch (error) {
console.error('Erreur écriture fichier local:', error)
return false
}
}
} 6. Mettre à jour les routes
server/routes/products.ts :
typescriptimport { Router, Request, Response } from 'express'
import { Product } from '../types/index.js'
import { readFromJson, writeToJson } from '../utils/fileHelper.js'
import { config } from '../config/env.js'

const router = Router()

// GET tous les produits
router.get('/', async (req: Request, res: Response) => {
try {
const data = await readFromJson<Product>(
config.local.productsPath,
config.files.products
)
res.json(data)
} catch (error) {
res.status(500).json({ error: 'Erreur lors de la lecture des données' })
}
})

// GET un produit par ID
router.get('/:id', async (req: Request, res: Response) => {
try {
const data = await readFromJson<Product>(
config.local.productsPath,
config.files.products
)
const found = data.find((p: Product) => p.id === parseInt(req.params.id))

    if (!found) {
      return res.status(404).json({ error: 'Produit non trouvé' })
    }

    res.json(found)

} catch (error) {
res.status(500).json({ error: 'Erreur serveur' })
}
})

// POST créer un produit
router.post('/', async (req: Request, res: Response) => {
try {
const data = await readFromJson<Product>(
config.local.productsPath,
config.files.products
)
const newProduct: Product = {
id: data.length > 0 ? Math.max(...data.map((p: Product) => p.id)) + 1 : 1,
...req.body,
}

    data.push(newProduct)
    await writeToJson(
      data,
      config.local.productsPath,
      config.files.products
    )

    res.status(201).json(newProduct)

} catch (error) {
res.status(500).json({ error: 'Erreur lors de la création' })
}
})

// PUT mettre à jour un produit
router.put('/:id', async (req: Request, res: Response) => {
try {
const data = await readFromJson<Product>(
config.local.productsPath,
config.files.products
)
const index = data.findIndex((p: Product) => p.id === parseInt(req.params.id))

    if (index === -1) {
      return res.status(404).json({ error: 'Produit non trouvé' })
    }

    data[index] = {
      ...data[index],
      ...req.body,
      id: parseInt(req.params.id),
    }

    await writeToJson(
      data,
      config.local.productsPath,
      config.files.products
    )
    res.json(data[index])

} catch (error) {
res.status(500).json({ error: 'Erreur lors de la mise à jour' })
}
})

// DELETE supprimer un produit
router.delete('/:id', async (req: Request, res: Response) => {
try {
const data = await readFromJson<Product>(
config.local.productsPath,
config.files.products
)
const index = data.findIndex((p: Product) => p.id === parseInt(req.params.id))

    if (index === -1) {
      return res.status(404).json({ error: 'Produit non trouvé' })
    }

    data.splice(index, 1)
    await writeToJson(
      data,
      config.local.productsPath,
      config.files.products
    )

    res.json({ message: `Product ${req.params.id} deleted` })

} catch (error) {
res.status(500).json({ error: 'Erreur lors de la suppression' })
}
})

export default router
server/routes/users.ts (similaire) :
typescriptimport { Router, Request, Response } from 'express'
import { User } from '../types/index.js'
import { readFromJson, writeToJson } from '../utils/fileHelper.js'
import { config } from '../config/env.js'

const router = Router()

// ... (même structure que products.ts, mais avec config.local.usersPath et config.files.users) 7. Mettre à jour index.ts
server/index.ts :
typescriptimport express from 'express'
import cors from 'cors'
import productsRouter from './routes/products.js'
import usersRouter from './routes/users.js'
import { config } from './config/env.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.use('/api/products', productsRouter)
app.use('/api/users', usersRouter)

app.get('/api/health', (req, res) => {
res.json({
status: 'OK',
dataSource: config.dataSource,
timestamp: new Date().toISOString()
})
})

app.listen(PORT, () => {
console.log(`✅ Server API starting at http://localhost:${PORT}`)
console.log(`📊 Data source: ${config.dataSource.toUpperCase()}`)

if (config.dataSource === 'github') {
console.log(`🔗 GitHub repo: ${config.github.owner}/${config.github.repo}`)
} else {
console.log(`📁 Local data directory: server/data/`)
}
})

```

## 8. Ajouter .env au .gitignore

**.gitignore** :
```

node_modules/
dist/
.env
server/.env 9. Comment obtenir un GitHub Token

Aller sur GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
Generate new token
Cocher : repo (full control)
Copier le token dans .env

Utilisation
Mode local :
envDATA_SOURCE=local
Mode GitHub :
envDATA_SOURCE=github
GITHUB_OWNER=votre-username
GITHUB_REPO=mon-repo
GITHUB_BRANCH=main
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
Maintenant vous pouvez basculer entre local et GitHub simplement en changeant DATA_SOURCE ! 🚀

## dotenv OU variables VITE_exemple ?

🚀🚀🚀 Il faut distingure entre frontend Vite et backend Node.js

Frontend (Vite) ✅
Vite gère nativement les .env sans dotenv
Variables préfixées VITE\_\* sont exposées au client
Accessibles via import.meta.env.VITE_EXEMPLE

Backend (Node.js/Express) ❌
Votre serveur API tourne avec tsx, PAS avec Vite
Vite ne gère PAS le backend
Donc dotenv EST nécessaire pour le serveur

Solution : Deux approches
Option 1 : Garder dotenv pour le serveur (recommandé)
.env (à la racine) :

env

## Variables BACKEND (serveur API)

DATA_SOURCE=local
GITHUB_OWNER=username
GITHUB_REPO=repo
GITHUB_BRANCH=main
GITHUB_TOKEN=ghp_xxx

## Variables FRONTEND (Vite - optionnel)

VITE_API_URL=http://localhost:3001
VITE_APP_TITLE=Mon Application
server/config/env.ts (utilise dotenv) :

typescript
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const **filename = fileURLToPath(import.meta.url)
const **dirname = path.dirname(\_\_filename)

// Charger .env depuis la racine du projet
dotenv.config({ path: path.join(\_\_dirname, '..', '..', '.env') })

export const config = {
dataSource: process.env.DATA_SOURCE || 'local',
github: {
owner: process.env.GITHUB_OWNER || '',
repo: process.env.GITHUB_REPO || '',
branch: process.env.GITHUB_BRANCH || 'main',
token: process.env.GITHUB_TOKEN || '',
},
files: {
products: process.env.PRODUCTS_FILE_PATH || 'server/data/products.json',
users: process.env.USERS_FILE_PATH || 'server/data/users.json',
},
local: {
productsPath: path.join(**dirname, '..', 'data', 'products.json'),
usersPath: path.join(**dirname, '..', 'data', 'users.json'),
}
}
src/config/env.ts (frontend, utilise Vite) :

typescript
export const config = {
apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
appTitle: import.meta.env.VITE_APP_TITLE || 'App',
}
vite.config.ts :

typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
plugins: [vue()],
// Les variables VITE\_\* sont automatiquement chargées
})
Option 2 : Variables séparées
server/.env (uniquement pour le serveur) :

env
DATA_SOURCE=local
GITHUB_OWNER=username
GITHUB_REPO=repo
.env (racine, pour Vite) :

env
VITE_API_URL=http://localhost:3001
server/config/env.ts :

typescript
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const **filename = fileURLToPath(import.meta.url)
const **dirname = path.dirname(\_\_filename)

dotenv.config({ path: path.join(\_\_dirname, '.env') })

export const config = {
dataSource: process.env.DATA*SOURCE || 'local',
// ...
}
📋 Comparaison
Aspect Frontend (Vite) Backend (Express)
Runtime Navigateur Node.js (tsx)
Outil Vite tsx/ts-node
Variables VITE*\_ Toutes
Accès import.meta.env.VITE\_\_ process.env.\*
dotenv ❌ Non nécessaire ✅ Nécessaire
Fichier .env à la racine .env où vous voulez
⚠️ Sécurité importante
typescript
// ❌ DANGER : Ne jamais exposer au frontend
GITHUB_TOKEN=ghp_xxx // Reste privé côté serveur

// ✅ OK : Peut être exposé au frontend
VITE_API_URL=http://localhost:3001 // Public
Exemple d'utilisation
Frontend (src/api/client.ts) :

typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = {
async getProducts() {
const response = await fetch(`${API_URL}/api/products`)
return response.json()
}
}
Backend (server/index.ts) :

typescript
import { config } from './config/env.js'

console.log('Data source:', config.dataSource) // Depuis process.env via dotenv
Conclusion
Oui, dotenv EST nécessaire pour votre serveur API car :

Le serveur tourne avec tsx, pas Vite
Vite ne compile/n'exécute pas le code serveur
Les variables VITE\_\* ne sont accessibles que dans le code frontend
Gardez dotenv pour le backend ! 🎯

# FINAL

Separation BACKEND / FRONTEND

Excellente décision ! Voici comment organiser un projet propre avec backend et frontend séparés :
Structure de projet recommandée
mon-projet/
├── backend/ # Serveur API
│ ├── src/
│ │ ├── config/
│ │ │ └── env.ts
│ │ ├── routes/
│ │ │ ├── products.ts
│ │ │ └── users.ts
│ │ ├── types/
│ │ │ └── index.ts
│ │ ├── utils/
│ │ │ ├── fileHelper.ts
│ │ │ └── githubHelper.ts
│ │ ├── data/
│ │ │ ├── products.json
│ │ │ └── users.json
│ │ └── index.ts
│ ├── .env
│ ├── .env.example
│ ├── .gitignore
│ ├── package.json
│ └── tsconfig.json
│
├── frontend/ # Application Vue3
│ ├── public/
│ ├── src/
│ │ ├── api/
│ │ │ └── client.ts
│ │ ├── components/
│ │ ├── views/
│ │ ├── router/
│ │ ├── stores/
│ │ ├── App.vue
│ │ └── main.ts
│ ├── .env
│ ├── .env.example
│ ├── .gitignore
│ ├── index.html
│ ├── package.json
│ ├── tsconfig.json
│ └── vite.config.ts
│
└── README.md

1. Backend - Configuration
   backend/package.json :
   json{
   "name": "backend-api",
   "version": "1.0.0",
   "type": "module",
   "scripts": {
   "dev": "tsx watch src/index.ts",
   "build": "tsc",
   "start": "node dist/index.js"
   },
   "dependencies": {
   "express": "^4.18.2",
   "cors": "^2.8.5",
   "dotenv": "^16.3.1"
   },
   "devDependencies": {
   "@types/express": "^4.17.21",
   "@types/cors": "^2.8.17",
   "@types/node": "^20.10.0",
   "tsx": "^4.7.0",
   "typescript": "^5.3.3"
   }
   }
   backend/tsconfig.json :
   json{
   "compilerOptions": {
   "target": "ES2020",
   "module": "ES2020",
   "moduleResolution": "node",
   "outDir": "./dist",
   "rootDir": "./src",
   "strict": true,
   "esModuleInterop": true,
   "skipLibCheck": true,
   "forceConsistentCasingInFileNames": true,
   "resolveJsonModule": true
   },
   "include": ["src/**/*"],
   "exclude": ["node_modules", "dist"]
   }
   backend/.env :
   env# Configuration serveur
   PORT=3001
   NODE_ENV=development

# Source de données

DATA_SOURCE=local

# GitHub (si DATA_SOURCE=github)

GITHUB_OWNER=
GITHUB_REPO=
GITHUB_BRANCH=main
GITHUB_TOKEN=

# Chemins des fichiers

PRODUCTS_FILE_PATH=src/data/products.json
USERS_FILE_PATH=src/data/users.json

```

**backend/.gitignore** :
```

node_modules/
dist/
.env
\*.log
backend/src/index.ts :
typescriptimport express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import productsRouter from './routes/products.js'
import usersRouter from './routes/users.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/products', productsRouter)
app.use('/api/users', usersRouter)

app.get('/api/health', (req, res) => {
res.json({
status: 'OK',
dataSource: process.env.DATA_SOURCE || 'local',
timestamp: new Date().toISOString()
})
})

app.listen(PORT, () => {
console.log(`✅ API Server running on http://localhost:${PORT}`)
console.log(`📊 Data source: ${process.env.DATA_SOURCE?.toUpperCase() || 'LOCAL'}`)
}) 2. Frontend - Configuration
frontend/package.json :
json{
"name": "frontend-vue",
"version": "1.0.0",
"type": "module",
"scripts": {
"dev": "vite",
"build": "vue-tsc && vite build",
"preview": "vite preview"
},
"dependencies": {
"vue": "^3.4.0",
"vue-router": "^4.2.5",
"pinia": "^2.1.7"
},
"devDependencies": {
"@vitejs/plugin-vue": "^5.0.0",
"typescript": "^5.3.3",
"vite": "^5.0.0",
"vue-tsc": "^1.8.27"
}
}
frontend/vite.config.ts :
typescriptimport { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
plugins: [vue()],
resolve: {
alias: {
'@': path.resolve(\_\_dirname, './src')
}
},
server: {
port: 5173,
proxy: {
'/api': {
target: 'http://localhost:3001',
changeOrigin: true
}
}
}
})
frontend/.env :
envVITE_API_URL=http://localhost:3001
VITE_APP_TITLE=Mon Application Vue3
frontend/src/api/client.ts :
typescriptconst API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface Product {
id: number
name: string
price: number
description?: string
category?: string
}

export interface User {
id: number
name: string
email: string
}

class ApiClient {
private baseUrl: string

constructor(baseUrl: string) {
this.baseUrl = baseUrl
}

private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
const response = await fetch(`${this.baseUrl}${endpoint}`, {
headers: {
'Content-Type': 'application/json',
...options?.headers,
},
...options,
})

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()

}

// Products
async getProducts(): Promise<Product[]> {
return this.request<Product[]>('/api/products')
}

async getProduct(id: number): Promise<Product> {
return this.request<Product>(`/api/products/${id}`)
}

async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
return this.request<Product>('/api/products', {
method: 'POST',
body: JSON.stringify(product),
})
}

async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
return this.request<Product>(`/api/products/${id}`, {
method: 'PUT',
body: JSON.stringify(product),
})
}

async deleteProduct(id: number): Promise<void> {
return this.request<void>(`/api/products/${id}`, {
method: 'DELETE',
})
}

// Users
async getUsers(): Promise<User[]> {
return this.request<User[]>('/api/users')
}

async getUser(id: number): Promise<User> {
return this.request<User>(`/api/users/${id}`)
}

async createUser(user: Omit<User, 'id'>): Promise<User> {
return this.request<User>('/api/users', {
method: 'POST',
body: JSON.stringify(user),
})
}

async updateUser(id: number, user: Partial<User>): Promise<User> {
return this.request<User>(`/api/users/${id}`, {
method: 'PUT',
body: JSON.stringify(user),
})
}

async deleteUser(id: number): Promise<void> {
return this.request<void>(`/api/users/${id}`, {
method: 'DELETE',
})
}
}

export const api = new ApiClient(API_URL)
frontend/src/App.vue :
vue<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api, type Product } from './api/client'

const products = ref<Product[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const loadProducts = async () => {
loading.value = true
error.value = null
try {
products.value = await api.getProducts()
} catch (e) {
error.value = 'Erreur lors du chargement des produits'
console.error(e)
} finally {
loading.value = false
}
}

onMounted(() => {
loadProducts()
})
</script>

<template>
  <div class="container">
    <h1>{{ import.meta.env.VITE_APP_TITLE }}</h1>
    
    <div v-if="loading">Chargement...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <h2>Produits ({{ products.length }})</h2>
      <ul>
        <li v-for="product in products" :key="product.id">
          <strong>{{ product.name }}</strong> - {{ product.price }}€
          <p v-if="product.description">{{ product.description }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.error {
  color: red;
  padding: 1rem;
  border: 1px solid red;
  border-radius: 4px;
}
</style>

3. Scripts de démarrage
   Option A : Lancer séparément
   Terminal 1 (Backend) :
   bashcd backend
   npm install
   npm run dev
   Terminal 2 (Frontend) :
   bashcd frontend
   npm install
   npm run dev
   Option B : Script global (à la racine)
   package.json (racine) :
   json{
   "name": "mon-projet",
   "private": true,
   "scripts": {
   "install:all": "cd backend && npm install && cd ../frontend && npm install",
   "dev:backend": "cd backend && npm run dev",
   "dev:frontend": "cd frontend && npm run dev",
   "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
   "build:backend": "cd backend && npm run build",
   "build:frontend": "cd frontend && npm run build",
   "build": "npm run build:backend && npm run build:frontend"
   },
   "devDependencies": {
   "concurrently": "^8.2.2"
   }
   }
   Puis :
   bashnpm install
   npm run install:all
   npm run dev
4. README.md (racine)
   markdown# Mon Projet Full Stack

Stack: Vue 3 + TypeScript + Vite (Frontend) + Express + TypeScript (Backend)

## Installation

```bash
# Installer toutes les dépendances
npm run install:all

# Ou manuellement
cd backend && npm install
cd frontend && npm install
```

## Développement

```bash
# Lancer backend + frontend
npm run dev

# Ou séparément
npm run dev:backend  # API sur http://localhost:3001
npm run dev:frontend # App sur http://localhost:5173
```

## Configuration

### Backend (.env)

- `PORT` : Port du serveur API
- `DATA_SOURCE` : `local` ou `github`
- Voir `backend/.env.example`

### Frontend (.env)

- `VITE_API_URL` : URL de l'API
- Voir `frontend/.env.example`

## Structure

- `backend/` : API REST Express
- `frontend/` : Application Vue 3
  Avantages de cette structure
  ✅ Séparation claire des responsabilités
  ✅ Déploiement indépendant (backend sur Heroku, frontend sur Vercel/Netlify)
  ✅ Configurations séparées (tsconfig, package.json, .env)
  ✅ Pas de confusion entre dépendances frontend/backend
  ✅ Scalabilité plus facile
  ✅ Tests indépendants
  Vous avez maintenant une architecture professionnelle et maintenable ! 🚀


# notes sur fonctionnement

Dans onglet Network du debogueur du browser, il y a une requete Fetch/XHR nommée 'products', avec 
Request URL = http://localhost:3001/api/products 
Origin = http://localhost:5173
Referer = http://localhost:5173

## 🎯 Explication

+ Origin et Referer = http://localhost:5173
C'est votre frontend (Vue/Vite) qui fait la requête
Le navigateur ajoute automatiquement ces headers pour indiquer d'où vient l'appel
Origin : L'origine de l'application qui fait la requête
Referer : La page exacte d'où vient la requête

+ Request URL = http://localhost:3001/api/products
C'est votre backend (Express) qui reçoit la requête
C'est la destination de la requête

## 📊 Schéma du flux
┌─────────────────────────┐
│  Navigateur             │
│  localhost:5173         │  ← Votre frontend Vue3
│  (Origin/Referer)       │
└───────────┬─────────────┘
            │
            │ fetch() 
            │ GET /api/products
            ▼
┌─────────────────────────┐
│  Serveur Express        │
│  localhost:3001         │  ← Votre backend API
│  (Request URL)          │
└─────────────────────────┘
## 🔒 Pourquoi CORS est nécessaire

C'est exactement pour ça que vous avez mis cors() dans votre backend :
typescriptapp.use(cors()) // Permet à localhost:5173 d'appeler localhost:3001

Sans CORS, le navigateur **bloquerait** la requête car :
- **Origin différente** : `http://localhost:5173` ≠ `http://localhost:3001`
- Le navigateur protège contre les **Cross-Origin Request** non autorisées

## 🔍 Vérification

Dans l'onglet **Headers** de la requête, vous devriez voir :

**Request Headers** (envoyés par le navigateur) :
Origin: http://localhost:5173
Referer: http://localhost:5173/

**Response Headers** (renvoyés par le backend) :
Access-Control-Allow-Origin: *
Ce dernier header est ajouté par `cors()` et dit au navigateur : *"Oui, j'autorise cette origin à me contacter"*

## 🌐 En production

En production, vous auriez quelque chose comme :
```
Frontend (Origin/Referer):  https://mon-app.com
Backend (Request URL):      https://api.mon-app.com/api/products
Et vous configureriez CORS plus strictement :
typescriptapp.use(cors({
  origin: 'https://mon-app.com', // Seulement ce domaine
  credentials: true
}))
✅ C'est normal !
Ce comportement est exact et attendu :
Votre frontend (5173) appelle votre backend (3001)
Le navigateur indique l'origine (5173) dans les headers
Le backend répond et autorise la requête grâce à CORS
C'est le principe d'une architecture client-serveur classique

Pas d'inquiétude, tout fonctionne comme prévu ! 🎉
