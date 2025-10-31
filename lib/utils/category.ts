// Utilidades relacionadas con categorías

/**
 * Capitaliza la primera letra de una categoría
 */
export function getCategoryLabel(category: string | null | undefined): string {
  if (!category || typeof category !== 'string') {
    return ''
  }
  return category.charAt(0).toUpperCase() + category.slice(1)
}

/**
 * Calcula el color de texto basado en el brillo del color de fondo
 */
export function getTextColorForBackground(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? 'text-gray-900' : 'text-gray-50'
}

