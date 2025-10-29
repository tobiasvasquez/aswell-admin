"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Pencil, DollarSign, TrendingUp, Package } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { getCategories } from "@/app/actions/category-actions"

type Product = {
  id: string
  name: string
  category: string
  stock: number
  price: number
  description: string | null
  images: string[]
  created_at: string
  updated_at: string
}

type Sale = {
  total_amount: number
  quantity_sold: number
  created_at: string
}

type ProductDetailProps = {
  product: Product
  sales: Sale[]
  totalRevenue: number
  totalSold: number
}

// Dynamic category label function
const getCategoryLabel = (category: string): string => {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

// Dynamic category color function
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

export function ProductDetail({ product, sales, totalRevenue, totalSold }: ProductDetailProps) {
  const [currentStock, setCurrentStock] = useState(product.stock)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const [categoryLabel, setCategoryLabel] = useState("")
  const [categoryColor, setCategoryColor] = useState("")

  useEffect(() => {
    setCategoryLabel(getCategoryLabel(product.category))
    setCategoryColor(getCategoryColor(product.category))
  }, [product.category])

  const updateStock = async (newStock: number, quantityChange: number) => {
    if (newStock < 0) return

    setIsUpdating(true)
    try {
      // Actualizar el stock
      const { error: updateError } = await supabase.from("products").update({ stock: newStock }).eq("id", product.id)

      if (updateError) throw updateError

      // Si se redujo el stock (venta), registrar la transacción
      if (quantityChange < 0) {
        const quantitySold = Math.abs(quantityChange)
        const totalAmount = quantitySold * product.price

        const { error: saleError } = await supabase.from("sales_transactions").insert({
          product_id: product.id,
          product_name: product.name,
          quantity_sold: quantitySold,
          unit_price: product.price,
          total_amount: totalAmount,
        })

        if (saleError) throw saleError
      }

      setCurrentStock(newStock)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error updating stock:", error)
      alert("Error al actualizar el stock")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleIncrement = () => {
    updateStock(currentStock + 1, 1)
  }

  const handleDecrement = () => {
    if (currentStock > 0) {
      updateStock(currentStock - 1, -1)
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Sin stock", color: "bg-destructive text-destructive-foreground" }
    if (stock < 5) return { label: "Stock bajo", color: "bg-orange-500 text-white" }
    return { label: "En stock", color: "bg-green-600 text-white" }
  }

  const stockStatus = getStockStatus(currentStock)
  const images =
    product.images && product.images.length > 0
      ? product.images
      : ["/placeholder.svg?height=400&width=400&query=" + product.name]

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Galería de imágenes */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <Image
                  src={images[selectedImage] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </CardContent>
          </Card>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === index
                      ? "border-primary ring-2 ring-primary ring-offset-2"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} - imagen ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl">{product.name}</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {product.description || "Sin descripción"}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-sm" style={{ backgroundColor: categoryColor.split(' ')[0] }}>
                  {categoryLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">${product.price.toFixed(2)}</span>
                <span className="text-muted-foreground">por unidad</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Stock actual</p>
                      <p className="text-2xl font-bold">{currentStock}</p>
                    </div>
                  </div>
                  <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Modificar stock</p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleDecrement}
                      disabled={isUpdating || currentStock === 0}
                      className="h-12 w-12 p-0 bg-transparent"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 text-center">
                      <p className="text-sm text-muted-foreground">Unidades</p>
                      <p className="text-3xl font-bold">{currentStock}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleIncrement}
                      disabled={isUpdating}
                      className="h-12 w-12 p-0 bg-transparent"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Al reducir el stock se registrará como venta
                  </p>
                </div>
              </div>

              <Link href={`/products/${product.id}/edit`} className="block">
                <Button variant="outline" className="w-full bg-transparent" size="lg">
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar producto completo
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estadísticas de ventas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">De todas las ventas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unidades Vendidas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSold}</div>
            <p className="text-xs text-muted-foreground">Total de ventas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
            <p className="text-xs text-muted-foreground">Número de ventas</p>
          </CardContent>
        </Card>
      </div>

      {/* Historial de ventas */}
      {sales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Ventas</CardTitle>
            <CardDescription>Últimas transacciones registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sales.slice(0, 10).map((sale, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">
                      {sale.quantity_sold} unidad{sale.quantity_sold > 1 ? "es" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">${Number(sale.total_amount).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
