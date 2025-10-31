import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ChartBar, Activity, TrendingUp, Package } from "lucide-react"

export default async function SalesDashboardPage() {
  const supabase = await createClient()

  // Cargar todas las transacciones necesarias para totales (suma en memoria)
  const { data: totalsRows, error: totalsError } = await supabase
    .from("sales_transactions")
    .select("total_amount, quantity_sold")
    .limit(100000)

  // Cargar transacciones recientes y agregar en memoria para top productos
  const { data: recentForAgg, error: topError } = await supabase
    .from("sales_transactions")
    .select("product_id, product_name, total_amount, quantity_sold, created_at")
    .order("created_at", { ascending: false })
    .limit(1000)

  // Últimas transacciones
  const { data: recent, error: recentError } = await supabase
    .from("sales_transactions")
    .select("product_name, quantity_sold, unit_price, total_amount, created_at")
    .order("created_at", { ascending: false })
    .limit(10)

  if (totalsError) {
    console.error("[sales] totals error", totalsError)
  }
  if (topError) {
    console.error("[sales] top products error", topError)
  }
  if (recentError) {
    console.error("[sales] recent error", recentError)
  }

  const totalRevenue = (totalsRows || []).reduce((acc: number, r: any) => acc + Number(r.total_amount || 0), 0)
  const totalUnits = (totalsRows || []).reduce((acc: number, r: any) => acc + Number(r.quantity_sold || 0), 0)

  // Agregación en memoria para top productos
  type TopRec = { product_id: string; product_name: string; revenue: number; units: number }
  const topMap = new Map<string, TopRec>()
  for (const r of recentForAgg || []) {
    const key = r.product_id as string
    const current = topMap.get(key) || { product_id: key, product_name: r.product_name as string, revenue: 0, units: 0 }
    current.revenue += Number(r.total_amount || 0)
    current.units += Number(r.quantity_sold || 0)
    topMap.set(key, current)
  }
  const topProducts = Array.from(topMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

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
                <h1 className="text-2xl font-bold text-foreground">Panel de Ventas</h1>
                <p className="text-sm text-muted-foreground">Resumen de ingresos y transacciones</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Inventario
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ingresos Totales</CardTitle>
              <CardDescription>Acumulado de ventas</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              ${""}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Unidades Vendidas</CardTitle>
              <CardDescription>Total de unidades</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {totalUnits.toLocaleString()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transacciones</CardTitle>
              <CardDescription>Últimos registros</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3 text-muted-foreground">
              <Activity className="h-5 w-5" />
              <span>{(recent?.length || 0).toString()} recientes</span>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top productos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top productos por ingresos</CardTitle>
                  <CardDescription>Los 5 que más recaudaron</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(topProducts || []).map((p, idx) => (
                  <div key={p.product_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-muted-foreground">#{idx + 1}</div>
                      <div>
                        <div className="font-medium">{p.product_name}</div>
                        <div className="text-sm text-muted-foreground">{Number(p.units || 0).toLocaleString()} uds</div>
                      </div>
                    </div>
                    <div className="font-semibold">
                      ${""}{Number(p.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
                {(!topProducts || topProducts.length === 0) && (
                  <div className="text-sm text-muted-foreground">Sin datos de ventas aún</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Últimas transacciones */}
          <Card>
            <CardHeader>
              <CardTitle>Últimas transacciones</CardTitle>
              <CardDescription>Movimientos más recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(recent || []).map((t, i) => (
                  <div key={`${t.created_at}-${i}`} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t.product_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(t.created_at).toLocaleString()} · {Number(t.quantity_sold).toLocaleString()} uds × ${""}{Number(t.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="font-semibold">
                      ${""}{Number(t.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
                {(!recent || recent.length === 0) && (
                  <div className="text-sm text-muted-foreground">Sin transacciones</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}


