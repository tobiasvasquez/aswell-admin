import { createClient } from "@/lib/supabase/server"
import { ProductList } from "@/components/product-list"
import { Button } from "@/components/ui/button"
import { Package, Plus, TrendingUp } from "lucide-react"
import Link from "next/link"
import { ModeToggle } from "@/components/theme-provider"
import { getCategories } from "@/app/actions/category-actions"

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
  const categories = await getCategories()

  if (error) {
    console.error("[v0] Error fetching products:", error)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <Package className="h-6 w-6 text-primary-foreground" />
                </div>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestión de Inventario</h1>
                <p className="text-sm text-muted-foreground">Administra tu stock de productos</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/products/new">
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              </Link>
              <Link href="/sales">
                <Button size="lg" variant="secondary">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Ver Ventas
                </Button>
              </Link>
              <Link href="/categories">
                <Button size="lg" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Gestionar Categorías
                </Button>
              </Link>
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ProductList products={products || []} categories={categories} />
      </main>
    </div>
  )
}
