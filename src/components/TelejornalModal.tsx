
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTelejornal } from "@/services/api";

interface TelejornalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTelejornalCreated: () => void;
}

export const TelejornalModal = ({
  isOpen,
  onClose,
  onTelejornalCreated,
}: TelejornalModalProps) => {
  const [nome, setNome] = useState("");
  const [horario, setHorario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createTelejornal({ 
        nome, 
        horario, 
        espelho_aberto: false // Added the missing espelho_aberto property
      });
      setNome("");
      setHorario("");
      onTelejornalCreated();
      onClose();
    } catch (error) {
      console.error("Erro ao criar telejornal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Telejornal</DialogTitle>
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
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="horario" className="text-right text-sm font-medium">
                Horário
              </label>
              <Input
                id="horario"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="col-span-3"
                placeholder="Ex: 19:00"
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
              Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
