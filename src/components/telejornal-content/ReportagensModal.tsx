import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchReportagensByTelejornal, createReportagem, updateReportagem, deleteReportagem } from "@/services/reportagens-api";
import { Reportagem } from "@/types/reportagens";
import { toast } from "sonner";
import { ReportagemFormDialog } from "./ReportagemFormDialog";
import { useRealtimeReportagensTelejornal } from "@/hooks/useRealtimeReportagensTelejornal";

interface ReportagensModalProps {
  isOpen: boolean;
  onClose: () => void;
  telejornalId: string;
  telejornalNome: string;
}

export const ReportagensModal = ({
  isOpen,
  onClose,
  telejornalId,
  telejornalNome
}: ReportagensModalProps) => {
  const { user } = useAuth();
  const [reportagens, setReportagens] = useState<Reportagem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingReportagem, setEditingReportagem] = useState<Reportagem | null>(null);

  const loadReportagensCallback = useCallback(() => {
    loadReportagens();
  }, [telejornalId]);

  // Setup realtime subscription
  useRealtimeReportagensTelejornal({
    telejornalId: telejornalId || '',
    onReportagemChange: loadReportagensCallback
  });

  useEffect(() => {
    if (isOpen && telejornalId) {
      loadReportagens();
    }
  }, [isOpen, telejornalId]);

  const loadReportagens = async () => {
    setIsLoading(true);
    try {
      const data = await fetchReportagensByTelejornal(telejornalId);
      console.log('[ReportagensModal] Reportagens carregadas:', data);
      setReportagens(data);
    } catch (error) {
      console.error("Erro ao carregar reportagens:", error);
      toast.error("Erro ao carregar reportagens");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta reportagem?")) return;

    try {
      await deleteReportagem(id);
      toast.success("Reportagem excluída com sucesso!");
      loadReportagens();
    } catch (error) {
      console.error("Erro ao excluir reportagem:", error);
      toast.error("Erro ao excluir reportagem");
    }
  };

  const handleEdit = (reportagem: Reportagem) => {
    setEditingReportagem(reportagem);
    setIsFormDialogOpen(true);
  };

  const filteredReportagens = reportagens.filter(rep =>
    rep.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.reporter?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reportagens - {telejornalNome}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar reportagens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => {
                setEditingReportagem(null);
                setIsFormDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Reportagem
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredReportagens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Nenhuma reportagem encontrada" : "Nenhuma reportagem neste telejornal"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredReportagens.map((reportagem) => (
                  <div
                    key={reportagem.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{reportagem.titulo}</h3>
                        {reportagem.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">{reportagem.descricao}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          {reportagem.reporter && <span>👤 {reportagem.reporter}</span>}
                          {reportagem.local_gravacao && <span>📍 {reportagem.local_gravacao}</span>}
                          {reportagem.data_gravacao && <span>📅 {reportagem.data_gravacao}</span>}
                          {reportagem.duracao && <span>⏱️ {reportagem.duracao}s</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          reportagem.status === 'finalizada' ? 'bg-green-100 text-green-800' :
                          reportagem.status === 'em_producao' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reportagem.status}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(reportagem)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(reportagem.id)}>
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

      <ReportagemFormDialog
        isOpen={isFormDialogOpen}
        onClose={() => {
          setIsFormDialogOpen(false);
          setEditingReportagem(null);
        }}
        telejornalId={telejornalId}
        reportagem={editingReportagem}
        onSuccess={loadReportagens}
      />
    </>
  );
};
