
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";

interface EditableMateria {
  id: string;
  retranca: string;
  clip?: string;
  duracao: number;
  texto?: string;
  cabeca?: string;
  gc?: string;
  status?: string;
  pagina?: string;
  reporter?: string;
  ordem: number;
  tags?: string[];
  local_gravacao?: string;
  equipamento?: string;
}

interface MateriaEditFormProps {
  editData: EditableMateria;
  onSave: () => void;
  onCancel: () => void;
  onChange: (data: EditableMateria) => void;
  isSaving: boolean;
}

export const MateriaEditForm = ({ 
  editData, 
  onSave, 
  onCancel, 
  onChange, 
  isSaving 
}: MateriaEditFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">Editando Matéria</h4>
        <div className="flex space-x-2">
          <Button size="sm" onClick={onSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Retranca *</label>
          <Input
            value={editData.retranca || ''}
            onChange={(e) => onChange({...editData, retranca: e.target.value})}
            placeholder="Retranca da matéria"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Clip</label>
          <Input
            value={editData.clip || ''}
            onChange={(e) => onChange({...editData, clip: e.target.value})}
            placeholder="Código do clip"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Duração (segundos)</label>
          <Input
            type="number"
            value={editData.duracao || 0}
            onChange={(e) => onChange({...editData, duracao: parseInt(e.target.value) || 0})}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <Select 
            value={editData.status || 'draft'} 
            onValueChange={(value) => onChange({...editData, status: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Página</label>
          <Input
            value={editData.pagina || ''}
            onChange={(e) => onChange({...editData, pagina: e.target.value})}
            placeholder="Página"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Repórter</label>
          <Input
            value={editData.reporter || ''}
            onChange={(e) => onChange({...editData, reporter: e.target.value})}
            placeholder="Nome do repórter"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cabeça</label>
        <Textarea
          value={editData.cabeca || ''}
          onChange={(e) => onChange({...editData, cabeca: e.target.value})}
          placeholder="Texto da cabeça"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Texto</label>
        <Textarea
          value={editData.texto || ''}
          onChange={(e) => onChange({...editData, texto: e.target.value})}
          placeholder="Texto da matéria"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">GC</label>
        <Textarea
          value={editData.gc || ''}
          onChange={(e) => onChange({...editData, gc: e.target.value})}
          placeholder="Texto do GC"
          rows={2}
        />
      </div>
    </div>
  );
};
