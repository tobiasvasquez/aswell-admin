"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getCategories() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .order("category")
  
  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }
  
  // Extract unique categories from products
  const categories = [...new Set(data.map(item => item.category))]
  return categories
}

export async function createCategory(categoryName: string) {
  // This function doesn't create a separate category record,
  // but ensures the category can be used by creating a temporary product
  // and then deleting it, which allows the category to appear in listings
  const supabase = await createClient()
  
  // First check if category already exists
  const { data, error: fetchError } = await supabase
    .from("products")
    .select("category")
    .ilike("category", categoryName.trim())
    .limit(1)
  
  if (fetchError) {
    console.error("Error checking category:", fetchError)
    throw new Error("Error al verificar la categoría")
  }
  
  if (data && data.length > 0) {
    throw new Error("La categoría ya existe")
  }
  
  // Create a temporary product to establish the category
  const { error: insertError } = await supabase
    .from("products")
    .insert({
      name: `temp-${Date.now()}`,
      category: categoryName.trim(),
      stock: 0,
      price: 0
    })
  
  if (insertError) {
    console.error("Error creating category:", insertError)
    throw new Error("Error al crear la categoría")
  }
  
  // Immediately delete the temporary product
  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .match({ name: `temp-${Date.now()}` })
  
  if (deleteError) {
    console.error("Error cleaning up temporary product:", deleteError)
    // Don't throw error as category was still created
  }
  
  revalidatePath("/categories")
  revalidatePath("/products/new")
  revalidatePath("/products")
  
  return { success: true }
}
