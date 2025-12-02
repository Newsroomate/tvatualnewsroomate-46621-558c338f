import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchEntrevistasByTelejornal, createEntrevista, updateEntrevista, deleteEntrevista } from "@/services/entrevistas-api";
import { Entrevista } from "@/types/entrevistas";
import { toast } from "sonner";
import { EntrevistaFormDialog } from "./EntrevistaFormDialog";

interface EntrevistasModalProps {
  isOpen: boolean;
  onClose: () => void;
  telejornalId: string;
  telejornalNome: string;
}

export const EntrevistasModal = ({
  isOpen,
  onClose,
  telejornalId,
  telejornalNome
}: EntrevistasModalProps) => {
  const { user } = useAuth();
  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingEntrevista, setEditingEntrevista] = useState<Entrevista | null>(null);

  useEffect(() => {
    if (isOpen && telejornalId) {
      loadEntrevistas();
    }
  }, [isOpen, telejornalId]);

  const loadEntrevistas = async () => {
    setIsLoading(true);
    try {
      const data = await fetchEntrevistasByTelejornal(telejornalId);
      console.log('[EntrevistasModal] Entrevistas carregadas:', data);
      setEntrevistas(data);
    } catch (error) {
      console.error("Erro ao carregar entrevistas:", error);
      toast.error("Erro ao carregar entrevistas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta entrevista?")) return;

    try {
      await deleteEntrevista(id);
      toast.success("Entrevista excluída com sucesso!");
      loadEntrevistas();
    } catch (error) {
      console.error("Erro ao excluir entrevista:", error);
      toast.error("Erro ao excluir entrevista");
    }
  };

  const handleEdit = (entrevista: Entrevista) => {
    setEditingEntrevista(entrevista);
    setIsFormDialogOpen(true);
  };

  const filteredEntrevistas = entrevistas.filter(ent =>
    ent.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ent.entrevistado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ent.tema?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Entrevistas - {telejornalNome}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar entrevistas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => {
                setEditingEntrevista(null);
                setIsFormDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Entrevista
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredEntrevistas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Nenhuma entrevista encontrada" : "Nenhuma entrevista neste telejornal"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEntrevistas.map((entrevista) => (
                  <div
                    key={entrevista.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{entrevista.titulo}</h3>
                        <p className="text-sm text-primary mt-1">Entrevistado: {entrevista.entrevistado}</p>
                        {entrevista.tema && (
                          <p className="text-sm text-muted-foreground mt-1">Tema: {entrevista.tema}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          {entrevista.reporter && <span>👤 {entrevista.reporter}</span>}
                          {entrevista.local && <span>📍 {entrevista.local}</span>}
                          {entrevista.data_entrevista && <span>📅 {entrevista.data_entrevista}</span>}
                          {entrevista.duracao && <span>⏱️ {entrevista.duracao}min</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          entrevista.status === 'realizada' ? 'bg-green-100 text-green-800' :
                          entrevista.status === 'agendada' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {entrevista.status}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(entrevista)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(entrevista.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <EntrevistaFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => {
          setIsFormDialogOpen(false);
          setEditingEntrevista(null);
        }}
        telejornalId={telejornalId}
        entrevista={editingEntrevista}
        onSuccess={loadEntrevistas}
      />
    </>
  );
};
