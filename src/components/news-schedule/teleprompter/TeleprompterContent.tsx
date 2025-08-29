
import { forwardRef } from "react";
import { Materia, Bloco } from "@/types";

interface TeleprompterContentProps {
  blocks: (Bloco & { items: Materia[] })[];
  fontSize: number;
  cabecaColor?: string;
  retrancaColor?: string;
  tipoMaterialColor?: string;
}

export const TeleprompterContent = forwardRef<HTMLDivElement, TeleprompterContentProps>(
  ({ blocks, fontSize, cabecaColor = "#ffffff", retrancaColor = "#facc15", tipoMaterialColor = "#f97316" }, ref) => {
    console.log("TeleprompterContent received blocks:", blocks);

    // Sort blocks by ordem and then get all materias in the correct order
    const sortedBlocks = [...blocks].sort((a, b) => a.ordem - b.ordem);
    
    // Create a flat list of materias in the correct order
    const orderedMaterias: (Materia & { blockName?: string })[] = [];
    
    sortedBlocks.forEach(block => {
      // Sort materias within each block by ordem and filter only published ones
      const sortedMaterias = [...block.items]
        .sort((a, b) => a.ordem - b.ordem)
        .filter(materia => materia.status === 'published');
      
      // Add block name to each materia for context
      sortedMaterias.forEach(materia => {
        orderedMaterias.push({
          ...materia,
          blockName: block.nome
        });
      });
    });

    console.log("Ordered materias for teleprompter (published only):", orderedMaterias);

    return (
      <div 
        ref={ref}
        className="teleprompter-content flex-1 overflow-y-auto bg-black text-white"
        style={{ 
          lineHeight: '1.8',
          scrollBehavior: 'smooth',
          height: '100%',
          padding: '20px',
          margin: 0,
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100vw'
        }}
      >
        {orderedMaterias.length === 0 ? (
          <div 
            className="text-gray-400"
            style={{ 
              fontSize: `${fontSize}px`,
              padding: 0,
              margin: 0,
              textAlign: 'center',
              wordBreak: 'keep-all',
              overflowWrap: 'normal',
              hyphens: 'none',
              whiteSpace: 'pre-wrap',
              maxWidth: '100%'
            }}
          >
            Nenhuma matéria publicada encontrada para este telejornal
          </div>
        ) : (
          <div style={{ 
            padding: 0, 
            margin: 0,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            {orderedMaterias.map((materia, index) => (
              <div 
                key={`${materia.bloco_id}-${materia.id}`}
                data-materia-id={materia.id}
                style={{ 
                  padding: 0, 
                  margin: 0,
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {/* Block name indicator (optional, can be commented out) */}
                {index === 0 || orderedMaterias[index - 1]?.bloco_id !== materia.bloco_id ? (
                  <div 
                    className="text-blue-400 font-medium"
                    style={{ 
                      fontSize: `${fontSize * 0.7}px`,
                      padding: 0,
                      margin: '0 0 16px 0',
                      textAlign: 'center',
                      wordBreak: 'keep-all',
                      overflowWrap: 'normal',
                      hyphens: 'none',
                      whiteSpace: 'pre-wrap',
                      maxWidth: '100%',
                      width: '100%'
                    }}
                  >
                    {materia.blockName}
                  </div>
                ) : null}
                
                {/* Tipo de Material */}
                {materia.tipo_material && (
                  <div 
                    className="text-orange-400 font-semibold"
                    style={{ 
                      fontSize: `${fontSize * 0.8}px`,
                      color: tipoMaterialColor,
                      padding: 0,
                      margin: '0 0 12px 0',
                      textAlign: 'center',
                      wordBreak: 'keep-all',
                      overflowWrap: 'normal',
                      hyphens: 'none',
                      whiteSpace: 'pre-wrap',
                      maxWidth: '100%',
                      width: '100%',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    [{materia.tipo_material}]
                  </div>
                )}
                
                {/* Retranca com cor customizada */}
                <div 
                  className="font-bold"
                  data-retranca-id={materia.id}
                  style={{ 
                    fontSize: `${fontSize}px`,
                    color: retrancaColor,
                    padding: 0,
                    margin: '0 0 8px 0',
                    textAlign: 'center',
                    wordBreak: 'keep-all',
                    overflowWrap: 'normal',
                    hyphens: 'none',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '100%',
                    width: '100%'
                  }}
                >
                  {materia.retranca || `Matéria ${materia.ordem}`}
                </div>
                
                {/* Cabeça com cor customizada */}
                {materia.cabeca && (
                  <div 
                    className="font-medium"
                    style={{ 
                      fontSize: `${fontSize}px`,
                      color: cabecaColor,
                      padding: 0,
                      margin: '0 0 8px 0',
                      textAlign: 'left',
                      wordBreak: 'keep-all',
                      overflowWrap: 'normal',
                      hyphens: 'none',
                      whiteSpace: 'pre-wrap',
                      maxWidth: '100%',
                      width: '100%'
                    }}
                  >
                    {materia.cabeca}
                  </div>
                )}
                
                {/* Spacer between items */}
                {index < orderedMaterias.length - 1 && (
                  <div style={{ height: '32px' }}></div>
                )}
              </div>
            ))}
            
            {/* Extra space at the end */}
            <div style={{ height: '100vh' }}></div>
          </div>
        )}
      </div>
    );
  }
);

TeleprompterContent.displayName = "TeleprompterContent";
