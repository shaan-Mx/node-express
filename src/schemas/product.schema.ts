// src/schemas/product.schema.ts
import { z } from 'zod'

// ── Variant ──────────────────────────────────────────────────────────────────
export const VariantSchema = z.object({
  id:       z.uuid({ message: 'Variant id must be a UUID' }),
  title:    z.string().min(1, { message: 'Variant title is required' }),
  sku:      z.string().min(1, { message: 'Variant SKU is required' }),
  quantity: z.number().int().min(0, { message: 'Quantity must be >= 0' }),
})

// ── Product (full record, id inclus) ─────────────────────────────────────────
export const ProductSchema = z.object({
  id:          z.string().min(1, { message: 'Product id is required' }),
  title:       z.string().min(1, { message: 'Title is required' }).max(200),
  description: z.string().min(1, { message: 'Description is required' }),
  category:    z.string().min(1, { message: 'Category is required' }),
  price:       z.string().regex(/^\d+(\.\d{1,2})?$/, { message: 'Price must be a valid decimal string (e.g. "19.99")' }),
  images:      z.array(z.string()).min(1, { message: 'At least one image is required' }),
  tags:        z.array(z.string()).default([]),
  variants:    z.array(VariantSchema).default([]),
})

// ── POST : création (sans id, généré côté serveur) ───────────────────────────
export const CreateProductSchema = ProductSchema.omit({ id: true })

// ── PUT : mise à jour partielle (tous les champs optionnels sauf id) ──────────
export const UpdateProductSchema = ProductSchema.omit({ id: true }).partial()

// ── Types inférés ─────────────────────────────────────────────────────────────
export type ProductInput  = z.infer<typeof ProductSchema>
export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>