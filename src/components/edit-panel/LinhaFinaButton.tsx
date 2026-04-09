
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Loader2, RefreshCw, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LinhaFinaSugestao {
  linha1: string;
  linha2: string;
}

interface LinhaFinaButtonProps {
  texto: string;
  onApply: (gcText: string) => void;
  disabled?: boolean;
}

export const LinhaFinaButton = ({ texto, onApply, disabled }: LinhaFinaButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sugestoes, setSugestoes] = useState<LinhaFinaSugestao[]>([]);
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);

  const gerarSugestoes = async () => {
    if (!texto || texto.trim().length < 10) {
      toast.error("É necessário ter texto no corpo da matéria (mínimo 10 caracteres) para gerar sugestões.");
      return;
    }

    setIsLoading(true);
    setAppliedIndex(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-linha-fina", {
        body: { texto },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSugestoes(data.sugestoes || []);
    } catch (err: any) {
      console.error("Erro ao gerar linha fina:", err);
      toast.error(err.message || "Erro ao gerar sugestões de linha fina");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && sugestoes.length === 0) {
      gerarSugestoes();
    }
  };

  const handleApply = (sugestao: LinhaFinaSugestao, index: number) => {
    const gcText = `${sugestao.linha1}\n${sugestao.linha2}`;
    onApply(gcText);
    setAppliedIndex(index);
    toast.success("Linha fina aplicada ao GC!");
  };

  const getCharColor = (count: number, min: number, max: number) => {
    if (count >= min && count <= max) return "text-green-600";
    return "text-red-500";
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-7 gap-1 text-xs"
        >
          <Sparkles className="h-3 w-3" />
          Linha Fina IA
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Sugestões de Linha Fina</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={gerarSugestoes}
              disabled={isLoading}
              className="h-7 gap-1 text-xs"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              Gerar novas
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Gerando sugestões...</span>
            </div>
          ) : sugestoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma sugestão disponível. Clique em "Gerar novas".
            </p>
          ) : (
            <div className="space-y-2">
              {sugestoes.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApply(s, i)}
                  className={`w-full text-left p-3 rounded-md border transition-colors hover:bg-accent/50 ${
                    appliedIndex === i ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">{s.linha1}</span>
                      <span className={`text-[10px] ${getCharColor(s.linha1.length, 20, 25)}`}>
                        {s.linha1.length} chars
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs">{s.linha2}</span>
                      <span className={`text-[10px] ${getCharColor(s.linha2.length, 35, 42)}`}>
                        {s.linha2.length} chars
                      </span>
                    </div>
                  </div>
                  {appliedIndex === i && (
                    <div className="flex items-center gap-1 mt-1 text-primary text-xs">
                      <Check className="h-3 w-3" /> Aplicado
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            L1: 20-25 chars · L2: 35-42 chars · Clique para aplicar ao GC
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
