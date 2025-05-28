
import { forwardRef } from "react";
import { Materia } from "@/types";

interface TeleprompterContentProps {
  materias: Materia[];
  fontSize: number;
}

export const TeleprompterContent = forwardRef<HTMLDivElement, TeleprompterContentProps>(
  ({ materias, fontSize }, ref) => {
    // Sort materias by ordem for proper display order
    const sortedMaterias = [...materias].sort((a, b) => a.ordem - b.ordem);

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
        {sortedMaterias.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            Nenhuma matéria encontrada para este telejornal
          </div>
        ) : (
          <div className="space-y-8">
            {sortedMaterias.map((materia, index) => (
              <div key={materia.id} className="space-y-4">
                {/* Retranca em amarelo - aparece primeiro */}
                <div className="text-yellow-400 font-bold text-2xl">
                  {materia.retranca || materia.titulo}
                </div>
                
                {/* Cabeça em branco - aparece depois */}
                {materia.cabeca && (
                  <div className="text-white font-medium">
                    {materia.cabeca}
                  </div>
                )}
                
                {/* Spacer between items */}
                {index < sortedMaterias.length - 1 && (
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
