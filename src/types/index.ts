// PRODUCT
interface Variant {
  id: string
  title: string
  sku: string
  quantity: number
}
export interface Product {
  id: string
  title: string
  description: string
  images: string[]
  category: string
  variants: Variant[]
  price: number
  tags: string[]
}

// USER
export interface User {
  id: number
  name: string
  email: string
  created_at?: string
}
