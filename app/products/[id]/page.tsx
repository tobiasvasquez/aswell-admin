import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/product-detail"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product, error } = await supabase.from("products").select("*").eq("id", id).single()

  if (error || !product) {
    notFound()
  }

  // Obtener el total de ventas de este producto
  const { data: sales } = await supabase
    .from("sales_transactions")
    .select("total_amount, quantity_sold, created_at")
    .eq("product_id", id)
    .order("created_at", { ascending: false })

  const totalRevenue = sales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
  const totalSold = sales?.reduce((sum, sale) => sum + sale.quantity_sold, 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inventario
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ProductDetail product={product} sales={sales || []} totalRevenue={totalRevenue} totalSold={totalSold} />
      </main>
    </div>
  )
}
