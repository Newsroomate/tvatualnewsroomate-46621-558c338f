
import { useState, useRef, useEffect } from 'react';
import { Bloco, Materia } from "@/types";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, ArrowUp, ArrowDown, Maximize2, Minimize2, X, Plus, Minus } from "lucide-react";

interface TeleprompterProps {
  blocks: (Bloco & { items: Materia[] })[];
  onClose: () => void;
}

export const Teleprompter = ({ blocks, onClose }: TeleprompterProps) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2); // Default speed (1-10)
  const [fontSize, setFontSize] = useState(36); // Default font size in px
  const [lineHeight, setLineHeight] = useState(1.6); // Default line height
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const teleprompterRef = useRef<HTMLDivElement>(null);
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
  
  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value[0]);
  };
  
  const handleLineHeightChange = (value: number[]) => {
    setLineHeight(value[0]);
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
  
  // Function to increase font size
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 72)); // Max 72px
  };
  
  // Function to decrease font size
  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 16)); // Min 16px
  };
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!teleprompterRef.current) return;
    
    if (!document.fullscreenElement) {
      teleprompterRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  };
  
  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  return (
    <div 
      ref={teleprompterRef}
      className="fixed inset-0 bg-black z-50 text-white flex flex-col"
    >
      {/* Header bar */}
      <div className="bg-gray-900 p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Teleprompter</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="text-white hover:bg-gray-800"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="text-white hover:bg-gray-800"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Main content - Scrollable area */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto p-6 scrollbar-hide"
        style={{ 
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          textAlign: 'center'
        }}
      >
        {blocks.map((block) => (
          <div key={block.id} className="mb-12">
            <h3 className="font-bold py-2 mb-6 text-white border-b border-blue-500" style={{ fontSize: `${fontSize}px` }}>
              {block.nome}
            </h3>
            
            {block.items.map((item) => (
              <div key={item.id} className="mb-10">
                <div className="bg-gray-800 bg-opacity-50 p-2 mb-4 flex justify-between items-center">
                  <span className="font-bold text-yellow-300">
                    {item.pagina && `Página ${item.pagina}`}
                  </span>
                  <span className="text-green-400">{item.retranca}</span>
                </div>
                
                {item.cabeca && (
                  <div className="mb-6 text-yellow-300 leading-relaxed">
                    <div className="font-bold mb-1" style={{ fontSize: `${Math.max(fontSize - 10, 14)}px` }}>CABEÇA:</div>
                    {item.cabeca}
                  </div>
                )}
                
                {item.texto && (
                  <div className="mb-6 text-white leading-relaxed">
                    <div className="font-bold mb-1 text-blue-300" style={{ fontSize: `${Math.max(fontSize - 10, 14)}px` }}>TEXTO:</div>
                    {item.texto}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Control panel */}
      <div className="bg-gray-900 p-4">
        {/* Top row with play/pause and navigation controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button variant="ghost" onClick={scrollToTop} className="text-white">
            <ArrowUp className="h-5 w-5" />
          </Button>
          
          <Button
            variant={isScrolling ? "destructive" : "default"}
            onClick={handlePlayPause}
            className="w-28 text-lg"
          >
            {isScrolling ? (
              <>
                <Pause className="h-5 w-5 mr-2" /> Pausar
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" /> Iniciar
              </>
            )}
          </Button>
          
          <Button variant="ghost" onClick={scrollToBottom} className="text-white">
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Bottom row with sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Scroll speed control */}
          <div className="flex items-center gap-2">
            <span className="text-sm whitespace-nowrap w-24">Velocidade:</span>
            <Slider
              value={[scrollSpeed]}
              min={0.5}
              max={10}
              step={0.5}
              onValueChange={handleSpeedChange}
              className="w-full"
            />
            <span className="text-sm w-10">{scrollSpeed}x</span>
          </div>
          
          {/* Font size control */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={decreaseFontSize} className="h-8 w-8">
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm whitespace-nowrap w-24">Tamanho Fonte:</span>
            <Slider
              value={[fontSize]}
              min={16}
              max={72}
              step={2}
              onValueChange={handleFontSizeChange}
              className="w-full"
            />
            <Button variant="outline" size="icon" onClick={increaseFontSize} className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-sm w-10">{fontSize}px</span>
          </div>
          
          {/* Line height control */}
          <div className="flex items-center gap-2">
            <span className="text-sm whitespace-nowrap w-24">Espaçamento:</span>
            <Slider
              value={[lineHeight * 10]}
              min={10}
              max={30}
              step={1}
              onValueChange={(val) => handleLineHeightChange([val[0] / 10])}
              className="w-full"
            />
            <span className="text-sm w-10">{lineHeight.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

