// src/schemas/products.ts
import { config, DataSource } from "../config/env";
import { Router, Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";

import { User } from "../types/index";
import { CreateUserSchema, UpdateUserSchema } from "../validation/index";

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
  (config.userIdMethod as IdGenerationMethod) || "nanoid";

// middlewares
import { searchRateLimiter } from "../middleware/rateLimiter";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { paginate, applySort, applyPagination } from "../middleware/paginate";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_SOURCE = (config.dataSource || "local").toLowerCase();
const IS_GITHUB = DATA_SOURCE === "github";
// pas besoin de valeur par defaut! definie dans env.ts
const DATA_FILE = IS_GITHUB
  ? config.github.usersFilePath
  : config.local.usersFilePath;

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
router.get(
  "/",
  paginate(),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await readFromJson<User>(DATA_FILE);
    if (!data) throw new FileReadError(DATA_FILE);
    const sorted = applySort(data, req.sort);
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
    const data = await readFromJson<User>(DATA_FILE);
    if (!data) throw new FileReadError(DATA_FILE);
    const reqId = req.params.id as string;
    const found = data.find((u: User) => u.id === reqId);
    if (!found) throw new NotFoundError("User", reqId);
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
    const data = await readFromJson<User>(DATA_FILE);
    if (!data) throw new FileReadError(DATA_FILE);
    const criteria: SearchCriteria = req.body;
    console.log("🔍 /search User criteria=", criteria);
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
  validate(CreateUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await readFromJson<User>(DATA_FILE);
    if (!data) throw new FileReadError(DATA_FILE);
    // ✅ Génère un nouvel ID selon la méthode configurée
    let newId: string;
    if (ID_GENERATION_METHOD === "sequential") {
      const existingIds = data.map((u) => String(u.id));
      newId = generateId({ method: "sequential", existingIds });
    } else {
      newId = generateId({ method: ID_GENERATION_METHOD, length: 12 });
    }
    // Créer le nouveau user avec l'ID généré
    const newItem: User = {
      id: newId,
      ...req.body,
      created_at: new Date().toISOString(),
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
  validate(UpdateUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await readFromJson<User>(DATA_FILE);
    if (!data) throw new FileReadError(DATA_FILE);
    const reqId = req.params.id as string;
    const index = data.findIndex((u: User) => u.id === reqId);
    if (index === -1) throw new NotFoundError("User", reqId);
    // Mettre à jour l'utilisateur
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
    const data = await readFromJson<User>(DATA_FILE);
    if (!data) throw new FileReadError(DATA_FILE);
    const reqId = req.params.id as string;
    const index = data.findIndex((u: User) => u.id === reqId);
    if (index === -1) throw new NotFoundError("User", reqId);
    data.splice(index, 1);
    const success = await writeToJson(data, DATA_FILE);
    if (!success) throw new FileWriteError(DATA_FILE);
    // ✅ Réponse standardisée de suppression
    return sendDeleted(res, `User ${reqId} supprimé avec succès`);
  }),
);

export default router