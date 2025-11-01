"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, ImageIcon, Loader2, Link as LinkIcon } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import type { Category } from "@/types"
import { getCategoryLabel } from "@/lib/utils/category"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type BulkImageImportProps = {
  categories: Category[]
  onImport: (images: string[], categoryId: string) => Promise<void>
}

export function BulkImageImport({ categories, onImport }: BulkImageImportProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [isImporting, setIsImporting] = useState(false)
  const [urlsText, setUrlsText] = useState<string>("")
  const [isLoadingUrls, setIsLoadingUrls] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Función auxiliar para verificar si es una imagen válida
    const isValidImage = (file: File): boolean => {
      // Verificar por tipo MIME (cubre PNG, WEBP, JPEG, etc.)
      if (file.type.startsWith('image/')) {
        return true
      }
      
      // Verificar por extensión (para HEIC y otros formatos que pueden no tener tipo MIME correcto)
      const fileName = file.name.toLowerCase()
      const validExtensions = ['.heic', '.png', '.webp', '.jpg', '.jpeg', '.gif', '.bmp']
      return validExtensions.some(ext => fileName.endsWith(ext))
    }
    
    // Filtrar solo imágenes
    const imageFiles = files.filter(isValidImage)
    
    if (imageFiles.length !== files.length) {
      toast.error("Algunos archivos no son imágenes válidas y fueron ignorados")
    }
    
    if (imageFiles.length === 0) {
      return
    }
    
    // Convertir a previews (data URLs) usando Promise.all para manejar correctamente
    const readPromises = imageFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result)
          } else {
            reject(new Error('Failed to read file'))
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    })
    
    Promise.all(readPromises)
      .then(newPreviews => {
        setSelectedFiles([...selectedFiles, ...imageFiles])
        setImagePreviews([...imagePreviews, ...newPreviews])
      })
      .catch(error => {
        console.error('Error reading files:', error)
        toast.error("Error al leer algunos archivos")
      })
  }

  const removeImage = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const isValidUrl = (string: string): boolean => {
    try {
      const url = new URL(string)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch (_) {
      return false
    }
  }

  const handleAddUrls = async () => {
    if (!urlsText.trim()) {
      toast.error("Por favor ingresa al menos una URL")
      return
    }

    setIsLoadingUrls(true)
    
    // Dividir URLs por líneas y espacios, filtrar vacías
    const urls = urlsText
      .split(/\n|\s/)
      .map(url => url.trim())
      .filter(url => url.length > 0)

    if (urls.length === 0) {
      toast.error("No se encontraron URLs válidas")
      setIsLoadingUrls(false)
      return
    }

    // Validar URLs
    const validUrls = urls.filter(url => {
      const isValid = isValidUrl(url)
      if (!isValid) {
        toast.error(`URL inválida ignorada: ${url}`)
      }
      return isValid
    })

    if (validUrls.length === 0) {
      toast.error("No se encontraron URLs válidas")
      setIsLoadingUrls(false)
      return
    }

    // Cargar imágenes para verificar que sean válidas
    const imagePromises = validUrls.map(url => {
      return new Promise<string>((resolve, reject) => {
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        
        const timeout = setTimeout(() => {
          reject(new Error(`Timeout al cargar: ${url}`))
        }, 10000) // 10 segundos de timeout
        
        img.onload = () => {
          clearTimeout(timeout)
          resolve(url)
        }
        img.onerror = () => {
          clearTimeout(timeout)
          reject(new Error(`No se pudo cargar la imagen: ${url}`))
        }
        img.src = url
      })
    })

    try {
      // Usar allSettled para obtener todas las URLs que cargaron exitosamente
      const results = await Promise.allSettled(imagePromises)
      const loadedUrls = results
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map(result => result.value)
      
      const failedUrls = results.filter(result => result.status === 'rejected')

      if (loadedUrls.length === 0) {
        toast.error("No se pudieron cargar ninguna de las imágenes. Verifica que las URLs sean accesibles y públicas")
      } else {
        setImagePreviews([...imagePreviews, ...loadedUrls])
        setUrlsText("")
        
        if (failedUrls.length > 0) {
          toast.warning(`Se agregaron ${loadedUrls.length} de ${validUrls.length} imágenes. ${failedUrls.length} fallaron.`)
        } else {
          toast.success(`${loadedUrls.length} imagen(es) agregada(s) exitosamente`)
        }
      }
    } catch (error: any) {
      console.error('Error loading images:', error)
      toast.error("Error al cargar las imágenes. Verifica que las URLs sean accesibles")
    } finally {
      setIsLoadingUrls(false)
    }
  }

  const handleImport = async () => {
    if (!selectedCategory) {
      toast.error("Por favor selecciona una categoría")
      return
    }

    if (imagePreviews.length === 0) {
      toast.error("Por favor selecciona al menos una imagen")
      return
    }

    setIsImporting(true)
    try {
      await onImport(imagePreviews, selectedCategory)
      toast.success(`Se crearon ${imagePreviews.length} producto(s) exitosamente`)
      // Limpiar después de importar
      setSelectedFiles([])
      setImagePreviews([])
      setSelectedCategory("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      // Ignorar el error de redirect de Next
      const digest = error?.digest
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
        return
      }
      toast.error("Error al importar las imágenes")
      console.error("Error importing images:", error)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar Productos desde Imágenes</CardTitle>
        <CardDescription>
          Selecciona múltiples imágenes para crear productos automáticamente. Cada imagen creará un producto sin datos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="category-import">Categoría por defecto *</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
            <SelectTrigger id="category-import">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.length === 0 ? (
                <SelectItem value="no-categories" disabled>
                  No hay categorías disponibles
                </SelectItem>
              ) : (
                categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {getCategoryLabel(cat.name)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label>Imágenes ({imagePreviews.length} seleccionadas)</Label>
          <Tabs defaultValue="files" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="files">
                <Upload className="mr-2 h-4 w-4" />
                Subir Archivos
              </TabsTrigger>
              <TabsTrigger value="urls">
                <LinkIcon className="mr-2 h-4 w-4" />
                Desde URLs
              </TabsTrigger>
            </TabsList>
            <TabsContent value="files" className="space-y-2 mt-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.HEIC,.png,.PNG,.webp,.WEBP"
                multiple
                onChange={handleFileSelect}
                className="cursor-pointer"
                disabled={isImporting}
              />
              <p className="text-xs text-muted-foreground">
                Formatos soportados: HEIC, PNG, WEBP, JPEG, GIF, BMP. Puedes seleccionar múltiples imágenes a la vez.
              </p>
            </TabsContent>
            <TabsContent value="urls" className="space-y-2 mt-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Pega las URLs de las imágenes, una por línea o separadas por espacios&#10;&#10;Ejemplo:&#10;https://ejemplo.com/imagen1.jpg&#10;https://ejemplo.com/imagen2.png"
                  value={urlsText}
                  onChange={(e) => setUrlsText(e.target.value)}
                  rows={6}
                  disabled={isImporting || isLoadingUrls}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  onClick={handleAddUrls}
                  disabled={isImporting || isLoadingUrls || !urlsText.trim()}
                  className="w-full"
                >
                  {isLoadingUrls ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando imágenes...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Agregar URLs
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Pega las URLs de las imágenes desde otros sitios. Las URLs deben ser públicas y accesibles. Puedes pegar múltiples URLs separadas por líneas o espacios.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {imagePreviews.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                >
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeImage(index)}
                      className="h-8 w-8"
                      disabled={isImporting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {imagePreviews.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">No hay imágenes seleccionadas</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <Upload className="mr-2 h-4 w-4" />
              Seleccionar Imágenes
            </Button>
          </div>
        )}

        {imagePreviews.length > 0 && (
          <div className="flex gap-4">
            <Button
              type="button"
              onClick={handleImport}
              disabled={isImporting || !selectedCategory}
              className="flex-1"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar {imagePreviews.length} Producto(s)
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedFiles([])
                setImagePreviews([])
                setUrlsText("")
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""
                }
              }}
              disabled={isImporting}
            >
              Limpiar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

