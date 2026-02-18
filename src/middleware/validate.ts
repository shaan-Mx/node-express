// src/middmeware/validate.ts
import type { Request, Response, NextFunction } from 'express'
import { ZodType, ZodError } from 'zod'

/**
 * Middleware factory : valide req.body avec le schéma Zod fourni.
 * En cas d'erreur, retourne 400 avec le détail des champs invalides.
 *
 * Usage dans une route :
 *   router.post('/', validate(CreateProductSchema), async (req, res) => { ... })
 */
export function validate<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = formatZodErrors(result.error)
      res.status(400).json({
        error:   'Validation failed',
        details: errors,
      })
      return
    }
    // Remplace req.body par les données validées et coercées par Zod
    req.body = result.data
    next()
  }
}

// ── Formateur d'erreurs lisible ───────────────────────────────────────────────
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.') || '_root'
    if (!formatted[field]) formatted[field] = []
    formatted[field].push(issue.message)
  }
  return formatted
}