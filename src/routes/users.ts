// src/schemas/products.ts
import { config, DataSource } from "../config/env"
import { Router, Request, Response } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { User } from '../types/index'
import { readFromJson, writeToJson } from '../utils/file'
import { applyCriteria, type SearchCriteria } from '../utils/query'
import { searchRateLimiter } from '../middleware/rateLimiter'
import { asyncHandler } from '../middleware/errorHandler'
import { validate } from '../middleware/validate'
import { CreateUserSchema, UpdateUserSchema } from '../schemas/user.schema'


// ✅ Import des helpers de réponse standardisés.  //sendNotFoundError,  //sendServerError,
import { sendSuccess, sendSuccessSimple, sendCreated, sendDeleted, createPaginationMeta } from '../utils/response'
// ✅ Import des erreurs personnalisées
import { NotFoundError, FileReadError, FileWriteError } from '../utils/AppError'

/**
 * Configuration de la méthode de génération d'ID pour les users
 * Peut être modifiée via variable d'environnement ou configuration
 */
import { generateId, IdGenerationOptions, type IdGenerationMethod } from '../utils/generateId'
const ID_GENERATION_METHOD: IdGenerationMethod = 
  (config.userIdMethod as IdGenerationMethod) || 'nanoid'

const router = Router()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_SOURCE = (config.dataSource || "local").toLowerCase()
const IS_GITHUB = DATA_SOURCE === "github"
// pas besoin de valeur par defaut! definie dans env.ts
const DATA_FILE = IS_GITHUB ? config.github.usersFilePath : config.local.usersFilePath

// ========================================
// GET tous les utilisateurs (avec pagination)
// ========================================
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await readFromJson<User>(DATA_FILE);
    if (!data) {
      throw new FileReadError(DATA_FILE);
    }
    // Récupérer les paramètres de pagination
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    // Appliquer la pagination si limit est défini
    let paginatedData = data;
    if (limit !== undefined) {
      paginatedData = data.slice(offset, offset + limit);
    }
    // ✅ Réponse standardisée avec métadonnées
    return sendSuccess(
      res,
      paginatedData,
      200,
      createPaginationMeta(data.length, limit || data.length, offset),
    );
  }),
);

// ========================================
// GET un utilisateur par ID
// ========================================
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await readFromJson<User>(DATA_FILE);
    if (!data) {
      throw new FileReadError(DATA_FILE);
    }
    const userId = parseInt(String(req.params.id));
    const user = data.find((u: User) => u.id === userId);
    if (!user) {
      // ✅ Utilise l'erreur personnalisée
      throw new NotFoundError("User", userId);
    }
    // ✅ Réponse standardisée
    return sendSuccess(res, user);
  }),
);

// ========================================
// POST créer un utilisateur
// ========================================
router.post(
  "/", validate(CreateUserSchema), 
  asyncHandler(async (req: Request, res: Response) => {
    const data = await readFromJson<User>(DATA_FILE);
    if (!data) {
      throw new FileReadError(DATA_FILE);
    }
    // ✅ Génère un nouvel ID selon la méthode configurée
    let newId: string;
    if (ID_GENERATION_METHOD === "sequential") {
      // Pour sequential, on a besoin de la liste des IDs existants
      const existingIds = data.map((p) => String(p.id));
      newId = generateId({ method: "sequential", existingIds });
    } else {
      // Pour les autres méthodes
      newId = generateId({ method: ID_GENERATION_METHOD, length: 12 });
    }
    // Créer le nouveau produit avec l'ID généré
    const newUser: User = {
        id: newId,
        ...req.body,
        created_at: new Date().toISOString(),
      }
    data.push(newUser);
    const success = await writeToJson(data, DATA_FILE);
    if (!success) {
      throw new FileWriteError(DATA_FILE);
    }
    // ✅ Réponse standardisée 201 Created
    return sendCreated(res, newUser);
  }),
);

// ========================================
// PUT mettre à jour un utilisateur
// ========================================
router.put(
  "/:id", validate(UpdateUserSchema), 
  asyncHandler(async (req: Request, res: Response) => {
    const data = await readFromJson<User>(DATA_FILE);
    if (!data) {
      throw new FileReadError(DATA_FILE);
    }
    const userId = parseInt(String(req.params.id));
    const index = data.findIndex((u: User) => u.id === userId);
    if (index === -1) {
      throw new NotFoundError("User", userId);
    }
    // Mettre à jour l'utilisateur
    data[index] = {
      ...data[index],
      ...req.body,
      id: userId, // Garder l'ID original
    };
    const success = await writeToJson(data, DATA_FILE);
    if (!success) {
      throw new FileWriteError(DATA_FILE);
    }
    // ✅ Réponse standardisée
    return sendSuccess(res, data[index]);
  }),
);

// ========================================
// DELETE supprimer un utilisateur
// ========================================
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const data = await readFromJson<User>(DATA_FILE);
    if (!data) {
      throw new FileReadError(DATA_FILE);
    }
    const userId = parseInt(String(req.params.id));
    const index = data.findIndex((u: User) => u.id === userId);
    if (index === -1) {
      throw new NotFoundError("User", userId);
    }
    data.splice(index, 1);
    const success = await writeToJson(data, DATA_FILE);
    if (!success) {
      throw new FileWriteError(DATA_FILE);
    }
    // ✅ Réponse standardisée de suppression
    return sendDeleted(res, `User ${userId} supprimé avec succès`);
  }),
);

export default router;
