// src/validation/zod/product.schema.ts

import { z } from 'zod'
import { zodSchema } from './adapter'

// ── Variant ──────────────────────────────────────────────────────────────────
const VariantSchema = z.object({
  id:       z.uuid({ message: 'Variant id must be a UUID' }),
  title:    z.string().min(1, { message: 'Variant title is required' }),
  sku:      z.string().min(1, { message: 'Variant SKU is required' }),
  quantity: z.number().int().min(0, { message: 'Quantity must be >= 0' }),
})

// ── Product (full record, id inclus) ─────────────────────────────────────────
const ProductSchema = z.object({
  id:          z.string().min(1, { message: 'Product id is required' }),
  title:       z.string().min(1, { message: 'Title is required' }).max(200),
  description: z.string().min(1, { message: 'Description is required' }),
  category:    z.string().min(1, { message: 'Category is required' }),
  price:       z.string().regex(/^\d+(\.\d{1,2})?$/, { message: 'Price must be a valid decimal string (e.g. "19.99")' }),
  //price:       z.number().positive({ message: 'Price must be a positive number' }),
  images:      z.array(z.string()).min(1, { message: 'At least one image is required' }),
  tags:        z.array(z.string()).default([]),
  variants:    z.array(VariantSchema).default([]),
})

// Schemas bruts — nécessaires pour inférer les types AVANT l'enveloppement
const RawCreateProductSchema = ProductSchema.omit({ id: true })
const RawUpdateProductSchema  = ProductSchema.omit({ id: true }).partial()

// Schemas enveloppés — exportés pour le middleware validate()
export const CreateProductSchema = zodSchema(RawCreateProductSchema)
export const UpdateProductSchema  = zodSchema(RawUpdateProductSchema)

// ✅ Types utiles pour typer req.body dans les routes
// export type ProductInput  = z.infer<typeof ProductSchema>
// ❌ ProductInput supprimé — ProductSchema n'est jamais exporté ni utilisé directement
export type CreateProductInput = z.infer<typeof RawCreateProductSchema>
export type UpdateProductInput = z.infer<typeof RawUpdateProductSchema>