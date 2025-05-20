
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePauta } from "@/services/api";
import { Pauta } from "@/types";

interface EditPautaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pauta: Pauta;
  onPautaUpdated: () => void;
}

export const EditPautaDialog = ({
  isOpen,
  onClose,
  pauta,
  onPautaUpdated,
}: EditPautaDialogProps) => {
  const [titulo, setTitulo] = useState(pauta.titulo);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updatePauta(pauta.id, { titulo });
      onPautaUpdated();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar pauta:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renomear Pauta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="titulo" className="text-right text-sm font-medium">
                Título
              </label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!titulo.trim() || isSubmitting}
            >
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
