
import './config/env' // ✅ EN PREMIER, avant TOUT autre import

import express from "express"
import type { Request, Response } from "express"

import path from 'path'
import cors from "cors"
import { fileURLToPath } from "url"

// ✅ Import des nouveaux middlewares Phase 1
import { securityMiddleware, sanitizeInput } from "./middleware/security"
import { globalRateLimiter, writeRateLimiter } from "./middleware/rateLimiter"
import { errorHandler, notFoundHandler } from "./middleware/errorHandler"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const startedAt = new Date().toLocaleString()   // toISOString()

const app = express()
const PORT = process.env.PORT || 3010

// Configuration EJS
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
// EJS common views
const ejsRenderStatus = (req: Request, res: Response) => {
  // src/views/status.ejs
  res.render("status", {
    status: "OK",
    dataSource: process.env.DATA_SOURCE || "local",
    productsPath: process.env.PRODUCTS_FILE_PATH || 'undefined',
    startedAt: startedAt,
  })
}

// ========================================
// 🔒 MIDDLEWARES 
// ========================================

// ========================================
// ✅ PHASE 1: MIDDLEWARES DE SÉCURITÉ
// ========================================

// 1. Helmet - Sécurisation des headers HTTP
app.use(securityMiddleware)

// 2. Static files (avant CORS) // Adapt for the correct directory
app.use(express.static("public"))

// 3. CORS - Configuration des origines autorisées
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // En prod: spécifier les domaines autorisés
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// 4. Body parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 5. Sanitization des inputs
app.use(sanitizeInput)

// 6. Rate limiting global
app.use(globalRateLimiter)

// ========================================
// 🔒 ROUTES 
// ========================================
import productsRouter from "./routes/products"
import usersRouter from "./routes/users"

// Products Routes (avec rate limiter d'écriture)
app.use("/api/products", writeRateLimiter, productsRouter)

// Users Routes (avec rate limiter d'écriture)
app.use("/api/users", writeRateLimiter, usersRouter)

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

// ========================================
// ✅ PHASE 1: GESTION D'ERREURS
// ========================================

// 404 - Route non trouvée (doit être après toutes les routes)
app.use(notFoundHandler)
// Middleware de gestion d'erreurs global (doit être en dernier)
app.use(errorHandler)

// ========================================
// 🔒 Start server 
// ========================================
const logDataSource = () => {
  if (process.env.DATA_SOURCE === 'local') {
    return `📊 Data source: LOCAL`
  }
  if (process.env.DATA_SOURCE === 'github') {
    return `📊 Data source: GITHUB
      Owner: ${process.env.GITHUB_OWNER}
      Repo/Branch: ${process.env.GITHUB_REPO} / ${process.env.GITHUB_BRANCH}
    `
  }
  return `📊 Data source: ERROR`
}
app.listen(PORT, () => {
  console.log(`✅ Server API
    http://localhost:${PORT}
    🔒 Security: Helmet ✓, Rate Limiter ✓
    🛡️  Protection: Sanitization ✓, Error Handler ✓
    ~..........................~
    startedAt: ${startedAt}
    ${logDataSource()}
    📊 Products: ${process.env.PRODUCTS_FILE_PATH || "src/data/products.json"}
  `)
})
