// src/types/product.ts

export interface Variant {
  id: string
  title: string
  sku: string
  quantity: number              // Must be >= 0 and have 0 decimal places
}

export interface Product {
  id: string
  title: string
  description: string
  images: string[]
  category: string
  variants: Variant[]
  price: number                 // Must be >= 0 and have at most 2 decimal places
  tags: string[]
}