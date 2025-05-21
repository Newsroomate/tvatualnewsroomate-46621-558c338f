
import { useState, useRef, useEffect } from 'react';
import { Bloco, Materia } from "@/types";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  ArrowUp, 
  ArrowDown, 
  Maximize2, 
  Minimize2, 
  X, 
  TextCursor, 
  ArrowUpFromLine, 
  ListCollapse, 
  ListExpand 
} from "lucide-react";

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
  
  // Function to increase/decrease line height
  const increaseLineHeight = () => {
    setLineHeight(prev => Math.min(prev + 0.1, 3.0)); // Max 3.0
  };
  
  const decreaseLineHeight = () => {
    setLineHeight(prev => Math.max(prev - 0.1, 1.0)); // Min 1.0
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
      } else if (e.key === 'ArrowUp') {
        // Speed up
        setScrollSpeed(prev => Math.min(prev + 0.5, 10));
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        // Speed down
        setScrollSpeed(prev => Math.max(prev - 0.5, 0.5));
        e.preventDefault();
      } else if (e.key === '+') {
        // Increase font size
        increaseFontSize();
        e.preventDefault();
      } else if (e.key === '-') {
        // Decrease font size
        decreaseFontSize();
        e.preventDefault();
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
              variant="teleprompter"
              size="icon"
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button 
              variant="teleprompter"
              size="icon" 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
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
      
      {/* Control panel - organized in groups as requested */}
      {showControls && (
        <div 
          className="bg-black bg-opacity-70 backdrop-blur-sm p-4 border-t border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Control bar with grouped functions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Group 1: Scroll controls */}
            <div className="flex flex-col space-y-3">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Controle de rolagem</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="teleprompter"
                    size="sm"
                    onClick={scrollToTop} 
                    className="h-8 w-8"
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
                    variant="teleprompter"
                    size="sm"
                    onClick={scrollToBottom} 
                    className="h-8 w-8"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs w-16">Velocidade:</span>
                <Slider
                  value={[scrollSpeed]}
                  min={0.5}
                  max={10}
                  step={0.5}
                  onValueChange={handleSpeedChange}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{scrollSpeed}x</span>
              </div>
            </div>
            
            {/* Group 2: Text controls */}
            <div className="flex flex-col space-y-3">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Controle de texto</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="teleprompter" 
                    size="sm" 
                    onClick={decreaseFontSize}
                    className="h-8"
                  >
                    <TextCursor className="h-3 w-3" /> -
                  </Button>
                  <span className="text-xs">Tamanho: {fontSize}px</span>
                  <Button 
                    variant="teleprompter" 
                    size="sm" 
                    onClick={increaseFontSize}
                    className="h-8"
                  >
                    <TextCursor className="h-4 w-4" /> +
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs w-16">Tamanho:</span>
                <Slider
                  value={[fontSize]}
                  min={16}
                  max={72}
                  step={2}
                  onValueChange={handleFontSizeChange}
                  className="flex-1"
                />
              </div>
            </div>
            
            {/* Group 3: Line spacing and display controls */}
            <div className="flex flex-col space-y-3">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Espaçamento</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="teleprompter" 
                    size="sm" 
                    onClick={decreaseLineHeight}
                    className="h-8"
                  >
                    <ListCollapse className="h-4 w-4" />
                  </Button>
                  <span className="text-xs">Espaço: {lineHeight.toFixed(1)}</span>
                  <Button 
                    variant="teleprompter" 
                    size="sm" 
                    onClick={increaseLineHeight}
                    className="h-8"
                  >
                    <ListExpand className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs w-16">Espaço:</span>
                <Slider
                  value={[lineHeight * 10]} // Multiply by 10 to make the slider work with integers
                  min={10}
                  max={30}
                  step={1}
                  onValueChange={(val) => handleLineHeightChange([val[0] / 10])}
                  className="flex-1"
                />
              </div>
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
