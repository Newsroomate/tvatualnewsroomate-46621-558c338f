
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  item: any | null;
}

export const EditPanel = ({ isOpen, onClose, item }: EditPanelProps) => {
  const [activeTab, setActiveTab] = useState("editor");

  if (!isOpen || !item) return null;

  return (
    <div className="fixed top-0 right-0 w-[400px] h-full bg-white border-l border-gray-200 shadow-lg transition-transform duration-300 ease-in-out z-20 overflow-y-auto">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center sticky top-0 z-10">
        <h3 className="font-medium">Editar: {item.title}</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-gray-200 sticky top-14 bg-white z-10">
          <TabsList className="w-full">
            <TabsTrigger value="editor" className="w-1/2">Editor</TabsTrigger>
            <TabsTrigger value="teleprompter" className="w-1/2">Teleprompter</TabsTrigger>
          </TabsList>
        </div>
        
        {/* Editor Tab Content */}
        <TabsContent value="editor" className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Retranca</Label>
            <Input id="title" defaultValue={item.title} />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="headline">Cabeça (Teleprompter)</Label>
            <Textarea id="headline" rows={3} defaultValue="Texto da cabeça do VT que será lido pelo apresentador." />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="body">Corpo da Matéria</Label>
            <Textarea id="body" rows={10} defaultValue="Texto completo da matéria que será exibido no teleprompter." />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="clip">Clipe</Label>
              <Input id="clip" defaultValue={item.clip} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duração (segundos)</Label>
              <Input id="duration" type="number" defaultValue={item.duration} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="reporter">Repórter</Label>
              <Input id="reporter" defaultValue={item.reporter || ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select id="status" className="w-full border border-gray-200 rounded-md p-2" defaultValue={item.status}>
                <option value="draft">Rascunho</option>
                <option value="pending">Pendente</option>
                <option value="published">Publicado</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags SEO</Label>
            <Input id="tags" placeholder="Separe as tags por vírgulas" />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="location">Local de Gravação</Label>
            <Input id="location" placeholder="Ex: Centro da Cidade" />
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
            <Button>Salvar</Button>
          </div>
        </TabsContent>
        
        {/* Teleprompter Tab Content */}
        <TabsContent value="teleprompter" className="h-[calc(100vh-116px)]">
          <div className="teleprompter-text">
            <p className="mb-6"><strong>CABEÇA:</strong></p>
            <p className="mb-10">
              Texto da cabeça do VT que será lido pelo apresentador. Este texto precisa ser claro e direto,
              preparando o telespectador para a matéria que virá em seguida.
            </p>
            
            <p className="mb-6"><strong>OFF:</strong></p>
            <p className="mb-6">
              Texto completo da matéria que será exibido no teleprompter. Neste texto, o repórter descreve
              os detalhes da reportagem enquanto as imagens são exibidas.
            </p>
            
            <p className="mb-6">
              O teleprompter mostra o texto em fonte grande e clara para facilitar a leitura pelo apresentador
              ou repórter durante a gravação ou transmissão ao vivo.
            </p>
            
            <p>
              Esta visualização simula como o texto aparecerá no teleprompter durante o programa.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
