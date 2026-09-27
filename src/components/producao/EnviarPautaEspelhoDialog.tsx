import { useEffect, useState } from "react";
import { Pauta } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchTelejornais } from "@/services/telejornais-api";
import { fetchBlocosByTelejornal } from "@/services/blocos-api";
import { fetchMateriasByBloco } from "@/services/materias-fetch";
import { createMateria } from "@/services/materias-create";
import { Telejornal, Bloco } from "@/types";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface Props {
  pauta: Pauta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EnviarPautaEspelhoDialog = ({ pauta, open, onOpenChange }: Props) => {
  const [telejornais, setTelejornais] = useState<Telejornal[]>([]);
  const [blocos, setBlocos] = useState<Bloco[]>([]);
  const [telejornalId, setTelejornalId] = useState<string>("");
  const [blocoId, setBlocoId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchTelejornais()
      .then((list) => {
        setTelejornais(list);
        if (list.length === 1) setTelejornalId(list[0].id);
      })
      .catch(() => toast.error("Erro ao carregar telejornais"))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    setBlocoId("");
    setBlocos([]);
    if (!telejornalId) return;
    fetchBlocosByTelejornal(telejornalId)
      .then((list) => {
        setBlocos(list);
        if (list.length > 0) setBlocoId(list[0].id);
      })
      .catch(() => toast.error("Erro ao carregar blocos do espelho"));
  }, [telejornalId]);

  const handleSend = async () => {
    if (!pauta || !blocoId) return;
    setSending(true);
    try {
      const existentes = await fetchMateriasByBloco(blocoId);
      const ordem = (existentes?.length || 0) + 1;

      await createMateria({
        bloco_id: blocoId,
        ordem,
        retranca: pauta.titulo,
        duracao: 0,
        reporter: pauta.reporter || undefined,
        produtor: pauta.produtor || undefined,
        local_gravacao: pauta.local || undefined,
        status: "pendente",
        texto: pauta.descricao || undefined,
      } as any);

      toast.success("Pauta enviada ao espelho", {
        description: `Lauda "${pauta.titulo}" criada no bloco selecionado.`,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao enviar para o espelho", { description: err?.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar pauta ao espelho</DialogTitle>
          <DialogDescription>
            Será criada uma lauda com a retranca "{pauta?.titulo}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Telejornal</Label>
            <Select value={telejornalId} onValueChange={setTelejornalId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o telejornal" />
              </SelectTrigger>
              <SelectContent>
                {telejornais.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Bloco</Label>
            <Select value={blocoId} onValueChange={setBlocoId} disabled={!telejornalId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    telejornalId && blocos.length === 0
                      ? "Nenhum bloco neste espelho"
                      : "Selecione o bloco"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {blocos.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={!blocoId || sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
