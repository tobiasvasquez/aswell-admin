"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/image-upload"
import { Loader2 } from "lucide-react"
import { getCategories } from "@/app/actions/category-actions"

type ProductFormProps = {
  action: (formData: FormData) => Promise<void>
  defaultValues?: {
    name: string
    category: string
    stock: number
    price: number
    description: string | null
    images?: string[]
  }
  submitLabel?: string
}

export function ProductForm({ action, defaultValues, submitLabel = "Crear Producto" }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [category, setCategory] = useState(defaultValues?.category || "")
  const [images, setImages] = useState<string[]>(defaultValues?.images || [])
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

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    formData.append("images", JSON.stringify(images))
    await action(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información del Producto</CardTitle>
        <CardDescription>Ingresa los detalles del producto para tu inventario</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Producto *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ej: Collar de Perlas"
              required
              defaultValue={defaultValues?.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select name="category" value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    Cargando categorías...
                  </SelectItem>
                ) : categories.length === 0 ? (
                  <SelectItem value="no-categories" disabled>
                    No hay categorías disponibles
                  </SelectItem>
                ) : (
                  categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stock">Cantidad en Stock *</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                placeholder="0"
                required
                defaultValue={defaultValues?.stock}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
                defaultValue={defaultValues?.price}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe el producto..."
              rows={4}
              defaultValue={defaultValues?.description || ""}
            />
          </div>

          <ImageUpload images={images} onChange={setImages} />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
