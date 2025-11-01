import { getCategories, createCategoryAction, deleteCategoryAction } from "@/app/actions/category-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ModeToggle } from "@/components/theme-provider"
import { DeleteCategoryButton } from "@/components/delete-category-button"

type CategoryListItemProps = {
  category: {
    id: string
    name: string
    color: string
    count: number
  }
}

function CategoryListItem({ category }: CategoryListItemProps) {
  async function deleteThisCategory() {
    "use server"
    await deleteCategoryAction(category.id)
  }

  return (
    <li className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <div className="flex items-center gap-3">
        <div
          className="h-4 w-4 rounded-full border-2"
          style={{ backgroundColor: category.color }}
        />
        <span className="capitalize">{category.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {category.count} productos
        </span>
        <DeleteCategoryButton
          categoryId={category.id}
          categoryName={category.name}
          productCount={category.count}
          deleteAction={deleteThisCategory}
        />
      </div>
    </li>
  )
}

export default async function CategoriesPage() {
  const categories = await getCategories()
  
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
              <form
                action={async (formData: FormData) => {
                  "use server"
                  const name = (formData.get("name") as string) || ""
                  const color = (formData.get("color") as string) || "#6366f1"
                  await createCategoryAction(name, color)
                }}
                className="space-y-4"
              >
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
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    defaultValue="#6366f1"
                    className="h-10 w-16 cursor-pointer"
                  />
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
                      <CategoryListItem key={category.id} category={category} />
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
