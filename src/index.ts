// src/index.ts
//import './config/env' // ✅ EN PREMIER, avant TOUT autre import
import { config } from './config/env'

import express from "express"
import type { Request, Response } from "express"

import path from 'path'
import cors from "cors"
import { fileURLToPath } from "url"

// see Phase 1 - 7bis
// updated: errorHandler (OK), baseService (OK)
import { logger, httpLogger } from '@shaan_mex/logger'

// import { logger } from './utils/logger/index'
// import { createHttpLogger } from './middleware/httpLogger'
import { securityMiddleware, sanitizeInput } from "./middleware/security"
import { globalRateLimiter, writeRateLimiter } from "./middleware/rateLimiter"
import { errorHandler, notFoundHandler } from "./middleware/errorHandler"

import productsRouter from "./routes/products"
import usersRouter from "./routes/users"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const startedAt = new Date().toLocaleString()   // toISOString()

const app = express()
const PORT = config.port || 3000

// HandleBars
app.set('view engine', 'hbs')
app.set("views", path.join(__dirname, "views"))
const viewStatus = (req: Request, res: Response) => {
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
// 7. logger - HTTP logger
// const httpLogger = await createHttpLogger()
//app.use(httpLogger)     
// 7bis. === TEST ===. logger personalisé
app.use(httpLogger({
  inject:  ['method', 'url'],
  exclude: ['/_pull']
}))

// ========================================
// 🔒 ROUTES 
// ========================================
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

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// Status Route (template)
app.get("/", viewStatus)
app.get("/status", viewStatus)
app.get("/api/status", viewStatus)

// library logger tests 
//app.use("/test", testLibLoggerRouter)
// ========================================
// ✅ PHASE 2: GESTION D'ERREURS
// ========================================

// 404 - Route non trouvée (doit être après toutes les routes)
app.use(notFoundHandler)
// 500 - Middleware de gestion d'erreurs global (doit être en dernier)
app.use(errorHandler)

// ========================================
// 🔒 Start server 
// ========================================
const logDataSource = () => {
  switch (config.dataSource) {
    case 'local':
      return `📊 Data source : LOCAL\n       Path : ${config.local.productsFilePath}`
    case 'github':
      return `📊 Data source : GITHUB\n   Owner : ${config.github.owner}\n   Repo / Branch : ${config.github.repo} / ${config.github.branch}`
    default:
      return `📊 Data source : UNKNOWN (${config.dataSource})`
  }
}
const logOs = () => {
  return `📊 OS :
       EOL: ${config.os.EOL_frm}
       machine: ${config.os.machine} | ${config.os.platform}
  `
}
const server = app.listen(PORT, () => {
  console.log(`✅ Server API
    http://localhost:${PORT}
    🔒 Security   : Helmet ✓, Rate Limiter ✓
    🛡️  Protection : Sanitization ✓, Error Handler ✓
    📝 Logger     : ${process.env.LOGGER?.toUpperCase() || 'PINO'}
    ~..........................~
    startedAt     : ${startedAt}
    ${logDataSource()}
    ~..........................~
    ${logOs()}
  `)
   // ✅ logger structuré pour monitoring / alerting
  ////////logger.info('Server started', {port: config.port, env: config.nodeEnv})
  //logger.warn('Server started', {port: config.port, env: config.nodeEnv})
  logger.info({ msg: 'server started', domain: 'service', port: PORT })
  /*
  logger.warn({ msg: 'server started', domain: 'service', port: PORT })
  logger.error({ msg: 'server started', domain: 'service', port: PORT })
  logger.trace({ msg: 'server started', domain: 'service', port: PORT })
  */
})

/*
// ── Gestion des erreurs process ───────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception — shutting down', { error: err.message, stack: err.stack })
  process.exit(1)
})
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection — shutting down', { reason: String(reason) })
  process.exit(1)
})
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Graceful shutdown')
  server.close(() => { logger.info('Server closed'); process.exit(0) })
})
process.on('SIGINT', () => {
  logger.info('SIGINT received — Graceful shutdown')
  server.close(() => { logger.info('Server closed'); process.exit(0) })
})
*/

export default app