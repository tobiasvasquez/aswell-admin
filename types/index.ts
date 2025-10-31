// Tipos centralizados para la aplicación

export type Product = {
  id: string
  name: string
  category: string // UUID de la categoría
  stock: number
  price: number
  description: string | null
  images?: string[]
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  name: string
  color: string
  created_at?: string
  updated_at?: string
}

export type CategoryWithCount = Category & {
  count: number
}

export type Sale = {
  id?: string
  product_id: string
  product_name: string
  quantity_sold: number
  unit_price: number
  total_amount: number
  created_at: string
}


