
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const EditorAttachments = () => {
  return (
    <div className="space-y-1.5">
      <Label>Anexos</Label>
      <div className="border border-dashed border-gray-300 rounded-md p-8 text-center">
        <p className="text-sm text-gray-500 mb-2">Arraste arquivos ou clique para upload</p>
        <Button type="button" variant="outline" size="sm">Selecionar Arquivos</Button>
      </div>
    </div>
  );
};
