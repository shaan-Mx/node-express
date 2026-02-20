// src/validation/zod/adapter.ts
// Adapte un schéma Zod à l'interface Schema<T> commune

import { ZodType, ZodError } from "zod"
import type { Schema, ParseResult } from "../types"

export function zodSchema<T>(schema: ZodType<T>): Schema<T> {
  return {
    parse(data: unknown): ParseResult<T> {
      const result = schema.safeParse(data)
      // failure
      if (!result.success) {
        const errors: Record<string, string[]> = {}
        for (const issue of result.error.issues) {
          const field = issue.path.join(".") || "_root"
          if (!errors[field]) errors[field] = []
          errors[field].push(issue.message)
        }
        return { success: false, errors }
      }
      // success
      return { success: true, data: result.data }
    },
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

// Log au démarrage pour confirmer l'adapter actif
console.log(`✅ Backend validation adapter: validation/zod/adapter`)