
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Materia } from "@/types";
import { EditorTab } from "./EditorTab";
import { TeleprompterTab } from "./TeleprompterTab";

interface EditPanelTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  formData: Partial<Materia>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onTagsChange: (tags: string[]) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
}

export const EditPanelTabs = ({
  activeTab,
  onTabChange,
  formData,
  onInputChange,
  onTagsChange,
  onSave,
  onClose,
  isSaving
}: EditPanelTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="border-b border-gray-200 sticky top-14 bg-white z-10">
        <TabsList className="w-full">
          <TabsTrigger value="editor" className="w-1/2">Editor</TabsTrigger>
          <TabsTrigger value="teleprompter" className="w-1/2">Teleprompter</TabsTrigger>
        </TabsList>
      </div>
      
      <EditorTab
        formData={formData}
        onInputChange={onInputChange}
        onTagsChange={onTagsChange}
        onSave={onSave}
        onClose={onClose}
        isSaving={isSaving}
      />
      
      <TeleprompterTab
        cabeca={formData.cabeca || ''}
        texto={formData.texto || ''}
      />
    </Tabs>
  );
};
