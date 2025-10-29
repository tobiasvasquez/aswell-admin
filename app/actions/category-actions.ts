"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getCategories() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name")
  
  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }
  
  // For each category, get the product count
  const categoriesWithCount = await Promise.all(data.map(async (category) => {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact" })
      .eq("category", category.id)
    
    return {
      id: category.id,
      name: category.name,
      color: category.color,
      count: count || 0
    }
  }))
  
  return categoriesWithCount
}

export async function createCategoryAction(categoryName: string, color: string = '#6366f1') {
  const supabase = await createClient()
  
  // First check if category already exists
  const { data, error: fetchError } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", categoryName.trim())
    .limit(1)
  
  if (fetchError) {
    console.error("Error checking category:", fetchError)
    throw new Error("Error al verificar la categoría")
  }
  
  if (data && data.length > 0) {
    throw new Error("La categoría ya existe")
  }
  
  // Create the category with the specified color
  const { error: insertError } = await supabase
    .from("categories")
    .insert({
      name: categoryName.trim(),
      color: color
    })
  
  if (insertError) {
    console.error("Error creating category:", insertError)
    throw new Error("Error al crear la categoría")
  }
  
  revalidatePath("/categories")
  revalidatePath("/products/new")
  revalidatePath("/products")
  
  return { success: true }
}
