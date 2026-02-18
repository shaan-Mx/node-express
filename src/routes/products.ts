// src/schemas/products.ts
import { config, DataSource } from "../config/env"
import { Router, Request, Response } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { Product } from '../types/index'
import { readFromJson, writeToJson } from '../utils/file'
import { applyCriteria, type SearchCriteria } from '../utils/query'
import { searchRateLimiter } from '../middleware/rateLimiter'
import { asyncHandler } from '../middleware/errorHandler'
import { validate } from '../middleware/validate'
import { CreateProductSchema, UpdateProductSchema } from '../schemas/product.schema'



// ✅ Import des helpers de réponse standardisés.  //sendNotFoundError,  //sendServerError,
import { sendSuccess, sendSuccessSimple, sendCreated, sendDeleted, createPaginationMeta } from '../utils/response'
// ✅ Import des erreurs personnalisées
import { NotFoundError, FileReadError, FileWriteError } from '../utils/AppError'

/**
 * Configuration de la méthode de génération d'ID pour les produits
 * Peut être modifiée via variable d'environnement ou configuration
 */
import { generateId, IdGenerationOptions, type IdGenerationMethod } from '../utils/generateId'
const ID_GENERATION_METHOD: IdGenerationMethod = 
  (config.productIdMethod as IdGenerationMethod) || 'nanoid'

const router = Router()

const __filename = fileURLToPath(import.meta.url) // utile ??
const __dirname = path.dirname(__filename) // utile ??

const DATA_SOURCE = (config.dataSource || "local").toLowerCase()
const IS_GITHUB = DATA_SOURCE === "github"
// pas besoin de valeur par defaut! definie dans env.ts
const DATA_FILE = IS_GITHUB ? config.github.productsFilePath : config.local.productsFilePath 

  // ========================================
// GET /env
// get data env
// ========================================
router.get('/env', asyncHandler(async (req: Request, res: Response) => {
  const data = {
    dataSource: config.dataSource,
    filePath: DATA_FILE
    // ⚠️ Ne jamais exposer les secrets (clés API, tokens, passwords)
  }
  return sendSuccessSimple(res, data, 200)
}))

// ========================================
// GET /
// get all products (avec pagination)
// ========================================
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const data = await readFromJson<Product>(DATA_FILE) // json/products.json OU src/data/products.json
  if (!data) {
    throw new FileReadError(DATA_FILE)
  }
  // Récupérer les paramètres de pagination
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0
  // Appliquer la pagination si limit est défini
  let paginatedData = data
  if (limit !== undefined) {
    paginatedData = data.slice(offset, offset + limit)
  }
  // ✅ Réponse standardisée avec métadonnées
  return sendSuccess(
    res,
    paginatedData,
    200,
    createPaginationMeta(data.length, limit || data.length, offset)
  )
}))

// ========================================
// GET /:id
// get a product by Id
// ========================================
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const data = await readFromJson<Product>(DATA_FILE)
  if (!data) {
    throw new FileReadError(DATA_FILE)
  }
  const reqId = req.params.id as string
  const found = data.find((p: Product) => p.id === reqId)
  if (!found) {
    // ✅ Utilise l'erreur personnalisée
    throw new NotFoundError('Product', reqId)
  }
  // ✅ Réponse standardisée
  // statusCode, meta: not needed
  return sendSuccess(res, found)
}))

// ========================================
// POST /search 
// search with criteria(s)
// ========================================
router.post('/search', searchRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const data = await readFromJson<Product>(DATA_FILE)
  if (!data) {
    throw new FileReadError(DATA_FILE)
  }
  const criteria: SearchCriteria = req.body
  console.log('🔍 /search Product criteria=', criteria)
  // Filtrer et trier (SANS limit/offset)
  const criteriaWithoutPagination = {
    where: criteria.where,
    orderBy: criteria.orderBy
  }
  // applyCriteria from utils/query.ts
  const filteredData = applyCriteria(data, criteriaWithoutPagination)
  // Calculer le total APRÈS filtrage mais AVANT pagination
  const total = filteredData.length
  // Appliquer la pagination manuellement
  const limit = criteria.limit || total
  const offset = criteria.offset || 0
  const paginatedData = filteredData.slice(offset, offset + limit)
  // ✅ Réponse standardisée avec métadonnées
  return sendSuccess(
    res,
    paginatedData,
    200,
    createPaginationMeta(total, limit, offset)
  )
}))

// ========================================
// POST / + req.body[data of new product]
// create a product / ajout de zod
// ========================================
router.post('/', validate(CreateProductSchema), asyncHandler(async (req: Request, res: Response) => {
  const data = await readFromJson<Product>(DATA_FILE)
  if (!data) {
    throw new FileReadError(DATA_FILE)
  }
  // ✅ Génère un nouvel ID selon la méthode configurée
  let newId: string
  if (ID_GENERATION_METHOD === 'sequential') {
    // Pour sequential, on a besoin de la liste des IDs existants
    const existingIds = data.map(p => p.id)
    newId = generateId({ method: 'sequential', existingIds })
  } else {
    // Pour les autres méthodes
    newId = generateId({ method: ID_GENERATION_METHOD, length: 12 })
  }
  // Créer le nouveau produit avec l'ID généré
  const newProduct: Product = {
    id: newId,
    ...req.body,
  }
  data.push(newProduct)
  const success = await writeToJson(data, DATA_FILE)
  if (!success) {
    throw new FileWriteError(DATA_FILE)
  }
  // ✅ Réponse standardisée 201 Created
  return sendCreated(res, newProduct)
}))

// ========================================
// PUT /:id
// update the product defined by id  / ajout de zod
// ========================================
router.put('/:id', validate(UpdateProductSchema),asyncHandler(async (req: Request, res: Response) => {
  const data = await readFromJson<Product>(DATA_FILE)
  if (!data) {
    throw new FileReadError(DATA_FILE)
  }
  const reqId = String(req.params.id)
  const index = data.findIndex((p: Product) => p.id === reqId)
  if (index === -1) {
    throw new NotFoundError('Product', reqId)
  }
  // Mettre à jour le produit
  data[index] = {
    ...data[index],
    ...req.body,
    id: reqId, // Garder l'ID original
  }
  const success = await writeToJson(data, DATA_FILE)
  if (!success) {
    throw new FileWriteError(DATA_FILE)
  }
  // ✅ Réponse standardisée
  return sendSuccess(res, data[index])
}))

// ========================================
// DELETE /:id
// delete the product defined by id
// ========================================
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const data = await readFromJson<Product>(DATA_FILE)
  if (!data) {
    throw new FileReadError(DATA_FILE)
  }
  const reqId = String(req.params.id)
  const index = data.findIndex((p: Product) => p.id === reqId)
  if (index === -1) {
    throw new NotFoundError('Product', reqId)
  }
  data.splice(index, 1)
  const success = await writeToJson(data, DATA_FILE)
  if (!success) {
    throw new FileWriteError(DATA_FILE)
  }
  // ✅ Réponse standardisée de suppression
  return sendDeleted(res, `Product ${reqId} deleted`)
}))

export default router
