import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Materia } from "@/types";
import { useState } from "react";
interface EditorMetaFieldsProps {
  formData: Partial<Materia>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
}
export const EditorMetaFields = ({
  formData,
  onInputChange,
  onTagsChange,
  disabled = false
}: EditorMetaFieldsProps) => {
  const [newTag, setNewTag] = useState("");
  const handleStatusChange = (value: string) => {
    if (disabled) return;
    onInputChange({
      target: {
        id: 'status',
        value
      }
    } as React.ChangeEvent<HTMLSelectElement>);
  };
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' && newTag.trim()) {
      const currentTags = formData.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        onTagsChange([...currentTags, newTag.trim()]);
      }
      setNewTag("");
    }
  };
  const handleRemoveTag = (tagToRemove: string) => {
    if (disabled) return;
    const currentTags = formData.tags || [];
    onTagsChange(currentTags.filter(tag => tag !== tagToRemove));
  };
  return <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="reporter">Repórter</Label>
          <Input id="reporter" value={formData.reporter || ''} onChange={onInputChange} disabled={disabled} />
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status || 'draft'} onValueChange={handleStatusChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="review">Em revisão</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="local_gravacao">Local de Gravação</Label>
          <Input id="local_gravacao" value={formData.local_gravacao || ''} onChange={onInputChange} disabled={disabled} />
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="pagina">Página</Label>
          <Input id="pagina" value={formData.pagina || ''} onChange={onInputChange} disabled={disabled} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="clip">Duração Clip</Label>
        <Input id="clip" value={formData.clip || ''} onChange={onInputChange} disabled={disabled} />
      </div>

      <div className="space-y-1.5">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(formData.tags || []).map((tag, index) => <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {tag}
              {!disabled && <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => handleRemoveTag(tag)} />}
            </Badge>)}
        </div>
        <Input placeholder="Digite uma tag e pressione Enter" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={handleAddTag} disabled={disabled} />
      </div>
    </>;
};