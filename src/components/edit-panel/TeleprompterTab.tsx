import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { Materia } from "@/types";
import { exportLaudaToPDF } from "@/utils/lauda-export-utils";

interface TeleprompterTabProps {
  formData: Partial<Materia>;
}

export const TeleprompterTab = ({ formData }: TeleprompterTabProps) => {
  const handleExportLauda = () => {
    if (formData) {
      // Use a retranca como nome do arquivo se disponível
      const filename = formData.retranca 
        ? formData.retranca
            .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
            .replace(/\s+/g, '_') // Substitui espaços por underscore
            .trim()
        : 'Lauda_Reporter';
      
      exportLaudaToPDF([formData as Materia], filename);
    }
  };

  return (
    <TabsContent value="teleprompter" className="p-4 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Visualização da Lauda</h3>
        <Button onClick={handleExportLauda} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Exportar Lauda
        </Button>
      </div>

      <div className="space-y-6">
        {/* Retranca */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Retranca</Label>
          <div className="p-3 bg-gray-50 border rounded-md min-h-[40px]">
            <p className="text-sm font-medium text-gray-900">
              {formData.retranca || 'Não informado'}
            </p>
          </div>
        </div>

        {/* Cabeça */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Cabeça (Teleprompter)</Label>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md min-h-[80px]">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {formData.cabeca || 'Não informado'}
            </p>
          </div>
        </div>

        {/* GC */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">GC (Gerador de Caracteres)</Label>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md min-h-[80px]">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {formData.gc || 'Não informado'}
            </p>
          </div>
        </div>

        {/* Corpo da Matéria */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Corpo da Matéria</Label>
          <div className="p-3 bg-green-50 border border-green-200 rounded-md min-h-[120px]">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {formData.texto || 'Não informado'}
            </p>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Duração</Label>
            <div className="p-2 bg-gray-50 border rounded-md">
              <p className="text-sm text-gray-800">
                {formData.duracao ? `${formData.duracao}s` : 'Não informado'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Repórter</Label>
            <div className="p-2 bg-gray-50 border rounded-md">
              <p className="text-sm text-gray-800">
                {formData.reporter || 'Não informado'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  );
};
