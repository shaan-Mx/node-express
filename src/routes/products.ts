// src/schemas/products.ts

import { Router } from "express"
import { productController } from "../controllers/productController"

// middlewares
import { searchRateLimiter } from "../middleware/rateLimiter"
import { asyncHandler } from "../middleware/errorHandler"
import { validate } from "../middleware/validate"
import { paginate } from "../middleware/paginate"
// validation schemas
import { CreateProductSchema, UpdateProductSchema } from "../validation/index"

const router = Router();

// =======================================================================
// GET /env
// =======================================================================
router.get(
  "/env",
  asyncHandler(productController.getEnv.bind(productController)),
)

// =======================================================================
// GET /
// + middleware pagination ET (optional) sort inline
// samples:
//    GET /products                    → page 1, limit 20 (défauts)
//    GET /products?limit=10           → page 1, limit 10
//    GET /products?page=3&limit=10    → page 3 (offset=20)
//    GET /products?offset=40&limit=10 → offset 40
//    GET /products?limit=999          → plafonné à 100
//    GET /products?sortBy=price&sortDir=ASC
// =======================================================================
router.get(
  "/",
  paginate(),
  asyncHandler(productController.getAll.bind(productController)),
)

// =======================================================================
// GET /:id
// =======================================================================
router.get(
  "/:id",
  asyncHandler(productController.getById.bind(productController)),
)

// =======================================================================
// POST /search
// search by criteria (where/orderBy) + pagination
// =======================================================================
router.post(
  "/search",
  searchRateLimiter,
  paginate(),
  asyncHandler(productController.search.bind(productController)),
)

// =======================================================================
// POST /
// create + validation
// =======================================================================
router.post(
  "/",
  validate(CreateProductSchema),
  asyncHandler(productController.create.bind(productController)),
)

// =======================================================================
// PUT /:id
// update + validation
// =======================================================================
router.put(
  "/:id",
  validate(UpdateProductSchema),
  asyncHandler(productController.update.bind(productController)),
)

// =======================================================================
// DELETE /:id
// =======================================================================
router.delete(
  "/:id",
  asyncHandler(productController.remove.bind(productController)),
)

export default router
