import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchPautasByTelejornal, linkPautaToTelejornal } from "@/services/pautas-telejornal-api";
import { fetchPautas, createPauta } from "@/services/api";
import { Pauta } from "@/types";
import { toast } from "sonner";
import { NewPautaDialog } from "@/components/NewPautaDialog";

interface PautasTelejornalModalProps {
  isOpen: boolean;
  onClose: () => void;
  telejornalId: string;
  telejornalNome: string;
}

export const PautasTelejornalModal = ({
  isOpen,
  onClose,
  telejornalId,
  telejornalNome
}: PautasTelejornalModalProps) => {
  const { user } = useAuth();
  const [pautas, setPautas] = useState<Pauta[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNewPautaDialogOpen, setIsNewPautaDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen && telejornalId) {
      loadPautas();
    }
  }, [isOpen, telejornalId]);

  const loadPautas = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPautasByTelejornal(telejornalId);
      setPautas(data);
    } catch (error) {
      console.error("Erro ao carregar pautas:", error);
      toast.error("Erro ao carregar pautas do telejornal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePauta = async (pautaData: any) => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      const newPauta = await createPauta(pautaData, user.id);
      await linkPautaToTelejornal(newPauta.id, telejornalId);
      toast.success("Pauta criada e vinculada ao telejornal!");
      loadPautas();
      setIsNewPautaDialogOpen(false);
    } catch (error) {
      console.error("Erro ao criar pauta:", error);
      toast.error("Erro ao criar pauta");
    }
  };

  const filteredPautas = pautas.filter(pauta =>
    pauta.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pauta.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pauta.local?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pautas - {telejornalNome}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pautas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setIsNewPautaDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Pauta
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPautas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Nenhuma pauta encontrada" : "Nenhuma pauta vinculada a este telejornal"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPautas.map((pauta) => (
                  <div
                    key={pauta.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{pauta.titulo}</h3>
                        {pauta.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">{pauta.descricao}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          {pauta.local && <span>📍 {pauta.local}</span>}
                          {pauta.data_cobertura && <span>📅 {pauta.data_cobertura}</span>}
                          {pauta.reporter && <span>👤 {pauta.reporter}</span>}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        pauta.status === 'concluida' ? 'bg-green-100 text-green-800' :
                        pauta.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pauta.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <NewPautaDialog
        isOpen={isNewPautaDialogOpen}
        onClose={() => setIsNewPautaDialogOpen(false)}
        onPautaCreated={() => {
          loadPautas();
          setIsNewPautaDialogOpen(false);
        }}
      />
    </>
  );
};
