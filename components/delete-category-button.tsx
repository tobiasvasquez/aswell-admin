"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Loader2 } from "lucide-react"

type DeleteCategoryButtonProps = {
  categoryId: string
  categoryName: string
  productCount: number
  deleteAction: () => Promise<void>
}

export function DeleteCategoryButton({ categoryId, categoryName, productCount, deleteAction }: DeleteCategoryButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  async function handleDelete() {
    setIsDeleting(true)
    setErrorMessage("")
    
    try {
      await deleteAction()
    } catch (error: any) {
      // Next.js redirect() throws a special error that should be rethrown
      if (error && typeof error === 'object' && 'digest' in error) {
        const digest = (error as any).digest
        if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
          // This is a redirect, let it propagate
          throw error
        }
      }
      
      // Mostrar mensaje de error personalizado
      const errorMsg = error?.message || "Hubo un error al eliminar la categoría. Por favor intenta de nuevo."
      setErrorMessage(errorMsg)
      setIsDeleting(false)
    }
  }

  const canDelete = productCount === 0

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={!canDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente la categoría{" "}
            <span className="font-semibold">{categoryName}</span>.
            {!canDelete && (
              <span className="block mt-2 text-sm text-orange-600 dark:text-orange-400">
                Esta categoría tiene {productCount} producto(s). Debes eliminar o mover los productos primero.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
            {errorMessage}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={() => setErrorMessage("")}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || !canDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

