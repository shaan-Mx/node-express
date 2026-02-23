// src/routes/users.ts

import { Router } from "express"
import { userController } from "../controllers/userController"

// middlewares
import { searchRateLimiter } from "../middleware/rateLimiter"
import { asyncHandler } from "../middleware/errorHandler"
import { validate } from "../middleware/validate"
import { paginate } from "../middleware/paginate"
// validation schemas
import { CreateUserSchema, UpdateUserSchema } from "../validation/index.js"

const router = Router()

// =======================================================================
// GET /env
// =======================================================================
router.get(
  "/env", 
  asyncHandler(userController.getEnv.bind(userController))
)

// =======================================================================
// GET /
// + middleware pagination ET (optional) sort inline
// =======================================================================
router.get(
  "/",
  paginate(),
  asyncHandler(userController.getAll.bind(userController)),
)

// =======================================================================
// GET /:id
// =======================================================================
router.get(
  "/:id", 
  asyncHandler(userController.getById.bind(userController))
)

// =======================================================================
// POST /search
// search by criteria (where/orderBy) + pagination
// =======================================================================
router.post(
  "/search",
  searchRateLimiter,
  paginate(),
  asyncHandler(userController.search.bind(userController)),
)

// =======================================================================
// POST /
// create + validation
// =======================================================================
router.post(
  "/",
  validate(CreateUserSchema),
  asyncHandler(userController.create.bind(userController)),
)

// =======================================================================
// PUT /:id
// update + validation
// =======================================================================
router.put(
  "/:id",
  validate(UpdateUserSchema),
  asyncHandler(userController.update.bind(userController)),
)

// =======================================================================
// DELETE /:id
// =======================================================================
router.delete(
  "/:id", 
  asyncHandler(userController.remove.bind(userController))
)

export default router
