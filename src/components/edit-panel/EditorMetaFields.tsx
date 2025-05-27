
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Materia } from "@/types";

interface EditorMetaFieldsProps {
  formData: Partial<Materia>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onTagsChange: (tags: string[]) => void;
}

export const EditorMetaFields = ({ formData, onInputChange, onTagsChange }: EditorMetaFieldsProps) => {
  return (
    <>
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
    </>
  );
};
