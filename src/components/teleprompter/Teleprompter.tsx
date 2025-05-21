
import { useState, useRef, useEffect } from 'react';
import { Bloco, Materia } from "@/types";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, ArrowUp, ArrowDown, X } from "lucide-react";

interface TeleprompterProps {
  blocks: (Bloco & { items: Materia[] })[];
  onClose: () => void;
}

export const Teleprompter = ({ blocks, onClose }: TeleprompterProps) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2); // Default speed (1-10)
  const contentRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Function to handle auto-scrolling animation
  const scrollContent = () => {
    if (!contentRef.current) return;
    
    // Scroll down by a number of pixels based on speed
    contentRef.current.scrollTop += scrollSpeed * 0.5;
    
    // Continue animation if still scrolling
    if (isScrolling) {
      animationRef.current = requestAnimationFrame(scrollContent);
    }
  };
  
  // Start/stop scrolling based on isScrolling state
  useEffect(() => {
    if (isScrolling) {
      animationRef.current = requestAnimationFrame(scrollContent);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isScrolling, scrollSpeed]);
  
  const handlePlayPause = () => {
    setIsScrolling(prev => !prev);
  };
  
  const handleSpeedChange = (value: number[]) => {
    setScrollSpeed(value[0]);
  };
  
  // Function to scroll to top
  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };
  
  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black z-50 text-white flex flex-col">
      {/* Header bar */}
      <div className="bg-gray-900 p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Teleprompter</h2>
        <Button variant="ghost" onClick={onClose} className="text-white hover:bg-gray-800">
          <X className="h-6 w-6" />
        </Button>
      </div>
      
      {/* Main content - Scrollable area */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto p-6 text-center scrollbar-hide"
        style={{ 
          fontFamily: 'Arial, sans-serif',
          fontSize: '24px',
          lineHeight: '1.6'
        }}
      >
        {blocks.map((block) => (
          <div key={block.id} className="mb-12">
            <h3 className="text-2xl font-bold bg-blue-900 py-2 mb-6 text-white">
              {block.nome}
            </h3>
            
            {block.items.map((item) => (
              <div key={item.id} className="mb-10">
                <div className="bg-gray-800 p-2 mb-4 flex justify-between items-center">
                  <span className="font-bold text-yellow-300">
                    {item.pagina && `Página ${item.pagina}`}
                  </span>
                  <span className="text-green-400">{item.retranca}</span>
                </div>
                
                {item.cabeca && (
                  <div className="mb-6 text-yellow-300 leading-relaxed text-left">
                    <div className="font-bold text-sm mb-1">CABEÇA:</div>
                    {item.cabeca}
                  </div>
                )}
                
                {item.texto && (
                  <div className="mb-6 text-white leading-relaxed text-left">
                    <div className="font-bold text-sm mb-1 text-blue-300">TEXTO:</div>
                    {item.texto}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Control panel */}
      <div className="bg-gray-900 p-4 flex flex-col md:flex-row items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={scrollToTop} className="text-white">
            <ArrowUp className="h-5 w-5" />
          </Button>
          
          <Button
            variant={isScrolling ? "destructive" : "default"}
            onClick={handlePlayPause}
            className="w-24"
          >
            {isScrolling ? (
              <>
                <Pause className="h-5 w-5 mr-1" /> Pausar
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-1" /> Iniciar
              </>
            )}
          </Button>
          
          <Button variant="ghost" onClick={scrollToBottom} className="text-white">
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-4 w-full max-w-xs">
          <span className="text-sm whitespace-nowrap">Velocidade:</span>
          <Slider
            value={[scrollSpeed]}
            min={1}
            max={10}
            step={0.5}
            onValueChange={handleSpeedChange}
            className="w-full"
          />
          <span className="text-sm w-6">{scrollSpeed}x</span>
        </div>
      </div>
    </div>
  );
};
