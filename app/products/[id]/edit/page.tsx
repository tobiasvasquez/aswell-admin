import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { revalidatePath } from "next/cache"
import { ProductForm } from "@/components/product-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DeleteProductButton } from "@/components/delete-product-button"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product, error } = await supabase.from("products").select("*").eq("id", id).single()

  if (error || !product) {
    notFound()
  }

  async function updateProduct(formData: FormData) {
    "use server"

    const supabase = await createClient()

    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const stock = Number.parseInt(formData.get("stock") as string)
    const price = Number.parseFloat(formData.get("price") as string)
    const description = formData.get("description") as string
    const imagesJson = formData.get("images") as string
    const images = imagesJson ? JSON.parse(imagesJson) : []

    // First get the current product to ensure we have the correct category_id
    const { data: currentProduct, error: fetchError } = await supabase
      .from("products")
      .select("category")
      .eq("id", id)
      .single()

    if (fetchError || !currentProduct) {
      console.error("[v0] Error fetching current product:", fetchError)
      throw new Error("Error al obtener el producto")
    }

    // First get the category ID from the categories table
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("name", category)
      .single()

    if (categoryError || !categoryData) {
      console.error("[v0] Error finding category:", categoryError)
      throw new Error("Error al encontrar la categoría")
    }

    const { error } = await supabase
      .from("products")
      .update({
        name,
        category: categoryData.id,
        stock,
        price,
        description: description || null,
        images: images.length > 0 ? images : [`/placeholder.svg?height=400&width=400&query=${name} ${category}`],
      })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error updating product:", error)
      throw new Error("Error al actualizar el producto")
    }

    revalidatePath("/")
    revalidatePath(`/products/${id}`)
    revalidatePath(`/products/${id}/edit`)
    
    redirect("/")
  }

  async function deleteProduct() {
    "use server"

    const supabase = await createClient()

    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting product:", error)
      throw new Error("Error al eliminar el producto")
    }

    redirect("/")
  }

  // Get the category name from the categories table using the category ID
  const { data: categoryData, error: categoryError } = await supabase
    .from("categories")
    .select("name")
    .eq("id", product.category)
    .single()

  const categoryName = categoryError ? product.category : categoryData?.name

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
                <h1 className="text-2xl font-bold text-foreground">Editar Producto</h1>
                <p className="text-sm text-muted-foreground">Actualiza el stock y los datos del producto</p>
              </div>
            </div>
            <DeleteProductButton productId={id} productName={product.name} deleteAction={deleteProduct} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <ProductForm
            action={updateProduct}
            defaultValues={{
              name: product.name,
              category: categoryName,
              stock: product.stock,
              price: product.price,
              description: product.description,
              images: product.images || [],
            }}
            submitLabel="Guardar Cambios"
          />
        </div>
      </main>
    </div>
  )
}
