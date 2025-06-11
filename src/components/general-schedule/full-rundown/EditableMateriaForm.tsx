
import { useState } from "react";
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
  bloco_id?: string;
  bloco_nome?: string;
  bloco_ordem?: number;
  tipo_material?: string;
  tempo_clip?: string;
}

interface EditableMateriaFormProps {
  editData: EditableMateria;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  onUpdate: (updates: Partial<EditableMateria>) => void;
}

export const EditableMateriaForm = ({
  editData,
  isSaving,
  onSave,
  onCancel,
  onUpdate
}: EditableMateriaFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">Editando Matéria</h4>
        <div className="flex space-x-2">
          <Button size="sm" onClick={onSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
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
            onChange={(e) => onUpdate({ retranca: e.target.value })}
            placeholder="Retranca da matéria"
            required
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Clip</label>
          <Input
            value={editData.clip || ''}
            onChange={(e) => onUpdate({ clip: e.target.value })}
            placeholder="Código do clip"
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Duração (segundos)</label>
          <Input
            type="number"
            value={editData.duracao || 0}
            onChange={(e) => onUpdate({ duracao: parseInt(e.target.value) || 0 })}
            placeholder="0"
            min="0"
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <Select 
            value={editData.status || 'draft'} 
            onValueChange={(value) => onUpdate({ status: value })}
            disabled={isSaving}
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
            onChange={(e) => onUpdate({ pagina: e.target.value })}
            placeholder="Página"
            disabled={isSaving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Repórter</label>
          <Input
            value={editData.reporter || ''}
            onChange={(e) => onUpdate({ reporter: e.target.value })}
            placeholder="Nome do repórter"
            disabled={isSaving}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cabeça</label>
        <Textarea
          value={editData.cabeca || ''}
          onChange={(e) => onUpdate({ cabeca: e.target.value })}
          placeholder="Texto da cabeça"
          rows={3}
          disabled={isSaving}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Texto</label>
        <Textarea
          value={editData.texto || ''}
          onChange={(e) => onUpdate({ texto: e.target.value })}
          placeholder="Texto da matéria"
          rows={4}
          disabled={isSaving}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">GC</label>
        <Textarea
          value={editData.gc || ''}
          onChange={(e) => onUpdate({ gc: e.target.value })}
          placeholder="Texto do GC"
          rows={2}
          disabled={isSaving}
        />
      </div>
    </div>
  );
};
