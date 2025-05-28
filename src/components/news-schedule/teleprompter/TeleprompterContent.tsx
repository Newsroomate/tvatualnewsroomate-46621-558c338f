
import { forwardRef } from "react";
import { Materia, Bloco } from "@/types";

interface TeleprompterContentProps {
  blocks: (Bloco & { items: Materia[] })[];
  fontSize: number;
}

export const TeleprompterContent = forwardRef<HTMLDivElement, TeleprompterContentProps>(
  ({ blocks, fontSize }, ref) => {
    console.log("TeleprompterContent received blocks:", blocks);

    // Sort blocks by ordem and then get all materias in the correct order
    const sortedBlocks = [...blocks].sort((a, b) => a.ordem - b.ordem);
    
    // Create a flat list of materias in the correct order
    const orderedMaterias: (Materia & { blockName?: string })[] = [];
    
    sortedBlocks.forEach(block => {
      // Sort materias within each block by ordem
      const sortedMaterias = [...block.items].sort((a, b) => a.ordem - b.ordem);
      
      // Add block name to each materia for context
      sortedMaterias.forEach(materia => {
        orderedMaterias.push({
          ...materia,
          blockName: block.nome
        });
      });
    });

    console.log("Ordered materias for teleprompter:", orderedMaterias);

    return (
      <div 
        ref={ref}
        className="teleprompter-content flex-1 overflow-y-auto bg-black text-white p-8"
        style={{ 
          fontSize: `${fontSize}px`,
          lineHeight: '1.8',
          scrollBehavior: 'smooth'
        }}
      >
        {orderedMaterias.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            Nenhuma matéria encontrada para este telejornal
          </div>
        ) : (
          <div className="space-y-8">
            {orderedMaterias.map((materia, index) => (
              <div key={`${materia.bloco_id}-${materia.id}`} className="space-y-4">
                {/* Block name indicator (optional, can be commented out) */}
                {index === 0 || orderedMaterias[index - 1]?.bloco_id !== materia.bloco_id ? (
                  <div className="text-blue-400 text-sm font-medium mb-2">
                    {materia.blockName}
                  </div>
                ) : null}
                
                {/* Retranca em amarelo - aparece primeiro */}
                <div className="text-yellow-400 font-bold text-2xl">
                  {materia.retranca || `Matéria ${materia.ordem}`}
                </div>
                
                {/* Cabeça em branco - aparece depois */}
                {materia.cabeca && (
                  <div className="text-white font-medium">
                    {materia.cabeca}
                  </div>
                )}
                
                {/* Spacer between items */}
                {index < orderedMaterias.length - 1 && (
                  <div className="h-8"></div>
                )}
              </div>
            ))}
            
            {/* Extra space at the end */}
            <div className="h-screen"></div>
          </div>
        )}
      </div>
    );
  }
);

TeleprompterContent.displayName = "TeleprompterContent";
