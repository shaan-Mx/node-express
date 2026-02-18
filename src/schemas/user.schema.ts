// src/schemas/user.schema.ts
import { z } from 'zod'

// ── User (full record) ────────────────────────────────────────────────────────
export const UserSchema = z.object({
  id:         z.number().int().positive(),
  name:       z.string().min(2, { message: 'Name must be at least 2 characters' }).max(100),
  email:      z.email({ message: 'Invalid email address' }),
  created_at: z.iso.datetime().optional(),
})

// ── POST : création (sans id ni created_at) ───────────────────────────────────
export const CreateUserSchema = UserSchema.omit({ id: true, created_at: true })

// ── PUT : mise à jour partielle ───────────────────────────────────────────────
export const UpdateUserSchema = CreateUserSchema.partial()

// ── Types inférés ─────────────────────────────────────────────────────────────
export type UserInput        = z.infer<typeof UserSchema>
export type CreateUserInput  = z.infer<typeof CreateUserSchema>
export type UpdateUserInput  = z.infer<typeof UpdateUserSchema>