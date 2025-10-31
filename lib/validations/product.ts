import { z } from "zod"

export const productSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  category: z.string().uuid("Selecciona una categoría válida"),
  stock: z
    .number({ invalid_type_error: "Stock inválido" })
    .int("El stock debe ser un entero")
    .min(0, "El stock no puede ser negativo"),
  price: z
    .number({ invalid_type_error: "Precio inválido" })
    .min(0, "El precio no puede ser negativo"),
  description: z.string().optional().nullable(),
  images: z
    .array(z.string().url("URL de imagen inválida"))
    .max(5, "Máximo 5 imágenes")
    .optional(),
})

export type ProductFormInput = z.infer<typeof productSchema>



