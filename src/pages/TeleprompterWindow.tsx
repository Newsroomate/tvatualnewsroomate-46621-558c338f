
import { useEffect } from "react";
import { TeleprompterContent } from "@/components/news-schedule/teleprompter/TeleprompterContent";
import { TeleprompterWindowHeader } from "@/components/news-schedule/teleprompter/TeleprompterWindowHeader";
import { TeleprompterWindowControls } from "@/components/news-schedule/teleprompter/TeleprompterWindowControls";
import { useTeleprompterWindowState } from "@/hooks/useTeleprompterWindowState";
import { useTeleprompterWindowEffects } from "@/hooks/useTeleprompterWindowEffects";
import { useTeleprompterKeyboardControls } from "@/hooks/useTeleprompterKeyboardControls";
import { useIsMobile } from "@/hooks/use-mobile";

const TeleprompterWindow = () => {
  const isMobile = useIsMobile();
  const {
    // State
    blocks,
    setBlocks,
    telejornal,
    setTelejornal,
    isLoading,
    setIsLoading,
    isPlaying,
    setIsPlaying,
    speed,
    fontSize,
    scrollPosition,
    setScrollPosition,
    isFullscreen,
    setIsFullscreen,
    cabecaColor,
    retrancaColor,
    tipoMaterialColor,
    
    // Refs
    contentRef,
    intervalRef,
    animationFrameRef,
    lastTimeRef,
    hasReceivedDataRef,
    
    // Handlers
    handlePlayPause,
    handleSpeedChange,
    resetPosition,
    increaseFontSize,
    decreaseFontSize,
    handleFontSizeChange,
    handleCabecaColorChange,
    handleRetrancaColorChange,
    handleTipoMaterialColorChange
  } = useTeleprompterWindowState();

  // Setup keyboard controls with scroll position sync
  useTeleprompterKeyboardControls({
    blocks,
    contentRef,
    isPlaying,
    onPlayPause: handlePlayPause,
    fontSize,
    setScrollPosition,
    pauseAutoScroll: () => setIsPlaying(false),
    resumeAutoScroll: () => setIsPlaying(true)
  });

  // Setup all effects
  useTeleprompterWindowEffects({
    isLoading,
    setIsLoading,
    setBlocks,
    setTelejornal,
    hasReceivedDataRef,
    setIsFullscreen,
    isPlaying,
    setIsPlaying,
    speed,
    setScrollPosition,
    intervalRef,
    contentRef,
    scrollPosition,
    animationFrameRef,
    lastTimeRef
  });

  // Focus on specific materia functionality
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TELEPROMPTER_FOCUS_MATERIA') {
        const materiaId = event.data.materiaId;
        console.log("Teleprompter received focus message for materia:", materiaId);
        
        if (!contentRef.current) {
          console.error("Content ref not available");
          return;
        }

        console.log("Searching for retranca with data-retranca-id:", materiaId);
        const retrancaElement = contentRef.current.querySelector(`[data-retranca-id="${materiaId}"]`);
        
        if (retrancaElement) {
          console.log("Found retranca element, scrolling to it:", retrancaElement);
          
          retrancaElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
          
          console.log("Scrolled to retranca successfully");
        } else {
          console.error("Retranca element not found with ID:", materiaId);
          console.log("Available retranca elements:", 
            Array.from(contentRef.current.querySelectorAll('[data-retranca-id]'))
              .map(el => el.getAttribute('data-retranca-id'))
          );
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [contentRef]);

  // Show loading only for a brief moment initially
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-xl font-bold mb-2">Carregando Teleprompter...</div>
          <div className="text-gray-600">Aguarde um momento</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white" style={{ width: '100vw', maxWidth: '100vw', overflow: 'hidden' }}>
      <TeleprompterWindowHeader 
        telejornalName={telejornal?.nome}
        isFullscreen={isFullscreen}
        isLoading={isLoading}
      />
      
      <TeleprompterWindowControls
        isFullscreen={isFullscreen}
        isPlaying={isPlaying}
        speed={speed}
        fontSize={fontSize}
        blocks={blocks}
        telejornal={telejornal}
        cabecaColor={cabecaColor}
        retrancaColor={retrancaColor}
        tipoMaterialColor={tipoMaterialColor}
        onPlayPause={handlePlayPause}
        onSpeedChange={handleSpeedChange}
        onReset={resetPosition}
        onIncreaseFontSize={increaseFontSize}
        onDecreaseFontSize={decreaseFontSize}
        onFontSizeChange={handleFontSizeChange}
        onCabecaColorChange={handleCabecaColorChange}
        onRetrancaColorChange={handleRetrancaColorChange}
        onTipoMaterialColorChange={handleTipoMaterialColorChange}
        onClose={() => window.close()}
        isMobile={isMobile}
      />

      {/* Teleprompter Content */}
      <div className="flex-1 overflow-hidden" style={{ width: '100%', maxWidth: '100%' }}>
        <TeleprompterContent
          ref={contentRef}
          blocks={blocks}
          fontSize={fontSize}
          cabecaColor={cabecaColor}
          retrancaColor={retrancaColor}
          tipoMaterialColor={tipoMaterialColor}
          isMobile={isMobile}
        />
      </div>
      
      {/* Mobile touch controls overlay */}
      {isMobile && !isFullscreen && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-10 text-center">
          <div>Toque na tela: Play/Pause</div>
          <div>Deslize: Navegar</div>
        </div>
      )}

      {/* Desktop keyboard controls info overlay */}
      {!isMobile && !isFullscreen && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <div>← → Navegar retrancas</div>
          <div>Espaço: Play/Pause</div>
        </div>
      )}
    </div>
  );
};

export default TeleprompterWindow;
