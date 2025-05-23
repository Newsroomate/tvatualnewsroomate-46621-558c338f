
import React from "react";
import { TabsContent } from "@/components/ui/tabs";

interface TeleprompterTabProps {
  active: boolean;
  cabeca: string;
  texto: string;
}

export const TeleprompterTab = ({ active, cabeca, texto }: TeleprompterTabProps) => {
  return (
    <TabsContent value="teleprompter" className="p-4">
      <div className="teleprompter-text bg-black text-white p-6 rounded-md text-2xl space-y-8">
        <div className="mb-8">
          <h3 className="text-xl text-yellow-400 mb-3">CABEÇA:</h3>
          <p className="leading-relaxed">
            {cabeca || "Nenhum texto de cabeça definido."}
          </p>
        </div>
        
        <div>
          <h3 className="text-xl text-yellow-400 mb-3">OFF:</h3>
          <p className="leading-relaxed">
            {texto || "Nenhum texto de corpo definido."}
          </p>
        </div>
      </div>
    </TabsContent>
  );
};
