"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus, ImageIcon } from "lucide-react"
import Image from "next/image"

type ImageUploadProps = {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [newImageUrl, setNewImageUrl] = useState("")

  const addImage = () => {
    if (newImageUrl && images.length < maxImages) {
      onChange([...images, newImageUrl])
      setNewImageUrl("")
    }
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addImage()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          Imágenes del producto ({images.length}/{maxImages})
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="URL de la imagen"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={images.length >= maxImages}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addImage}
            disabled={!newImageUrl || images.length >= maxImages}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Puedes agregar hasta {maxImages} imágenes. La primera será la imagen principal.
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((image, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
              <Image src={image || "/placeholder.svg"} alt={`Imagen ${index + 1}`} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeImage(index)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {index === 0 && (
                <div className="absolute top-2 left-2">
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">Principal</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No hay imágenes agregadas</p>
        </div>
      )}
    </div>
  )
}
