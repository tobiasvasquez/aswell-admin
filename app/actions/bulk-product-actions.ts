"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createProductsFromImages(images: string[], categoryId: string) {
  const supabase = await createClient()

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

  // Create products from images
  const timestamp = Date.now()
  const productsToInsert = images.map((image, index) => ({
    name: `Producto sin nombre ${timestamp}-${index + 1}`,
    category: categoryId,
    stock: 0,
    price: 0,
    description: null,
    images: [image], // Usar la imagen importada
  }))

  const { error } = await supabase.from("products").insert(productsToInsert)

  if (error) {
    console.error("[v0] Error creating products from images:", error)
    throw new Error("Error al crear los productos")
  }

  revalidatePath("/")
  redirect("/")
}

