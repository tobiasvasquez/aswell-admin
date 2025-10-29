"use server"

import { createCategoryAction } from "@/app/actions/category-actions"

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string
  const color = (formData.get("color") as string) || '#6366f1'
  
  try {
    await createCategoryAction(name, color)
  } catch (error) {
    console.error("Error creating category:", error)
  }
  
  // Redirect is handled by the server action, so we don't need to return anything
  // The redirect will happen after the action completes
}
