
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Materia } from "@/types";

interface FormFieldsProps {
  formData: Partial<Materia>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Materia>>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const FormFields = ({ formData, setFormData, handleInputChange }: FormFieldsProps) => {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="retranca">Retranca</Label>
        <Input 
          id="retranca" 
          value={formData.retranca || ''} 
          onChange={handleInputChange}
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="cabeca">Cabeça (Teleprompter)</Label>
        <Textarea 
          id="cabeca" 
          rows={3} 
          value={formData.cabeca || ''} 
          onChange={handleInputChange} 
          placeholder="Texto da cabeça do VT que será lido pelo apresentador."
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="texto">Corpo da Matéria</Label>
        <Textarea 
          id="texto" 
          rows={10} 
          value={formData.texto || ''} 
          onChange={handleInputChange} 
          placeholder="Texto completo da matéria que será exibido no teleprompter."
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="clip">Clipe</Label>
          <Input 
            id="clip" 
            value={formData.clip || ''} 
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="duracao">Duração (segundos)</Label>
          <Input 
            id="duracao" 
            type="number" 
            value={formData.duracao || 0} 
            onChange={handleInputChange}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="reporter">Repórter</Label>
          <Input 
            id="reporter" 
            value={formData.reporter || ''} 
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select 
            id="status" 
            className="w-full border border-gray-200 rounded-md p-2" 
            value={formData.status || 'draft'} 
            onChange={handleInputChange}
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
          onChange={handleInputChange}
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
            setFormData(prev => ({ ...prev, tags: tagsArray }));
          }}
        />
      </div>
      
      <div className="space-y-1.5">
        <Label htmlFor="local_gravacao">Local de Gravação</Label>
        <Input 
          id="local_gravacao" 
          placeholder="Ex: Centro da Cidade" 
          value={formData.local_gravacao || ''}
          onChange={handleInputChange}
        />
      </div>
    </>
  );
};
