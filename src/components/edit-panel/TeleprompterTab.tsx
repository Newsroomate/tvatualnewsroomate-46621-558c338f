import { TabsContent } from "@/components/ui/tabs";
interface TeleprompterTabProps {
  cabeca: string;
  texto: string;
}
export const TeleprompterTab = ({
  cabeca,
  texto
}: TeleprompterTabProps) => {
  return <TabsContent value="teleprompter" className="p-4">
      
    </TabsContent>;
};