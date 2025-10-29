"use client"

import { getCategories } from "@/app/actions/category-actions"
import { createCategory } from "@/app/actions/create-category-action"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, ArrowLeft } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ModeToggle } from "@/components/theme-provider"
import { useState, useEffect } from "react"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Array<{name: string, count: number, color: string}>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState('#6366f1')

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


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestión de Categorías</h1>
                <p className="text-sm text-muted-foreground">Administra las categorías de productos</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/products/new">
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              </Link>
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Crear Nueva Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Categoría</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ej: Anillos, Pulseras, etc."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color de la Categoría</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      defaultValue="#6366f1"
                      className="h-10 w-16 cursor-pointer"
                      onChange={(e) => setSelectedColor(e.target.value)}
                    />
                    <Input
                      name="color"
                      type="text"
                      value={selectedColor}
                      readOnly
                      className="flex-1"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Categoría
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categorías Existentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay categorías creadas aún.</p>
                ) : (
                  <ul className="space-y-2">
                    {categories.map((category) => (
                      <li
                        key={category.name}
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                      >
                        <span className="capitalize">{category.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {category.count} productos
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
