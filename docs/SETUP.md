# Serveur Express

Express est un framework web minimaliste, rapide et non opinatif pour Node.js, disponible via le gestionnaire de paquets npm. Il est largement utilisé pour développer des applications web, des APIs REST et des serveurs HTTP.

# links

🔗 https://expressjs.com/

🔗 https://github.com/expressjs/cors#readme

# links js/ts

https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types

# Structure du projet

```
root<mon-projet>/
├── node-modules/
├── public/
│ ├─📄global.css
│ └─📄icon.svg
├─📁 src/
│ ├─📁 config/
│ │ └─📄 env.ts
│ ├─📁 data/
│ │ ├─📄 products.json
│ │ └─📄 users.json
│ ├─📁 middleware/
│ │ ├─📄 errorHandler.ts
│ │ ├─📄 rateLimiter.ts
│ │ └─📄 security.ts
│ ├─📁 routes/
│ │ ├─📄 products.ts
│ │ └─📄 users.ts
│ ├─📁 samples/
│ │ └─📄 sample-generateId.ts
│ ├─📁 types/
│ │ ├─📄 api.ts
│ │ └─📄 index.ts
│ ├─📁 utils/
│ │ ├─📄 appError.ts
│ │ ├─📄 file.ts
│ │ ├─📄 generateId.ts
│ │ ├─📄 github.ts
│ │ ├─📄 query.ts
│ │ └─📄 response.ts
│ ├─📁 views/
│ │ └─📄 status.ejs
│ └─📄 index.ts
├─📄 .gitignore
├─📄 .env
├─📄 .env.sample
├─📄 package.json
└─📄 tsconfig.json
```

## npm (active folder = root)

```
npm install express cors
npm install -D @types/express @types/cors tsx concurrently
```

Le module concurrently est optionel.

## src/index.ts

Sert a l'initialisation du server, via la variable **app**.

- Configurer differents modules avec app.use().
- Definir les routes.
- Start server: app.listen(PORT, () => {}

## src/config/env.ts

Avec les ES Modules (import), TOUS les fichiers sont chargés AVANT que le code de index.ts ne s'exécute.

Avec `import './config/env'` en premier import de **src/index.ts**, tous l'environnement est chargé et exécuté AVANT l'éxécution du code du server.

🎓 C'est pour ça qu'on ne peut pas simplement faire dotenv.config() en ligne 1 de index.ts !

Dans tout le projet, on peut utiliser directement **process.env** (process.env.PORT) ou la variable **config** (config.port) si elle est importée.

Utilise les modules:
```
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
```

## src/routes

**Routing** refers to determining how an application responds to a client request to a particular endpoint, which is a URI (or path) and a specific HTTP request method (GET, POST, and so on).

Each route can have one or more handler functions, which are executed when the route is matched.  
`app.METHOD(PATH, HANDLER)`

Importation des routes par type de data:
```
import productsRouter from "./routes/products"
app.use("/api/products", writeRateLimiter, productsRouter)
```
Autres routes:

```
// config
app.get(['/api/config/data','/config/data'], (req, res) => {
  res.json({
    dataSource: process.env.DATA_SOURCE,
    // ⚠️ Ne jamais exposer les secrets (clés API, tokens, passwords)
  });
});
// Status Route
app.get("/", ejsRenderStatus)
app.get("/status", ejsRenderStatus)
app.get("/api/status", ejsRenderStatus)
```

Exemples: voir le fichier src/data/DATA-SAMPLES.md

# modules

## express.static

To load files that are in the public (or other specified) directory:

```
app.use(express.static('public'))
app.use(express.static('files'))
```


``http://localhost:3000/images/kitten.jpg``
``http://localhost:3000/css/style.css``
``http://localhost:3000/js/app.js``
``http://localhost:3000/images/bg.png``
``http://localhost:3000/hello.html``
``

## cors

Le package cors disponible sur npm est un middleware Node.js conçu pour les applications Express/Connect afin de gérer les en-têtes de partage des ressources cross-origin (CORS). Il permet de définir quels origines peuvent accéder aux réponses de votre serveur depuis un navigateur.

**Important**:  
CORS est contrôlé par le navigateur. Les clients non-browseurs (curl, Postman, autres serveurs) ignorent ces en-têtes. Ce package ne bloque pas les requêtes — il ne fait que définir les en-têtes de réponse. Pour protéger votre API, utilisez l’authentification et l’autorisation.

Requis avec tsconfig.json
```
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true
  }
}
```


# _TODO_ ******************\*\*\*\*******************

## MYSQL

Ajouter MySQL à son serveur API local

1. Installation MySQL
  npm install mysql2
  npm install -D @types/mysql2

2. Configuration de la base de données
  src/db/config.ts :
  import mysql from 'mysql2/promise'
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
  }

3. Script de création de tables
src/db/schema.sql :
CREATE DATABASE IF NOT EXISTS mon_app;
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
); 

4. Modèles de données
src/models/User.ts :
import { pool } from '../db/config'
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
} 

5. Serveur mis à jour
src/index.ts :
import express, { Request, Response } from 'express'
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

## Autres fonctionnalités possibles :

### 🔐 1. Authentification JWT
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

### 📁 2. Upload de fichiers
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

### ✅ 3. Validation de données
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

### 📝 4. Logging
bashnpm install winston

### 🌐 5. WebSocket (temps réel)
bashnpm install socket.io
npm install -D @types/socket.io

### 📧 6. Envoi d'emails
bashnpm install nodemailer
npm install -D @types/nodemailer

### 🔍 7. Recherche et pagination
typescriptapp.get('/api/users', async (req, res) => {
const { page = 1, limit = 10, search = '' } = req.query
// Logique de pagination et recherche
})

### 🔄 8. Cache avec Redis
bashnpm install redis

### 📊 9. Rate limiting
bashnpm install express-rate-limit

### 🧪 10. Tests API
bashnpm install -D jest supertest @types/jest @types/supertest

### DB, Drizzle

Gestion ORM pour mySQL

## tools

### Pour arrêter le serveur automatiquement

Note : **Ctrl + C** reste la méthode standard et la plus simple pour arrêter un serveur en développement.

npm install -D kill-port

package.json
{
  "scripts": {
    "dev": "vite",
    "stop": "kill-port 5173",
    "restart": "npm run stop && npm run dev"
  }
}

npm run stop      # Arrête le serveur sur le port 5173
npm run restart   # Redémarre le serveur

### Alternative multi-plateforme

npm install -D cross-env npm-run-all

package.json
{
  "scripts": {
    "dev": "vite",
    "clean": "kill-port 5173 || true",
    "start": "npm run clean && npm run dev"
  }
}
