// src/validation/valibot/adapter.ts
// Adapte un schéma Valibot à l'interface Schema<T> commune

import * as v from "valibot"
import type { Schema, ParseResult } from "../types"

export function valibotSchema<T>(
  schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>,
): Schema<T> {
  return {
    parse(data: unknown): ParseResult<T> {
      const result = v.safeParse(schema, data)
      // failure
      if (!result.success) {
        const errors: Record<string, string[]> = {}
        for (const issue of result.issues) {
          const field = issue.path?.map((p) => p.key).join(".") || "_root"
          if (!errors[field]) errors[field] = []
          errors[field].push(issue.message)
        }
        return { success: false, errors }
      }
      // success
      return { success: true, data: result.output }
    },
  }
}

// Log au démarrage pour confirmer l'adapter actif
console.log(`✅ Backend validation adapter: validation/valibot/adapter`)