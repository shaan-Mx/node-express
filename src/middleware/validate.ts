// src/middleware/validate.ts
// Middleware générique
// fonctionne avec Zod ET Valibot grâce à l'interface Schema<T> commune (validation/types.ts)

import type { Request, Response, NextFunction } from 'express'
import type { Schema } from '../validation/types.ts'

/**
 * Usage dans une route :
 *   import { CreateProductSchema } from '../validation/index.js'
 *   router.post('/', validate(CreateProductSchema), asyncHandler(...))
 *
 * Le middleware ne sait pas si c'est Zod ou Valibot
 * Il utilise uniquement l'interface Schema<T> commune.
 */
export function validate<T>(schema: Schema<T>) {
  return (
    req: Request, 
    res: Response, 
    next: NextFunction
  ): void => {
    const result = schema.parse(req.body)
    // failure
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.errors,
      })
      return
    }
    // success
    // req.body remplacé par les données validées et coercées
    req.body = result.data
    next()
  }
}