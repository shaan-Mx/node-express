// src/validation/zod/user.schema.ts
import { z } from 'zod'
import { zodSchema } from './adapter'

const UserSchema = z.object({
  id:         z.string().min(1, 'User id is required'),
  name:       z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:      z.email('Invalid email address'),
  created_at: z.iso.datetime().optional(),
})

// Schemas bruts — nécessaires pour inférer les types AVANT l'enveloppement
const RawCreateUserSchema = UserSchema.omit({ id: true, created_at: true })
const RawUpdateUserSchema  = UserSchema.omit({ id: true, created_at: true }).partial()

// Schemas enveloppés — exportés pour le middleware validate()
export const CreateUserSchema = zodSchema(RawCreateUserSchema)
export const UpdateUserSchema  = zodSchema(RawUpdateUserSchema)

// ✅ Types utiles pour typer req.body dans les routes
// ❌ UserSchema n'est jamais exporté ni utilisé directement
export type CreateUserInput = z.infer<typeof RawCreateUserSchema>
export type UpdateUserInput = z.infer<typeof RawUpdateUserSchema>