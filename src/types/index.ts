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
  price: string
  tags: string[]
}

// USER
export interface User {
  id: string
  name: string
  email: string
  created_at?: string
}
