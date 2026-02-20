// src/validation/valibot/user.schema.ts

import * as v from 'valibot'
import { valibotSchema } from './adapter'

const UserSchema = v.object({
  id:         v.pipe(v.string(), v.minLength(1, 'User id is required')),
  name:       v.pipe(v.string(), v.minLength(2, 'Name must be at least 2 characters'), v.maxLength(100)),
  email:      v.pipe(v.string(), v.email('Invalid email address')),
  created_at: v.optional(v.pipe(v.string(), v.isoTimestamp())),
})

// Schemas bruts — nécessaires pour inférer les types AVANT l'enveloppement
const RawCreateUserSchema = v.omit(UserSchema, ['id', 'created_at'])
const RawUpdateUserSchema  = v.partial(v.omit(UserSchema, ['id', 'created_at']))

// Schemas enveloppés — exportés pour le middleware validate()
export const CreateUserSchema = valibotSchema(RawCreateUserSchema)
export const UpdateUserSchema  = valibotSchema(RawUpdateUserSchema)

// ✅ Types utiles pour typer req.body dans les routes
// ❌ UserSchema n'est jamais exporté ni utilisé directement
export type CreateUserInput = v.InferOutput<typeof RawCreateUserSchema>
export type UpdateUserInput = v.InferOutput<typeof RawUpdateUserSchema>