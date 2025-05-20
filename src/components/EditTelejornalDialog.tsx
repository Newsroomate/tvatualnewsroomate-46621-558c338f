
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateTelejornal } from "@/services/api";
import { Telejornal } from "@/types";

interface EditTelejornalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  telejornal: Telejornal;
  onTelejornalUpdated: () => void;
}

export const EditTelejornalDialog = ({
  isOpen,
  onClose,
  telejornal,
  onTelejornalUpdated,
}: EditTelejornalDialogProps) => {
  const [nome, setNome] = useState(telejornal.nome);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updateTelejornal(telejornal.id, { nome });
      onTelejornalUpdated();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar telejornal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renomear Telejornal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="nome" className="text-right text-sm font-medium">
                Nome
              </label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
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
              disabled={!nome.trim() || isSubmitting}
            >
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
