"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Search, Eye, Plus, Minus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { updateStockAction } from "@/app/actions/stock-actions"
import { useRouter } from "next/navigation"
import { getCategories } from "@/app/actions/category-actions"

type Product = {
  id: string
  name: string
  category: string
  stock: number
  price: number
  description: string | null
  images?: string[]
  created_at: string
  updated_at: string
}

type ProductListProps = {
  products: Product[]
}

// Dynamic category labels and colors
const getCategoryLabel = (category: string): string => {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

const getCategoryColor = (category: string): string => {
  // Simple hash function to generate consistent colors
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash)
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase()
  const color = "#" + "00000".substring(0, 6 - c.length) + c
  
  // Generate text color based on background brightness
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  const textColor = brightness > 128 ? "text-gray-900" : "text-gray-50"
  
  return `${color} ${textColor}`
}

export function ProductList({ products }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [updatingStock, setUpdatingStock] = useState<string | null>(null)
  const [optimisticProducts, setOptimisticProducts] = useState(products)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await getCategories()
        setCategories(cats)
      } catch (error) {
        console.error("Error loading categories:", error)
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    }
    loadCategories()
  }, [])

  const filteredProducts = optimisticProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Sin stock", color: "bg-destructive text-destructive-foreground" }
    if (stock < 5) return { label: "Stock bajo", color: "bg-orange-500 text-white" }
    return { label: "En stock", color: "bg-green-600 text-white" }
  }

  const handleStockChange = async (productId: string, currentStock: number, change: number) => {
    const newStock = currentStock + change
    if (newStock < 0) return

    setUpdatingStock(productId)

    setOptimisticProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)))

    try {
      await updateStockAction(productId, newStock)
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error("Error updating stock:", error)
      setOptimisticProducts(products)
    } finally {
      setUpdatingStock(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar Productos</CardTitle>
          <CardDescription>Busca y filtra tu inventario por nombre o categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    Cargando categorías...
                  </SelectItem>
                ) : (
                  categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de productos */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg text-muted-foreground">No se encontraron productos</p>
            <p className="text-sm text-muted-foreground">
              {products.length === 0
                ? "Comienza agregando tu primer producto"
                : "Intenta con otros términos de búsqueda"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock)
            const mainImage =
              product.images && product.images.length > 0
                ? product.images[0]
                : `/placeholder.svg?height=200&width=200&query=${product.name} ${product.category}`

            return (
              <Card key={product.id} className="flex flex-col overflow-hidden">
                <Link href={`/products/${product.id}`} className="block">
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <Image
                      src={mainImage || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform hover:scale-105"
                    />
                  </div>
                </Link>

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={`/products/${product.id}`}>
                        <CardTitle className="text-lg hover:text-primary transition-colors">{product.name}</CardTitle>
                      </Link>
                      <CardDescription className="mt-1">{product.description || "Sin descripción"}</CardDescription>
                    </div>
                    <Badge 
                      className={getCategoryColor(product.category)} 
                      variant="secondary"
                      style={{ backgroundColor: getCategoryColor(product.category).split(' ')[0] }}
                    >
                      {getCategoryLabel(product.category)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Precio:</span>
                      <span className="text-lg font-semibold">${product.price?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Stock:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 rounded-full bg-transparent"
                          onClick={() => handleStockChange(product.id, product.stock, -1)}
                          disabled={product.stock === 0 || updatingStock === product.id}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex min-w-[60px] items-center justify-center rounded-lg border bg-background px-3 py-2">
                          <span className="text-xl font-bold">{product.stock}</span>
                        </div>
                        <Button
                          variant="default"
                          size="icon"
                          className="h-9 w-9 rounded-full bg-amber-600 hover:bg-amber-700"
                          onClick={() => handleStockChange(product.id, product.stock, 1)}
                          disabled={updatingStock === product.id}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                    </div>
                  </div>
                </CardContent>
                <div className="border-t border-border p-4 flex gap-2">
                  <Link href={`/products/${product.id}`} className="flex-1">
                    <Button variant="default" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalle
                    </Button>
                  </Link>
                  <Link href={`/products/${product.id}/edit`}>
                    <Button variant="outline" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
