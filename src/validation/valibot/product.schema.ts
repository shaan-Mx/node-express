// src/validation/valibot/product.schema.ts

import * as v from 'valibot'
import { valibotSchema } from './adapter'

const VariantSchema = v.object({
  id:       v.pipe(v.string(), v.uuid('Variant id must be a UUID')),
  title:    v.pipe(v.string(), v.minLength(1, 'Variant title is required')),
  sku:      v.pipe(v.string(), v.minLength(1, 'Variant SKU is required')),
  quantity: v.pipe(v.number(), v.integer(), v.minValue(0, 'Quantity must be >= 0')),
})

const ProductSchema = v.object({
  id:          v.pipe(v.string(), v.minLength(1, 'Product id is required')),
  title:       v.pipe(v.string(), v.minLength(1, 'Title is required'), v.maxLength(200)),
  description: v.pipe(v.string(), v.minLength(1, 'Description is required')),
  category:    v.pipe(v.string(), v.minLength(1, 'Category is required')),
  price:       v.pipe(v.string(), v.regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid decimal string (e.g. "19.99")')),
  images:      v.pipe(v.array(v.string()), v.minLength(1, 'At least one image is required')),
  tags:        v.optional(v.array(v.string()), []),
  variants:    v.optional(v.array(VariantSchema), []),
})

// Schemas bruts — nécessaires pour inférer les types AVANT l'enveloppement
const RawCreateProductSchema = v.omit(ProductSchema, ['id'])
const RawUpdateProductSchema  = v.partial(v.omit(ProductSchema, ['id']))

// Schemas enveloppés — exportés pour le middleware validate()
export const CreateProductSchema = valibotSchema(RawCreateProductSchema)
export const UpdateProductSchema  = valibotSchema(RawUpdateProductSchema)

// ✅ Types utiles pour typer req.body dans les routes
// ❌ ProductSchema n'est jamais exporté ni utilisé directement
export type CreateProductInput = v.InferOutput<typeof RawCreateProductSchema>
export type UpdateProductInput = v.InferOutput<typeof RawUpdateProductSchema>