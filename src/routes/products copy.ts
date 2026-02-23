// src/schemas/products.ts
import { config } from "../config/env";
import { Router, Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";

import { Product } from "../types/index";
import { CreateProductSchema, UpdateProductSchema } from "../validation/index";

import { readFromJson, writeToJson } from "../utils/file";
import { applyCriteria, type SearchCriteria } from "../utils/query";

import {
  sendSuccess,
  sendSuccessSimple,
  sendCreated,
  sendDeleted,
} from "../utils/response";
import {
  NotFoundError,
  FileReadError,
  FileWriteError,
} from "../utils/AppError";

import {
  generateId,
  IdGenerationOptions,
  type IdGenerationMethod,
} from "../utils/generateId";
const ID_GENERATION_METHOD: IdGenerationMethod =
  (config.productIdMethod as IdGenerationMethod) || "nanoid";

// middlewares
import { searchRateLimiter } from "../middleware/rateLimiter";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { paginate, applySort, applyPagination } from "../middleware/paginate";

/* */
const router = Router();

const __filename = fileURLToPath(import.meta.url); // utile ??
const __dirname = path.dirname(__filename); // utile ??

const DATA_SOURCE = (config.dataSource || "local").toLowerCase();
const IS_GITHUB = DATA_SOURCE === "github";
// pas besoin de valeur par defaut! definie dans env.ts
const DATA_FILE = IS_GITHUB
  ? config.github.productsFilePath
  : config.local.productsFilePath;

// =======================================================================
// GET /env
// get environment
// =======================================================================
router.get(
  "/env",
  asyncHandler(async (req: Request, res: Response) => {
    console.log(`BackEnd.router(GET,/env)`);
    return sendSuccessSimple(res, {
      dataSource: config.dataSource,
      filePath: DATA_FILE,
      pagination: config.pagination,
      // ⚠️ Ne jamais exposer les secrets (clés API, tokens, passwords)
    });
  }),
);

// =======================================================================
// GET /
// get all items[<User>]
// + middleware pagination ET (optional) sort inline
// ✅ paginate() remplace la logique limit/offset inline
// =======================================================================
// samples:
//    GET /products                        → page 1, limit 20 (défauts)
//    GET /products?limit=10               → page 1, limit 10
//    GET /products?page=3&limit=10        → page 3 (offset=20)
//    GET /products?offset=40&limit=10     → offset 40
//    GET /products?limit=999              → plafonné à 100
// =======================================================================
router.get(
  "/",
  paginate(),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await readFromJson<Product>(DATA_FILE); // json/products.json OU src/data/products.json
    if (!data) throw new FileReadError(DATA_FILE);
    // 1. Sort inline (si ?sortBy=...)
    const sorted = applySort(data, req.sort);
    // 2. req.pagination is updated in paginate()
    const { data: dataPage, meta } = applyPagination(sorted, req.pagination);
    return sendSuccess(res, dataPage, 200, meta);
  }),
);

// =======================================================================
// GET /:id
// get item<User> by Id
// =======================================================================
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await readFromJson<Product>(DATA_FILE);
    if (!data) throw new FileReadError(DATA_FILE);
    const reqId = req.params.id as string;
    const found = data.find((p: Product) => p.id === reqId);
    if (!found) throw new NotFoundError("Product", reqId);
    // ✅ Réponse standardisée. statusCode, meta: not needed
    return sendSuccess(res, found);
  }),
);

// =======================================================================
// POST /search
// search items[<User>] by criteria (where/orderBy) + pagination
// ✅ paginate() gère limit/offset — applyCriteria gère where/orderBy
// =======================================================================
router.post(
  "/search",
  searchRateLimiter,
  paginate(),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await readFromJson<Product>(DATA_FILE);
    if (!data) throw new FileReadError(DATA_FILE);
    const criteria: SearchCriteria = req.body;
    console.log("🔍 /search Product criteria=", criteria);
    // 1. Filtrage + tri (sans pagination)
    const filtered = applyCriteria(data, {
      where: criteria.where,
      orderBy: criteria.orderBy,
    });
    // 2. Pagination — priorité aux params body, fallback sur query
    const params = {
      limit: criteria.limit ?? req.pagination.limit,
      offset: criteria.offset ?? req.pagination.offset,
      page: req.pagination.page,
    };
    const { data: dataPage, meta } = applyPagination(filtered, params);
    return sendSuccess(res, dataPage, 200, meta);
  }),
);

// =======================================================================
// POST / + req.body[data of new item<User>]
// create item<User> + middleware validation
// =======================================================================
router.post(
  "/",
  validate(CreateProductSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await readFromJson<Product>(DATA_FILE);
    if (!data) throw new FileReadError(DATA_FILE);
    // ✅ Génère un nouvel ID selon la méthode configurée
    let newId: string;
    if (ID_GENERATION_METHOD === "sequential") {
      // Pour sequential, on a besoin de la liste des IDs existants
      const existingIds = data.map((p) => p.id);
      newId = generateId({ method: "sequential", existingIds });
    } else {
      // Pour les autres méthodes
      newId = generateId({ method: ID_GENERATION_METHOD, length: 12 });
    }
    // Créer le nouveau produit avec l'ID généré
    const newItem: Product = {
      id: newId,
      ...req.body,
    };
    data.push(newItem);
    const success = await writeToJson(data, DATA_FILE);
    if (!success) throw new FileWriteError(DATA_FILE);
    // ✅ Réponse standardisée 201 Created
    return sendCreated(res, newItem);
  }),
);

// =======================================================================
// PUT /:id
// update item<User> by Id + middleware validation
// =======================================================================
router.put(
  "/:id",
  validate(UpdateProductSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await readFromJson<Product>(DATA_FILE);
    if (!data) throw new FileReadError(DATA_FILE);
    const reqId = req.params.id as string;
    const index = data.findIndex((p: Product) => p.id === reqId);
    if (index === -1) throw new NotFoundError("Product", reqId);
    // Mettre à jour le produit
    data[index] = {
      ...data[index],
      ...req.body,
      id: reqId, // Garder l'ID original
    };
    const success = await writeToJson(data, DATA_FILE);
    if (!success) throw new FileWriteError(DATA_FILE);
    // ✅ Réponse standardisée
    return sendSuccess(res, data[index]);
  }),
);

// =======================================================================
// DELETE /:id
// delete item<User>
// =======================================================================
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await readFromJson<Product>(DATA_FILE);
    if (!data) throw new FileReadError(DATA_FILE);
    const reqId = String(req.params.id);
    const index = data.findIndex((p: Product) => p.id === reqId);
    if (index === -1) throw new NotFoundError("Product", reqId);
    data.splice(index, 1);
    const success = await writeToJson(data, DATA_FILE);
    if (!success) throw new FileWriteError(DATA_FILE);
    // ✅ Réponse standardisée de suppression
    return sendDeleted(res, `Product ${reqId} deleted`);
  }),
);

export default router;