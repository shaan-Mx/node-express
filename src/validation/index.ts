// src/validation/index.ts
// Sélecteur automatique selon VALIDATION_LIB dans .env
// Les routes importent TOUJOURS depuis ici — jamais directement depuis zod/ ou valibot/
//
// see also src/middleware/validate.ts

import { config } from '../config/env'

// ── Products ──────────────────────────────────────────────────────────────────
export const {
  CreateProductSchema,
  UpdateProductSchema,
} = config.validationLib === 'valibot'
  ? await import('./valibot/product.schema')
  : await import('./zod/product.schema')

// ── Users ─────────────────────────────────────────────────────────────────────
export const {
  CreateUserSchema,
  UpdateUserSchema,
} = config.validationLib === 'valibot'
  ? await import('./valibot/user.schema')
  : await import('./zod/user.schema')

// Log au démarrage pour confirmer la lib active
console.log(`✅ Backend validation library: ${config.validationLib.toUpperCase()}`)