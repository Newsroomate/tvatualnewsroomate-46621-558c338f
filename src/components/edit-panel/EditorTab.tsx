import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { Materia } from "@/types";
import { useDurationCalculator } from "./DurationCalculator";

interface EditorTabProps {
  formData: Partial<Materia>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onTagsChange: (tags: string[]) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
}

export const EditorTab = ({ 
  formData, 
  onInputChange, 
  onTagsChange, 
  onSave, 
  onClose, 
  isSaving 
}: EditorTabProps) => {
  const { getCabecaWords } = useDurationCalculator();
  
  const cabecaWords = getCabecaWords(formData.cabeca || '');

  const handleExportGC = () => {
    const retranca = formData.retranca || '';
    const gc = formData.gc || '';
    
    if (!retranca && !gc) {
      alert('Não há conteúdo para exportar.');
      return;
    }

    const content = `RETRANCA: ${retranca}\n\nGC:\n${gc}`;
    
    // Create and download the file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
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
    <TabsContent value="editor" className="p-4 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="retranca">Retranca</Label>
        <Input 
          id="retranca" 
          value={formData.retranca || ''} 
          onChange={onInputChange}
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="cabeca">Cabeça (Teleprompter)</Label>
        <Textarea 
          id="cabeca" 
          rows={3} 
          value={formData.cabeca || ''} 
          onChange={onInputChange} 
          placeholder="Texto da cabeça do VT que será lido pelo apresentador."
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="gc">GC (Gerador de Caracteres)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportGC}
            disabled={!formData.retranca && !formData.gc}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar GC
          </Button>
        </div>
        <Textarea 
          id="gc" 
          rows={4} 
          value={formData.gc || ''} 
          onChange={onInputChange} 
          placeholder="Texto do GC que será exibido na tela durante a matéria."
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="texto">Corpo da Matéria</Label>
        <Textarea 
          id="texto" 
          rows={10} 
          value={formData.texto || ''} 
          onChange={onInputChange} 
          placeholder="Texto completo da matéria que será exibido no teleprompter."
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="clip">Clipe</Label>
          <Input 
            id="clip" 
            value={formData.clip || ''} 
            onChange={onInputChange}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="duracao">Duração (segundos)</Label>
          <Input 
            id="duracao" 
            type="number" 
            value={formData.duracao || 0} 
            onChange={onInputChange}
            title="Duração estimada automaticamente baseada na contagem de palavras da cabeça"
          />
          <p className="text-xs text-gray-500">
            Estimativa automática baseada em {Math.round(cabecaWords)} palavras da cabeça
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="reporter">Repórter</Label>
          <Input 
            id="reporter" 
            value={formData.reporter || ''} 
            onChange={onInputChange}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select 
            id="status" 
            className="w-full border border-gray-200 rounded-md p-2" 
            value={formData.status || 'draft'} 
            onChange={onInputChange}
          >
            <option value="draft">Rascunho</option>
            <option value="pending">Pendente</option>
            <option value="published">Publicado</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="pagina">Página</Label>
        <Input 
          id="pagina" 
          value={formData.pagina || ''}
          onChange={onInputChange}
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags SEO</Label>
        <Input 
          id="tags" 
          placeholder="Separe as tags por vírgulas"
          value={formData.tags?.join(', ') || ''} 
          onChange={(e) => {
            const tagsArray = e.target.value.split(',').map(tag => tag.trim());
            onTagsChange(tagsArray);
          }}
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="local_gravacao">Local de Gravação</Label>
        <Input 
          id="local_gravacao" 
          placeholder="Ex: Centro da Cidade" 
          value={formData.local_gravacao || ''}
          onChange={onInputChange}
        />
      </div>
      
      <div className="space-y-1.5">
        <Label>Anexos</Label>
        <div className="border border-dashed border-gray-300 rounded-md p-8 text-center">
          <p className="text-sm text-gray-500 mb-2">Arraste arquivos ou clique para upload</p>
          <Button type="button" variant="outline" size="sm">Selecionar Arquivos</Button>
        </div>
      </div>
      
      <div className="pt-4 flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </TabsContent>
  );
};
