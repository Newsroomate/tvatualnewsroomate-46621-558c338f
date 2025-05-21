
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
  const [showControls, setShowControls] = useState(true);
  
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
  
  // Function to increase/decrease font size
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 72)); // Max 72px
  };
  
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
  
  // Toggle controls visibility
  const toggleControls = () => {
    setShowControls(prev => !prev);
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
  
  // Handle key press events for controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        // Space bar toggles play/pause
        handlePlayPause();
        e.preventDefault();
      } else if (e.key === 'Escape' && isFullscreen) {
        // Escape exits fullscreen
        document.exitFullscreen();
      } else if (e.key === 'h') {
        // 'h' key toggles controls visibility
        toggleControls();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, isScrolling]);
  
  return (
    <div 
      ref={teleprompterRef}
      className="fixed inset-0 bg-black z-50 text-white flex flex-col"
      onClick={toggleControls}
    >
      {/* Header bar - only shown when controls are visible */}
      {showControls && (
        <div className="bg-black bg-opacity-70 backdrop-blur-sm p-2 flex items-center justify-between border-b border-gray-800">
          <h2 className="text-lg font-medium ml-2">Teleprompter</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button 
              variant="outline"
              size="icon" 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Main content - Scrollable area with simplified text display */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto p-6 scrollbar-hide"
        style={{ 
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          textAlign: 'center',
          padding: showControls ? '3rem 6rem' : '4rem 8rem' // More padding when controls are hidden
        }}
      >
        {blocks.map((block) => (
          <div key={block.id} className="mb-16">
            <h3 className="font-bold mb-10 text-blue-300" style={{ fontSize: `${fontSize}px` }}>
              {block.nome}
            </h3>
            
            {block.items.map((item) => (
              <div key={item.id} className="mb-16">
                {/* Display only the cabeça and texto content */}
                {item.cabeca && (
                  <div className="mb-10 text-yellow-300">
                    {item.cabeca}
                  </div>
                )}
                
                {item.texto && (
                  <div className="mb-16 text-white">
                    {item.texto}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Control panel - only shown when controls are visible */}
      {showControls && (
        <div 
          className="bg-black bg-opacity-70 backdrop-blur-sm p-3 border-t border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top row with play/pause and navigation controls */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={scrollToTop} 
              className="text-white hover:bg-gray-800 h-8"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            
            <Button
              variant={isScrolling ? "destructive" : "default"}
              onClick={handlePlayPause}
              className="w-24 h-8 flex items-center justify-center text-sm"
              size="sm"
            >
              {isScrolling ? (
                <>
                  <Pause className="h-4 w-4 mr-1" /> Pausar
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" /> Iniciar
                </>
              )}
            </Button>
            
            <Button 
              variant="ghost"
              size="sm"
              onClick={scrollToBottom} 
              className="text-white hover:bg-gray-800 h-8"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Bottom row with sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Scroll speed control */}
            <div className="flex items-center gap-2">
              <span className="text-xs whitespace-nowrap w-16">Velocidade:</span>
              <Slider
                value={[scrollSpeed]}
                min={0.5}
                max={10}
                step={0.5}
                onValueChange={handleSpeedChange}
                className="w-full"
              />
              <span className="text-xs w-8 text-right">{scrollSpeed}x</span>
            </div>
            
            {/* Font size control */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={decreaseFontSize} className="h-6 w-6 bg-transparent border-gray-700">
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-xs whitespace-nowrap w-16">Fonte:</span>
              <Slider
                value={[fontSize]}
                min={16}
                max={72}
                step={2}
                onValueChange={handleFontSizeChange}
                className="w-full"
              />
              <Button variant="outline" size="icon" onClick={increaseFontSize} className="h-6 w-6 bg-transparent border-gray-700">
                <Plus className="h-3 w-3" />
              </Button>
              <span className="text-xs w-8 text-right">{fontSize}px</span>
            </div>
            
            {/* Line height control */}
            <div className="flex items-center gap-2">
              <span className="text-xs whitespace-nowrap w-16">Espaçamento:</span>
              <Slider
                value={[lineHeight * 10]}
                min={10}
                max={30}
                step={1}
                onValueChange={(val) => handleLineHeightChange([val[0] / 10])}
                className="w-full"
              />
              <span className="text-xs w-8 text-right">{lineHeight.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Small hint text that shows when controls are hidden */}
      {!showControls && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-500 text-xs opacity-50 bg-black bg-opacity-50 px-2 py-1 rounded">
          Clique para mostrar controles
        </div>
      )}
    </div>
  );
};
