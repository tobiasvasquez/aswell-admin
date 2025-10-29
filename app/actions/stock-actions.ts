"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateStockAction(productId: string, newStock: number) {
  const supabase = await createClient()

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("stock, price, name")
    .eq("id", productId)
    .single()

  if (fetchError || !product) {
    throw new Error("Product not found")
  }

  const oldStock = product.stock
  const stockChange = newStock - oldStock

  // Update stock
  const { error: updateError } = await supabase.from("products").update({ stock: newStock }).eq("id", productId)

  if (updateError) {
    throw new Error("Failed to update stock")
  }

  // If stock decreased, record as a sale
  if (stockChange < 0) {
    const unitsSold = Math.abs(stockChange)
    const totalAmount = unitsSold * product.price

    const { error: saleError } = await supabase.from("sales_transactions").insert({
      product_id: productId,
      product_name: product.name,
      quantity_sold: unitsSold,
      unit_price: product.price,
      total_amount: totalAmount,
    })

    if (saleError) {
      console.error("Failed to record sale:", saleError)
    }
  }

  revalidatePath("/")
  revalidatePath(`/products/${productId}`)
}
