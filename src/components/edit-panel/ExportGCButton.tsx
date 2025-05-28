
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Materia } from "@/types";

interface ExportGCButtonProps {
  formData: Partial<Materia>;
}

export const ExportGCButton = ({
  formData
}: ExportGCButtonProps) => {
  const handleExportGC = () => {
    const retranca = formData.retranca || '';
    const gc = formData.gc || '';
    
    if (!retranca && !gc) {
      alert('Não há conteúdo para exportar.');
      return;
    }
    
    const content = `RETRANCA: ${retranca}\n\nGC:\n${gc}`;

    // Create and download the file
    const blob = new Blob([content], {
      type: 'text/plain;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${retranca || 'materia'}_GC.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExportGC}
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Exportar
    </Button>
  );
};
