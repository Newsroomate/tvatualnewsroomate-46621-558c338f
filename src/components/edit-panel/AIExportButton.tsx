import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateRSSFeed } from "@/utils/rss-export-utils";

interface AIExportButtonProps {
  retranca?: string;
  cabeca?: string;
  texto?: string;
  reporter?: string;
  disabled?: boolean;
}

export const AIExportButton = ({
  retranca,
  cabeca,
  texto,
  reporter,
  disabled
}: AIExportButtonProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleAIExport = async () => {
    if (!texto || texto.trim() === '') {
      toast({
        title: "Conteúdo vazio",
        description: "Adicione conteúdo no corpo da matéria antes de exportar",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Starting AI processing for export...');
      
      // Call edge function to process text with AI
      const { data, error } = await supabase.functions.invoke('process-text-ai', {
        body: {
          retranca: retranca || 'Sem título',
          cabeca: cabeca || '',
          texto: texto || ''
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.processedText) {
        throw new Error('Nenhum texto processado retornado');
      }

      console.log('AI processing completed, generating RSS...');

      // Generate RSS feed with processed content
      generateRSSFeed(
        retranca || 'Matéria',
        data.processedText,
        reporter,
        ''
      );

      toast({
        title: "Exportação concluída",
        description: "Conteúdo processado por IA e exportado como RSS",
      });

    } catch (error) {
      console.error('Error in AI export:', error);
      toast({
        title: "Erro ao exportar",
        description: error instanceof Error ? error.message : "Não foi possível processar e exportar o conteúdo",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleAIExport}
      disabled={disabled || isProcessing || !texto}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isProcessing ? (
        <>
          <Sparkles className="h-4 w-4 animate-pulse" />
          Processando...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          <Download className="h-4 w-4" />
          Exportar RSS com IA
        </>
      )}
    </Button>
  );
};
