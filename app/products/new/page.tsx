import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductForm } from "@/components/product-form"
import { BulkImageImport } from "@/components/bulk-image-import"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getCategories } from "@/app/actions/category-actions"
import { createProductsFromImages } from "@/app/actions/bulk-product-actions"

export default async function NewProductPage() {
  const categories = await getCategories()
  async function createProduct(formData: FormData) {
    "use server"

    const supabase = await createClient()

    const name = formData.get("name") as string
    const categoryId = formData.get("category") as string
    const stock = Number.parseInt(formData.get("stock") as string)
    const price = Number.parseFloat(formData.get("price") as string)
    const description = formData.get("description") as string
    const imagesJson = formData.get("images") as string
    const images = imagesJson ? JSON.parse(imagesJson) : []

    // Verify category exists
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select("name")
      .eq("id", categoryId)
      .single()

    if (categoryError || !categoryData) {
      console.error("[v0] Error finding category:", categoryError)
      throw new Error("Error al encontrar la categoría")
    }

    const { error } = await supabase.from("products").insert({
      name,
      category: categoryId,
      stock,
      price,
      description: description || null,
      images: images.length > 0 ? images : [`/placeholder.svg?height=400&width=400&query=${name}`],
    })

    if (error) {
      console.error("[v0] Error creating product:", error)
      throw new Error("Error al crear el producto")
    }

    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Agregar Nuevo Producto</h1>
              <p className="text-sm text-muted-foreground">Completa los datos del producto</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-8">
          <ProductForm action={createProduct} categories={categories} />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O</span>
            </div>
          </div>
          <BulkImageImport
            categories={categories}
            onImport={createProductsFromImages}
          />
        </div>
      </main>
    </div>
  )
}
