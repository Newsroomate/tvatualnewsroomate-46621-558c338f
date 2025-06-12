
import { TeleprompterContent } from "@/components/news-schedule/teleprompter/TeleprompterContent";
import { TeleprompterWindowHeader } from "@/components/news-schedule/teleprompter/TeleprompterWindowHeader";
import { TeleprompterWindowControls } from "@/components/news-schedule/teleprompter/TeleprompterWindowControls";
import { useTeleprompterWindowState } from "@/hooks/useTeleprompterWindowState";
import { useTeleprompterWindowEffects } from "@/hooks/useTeleprompterWindowEffects";
import { useTeleprompterKeyboardControls } from "@/hooks/useTeleprompterKeyboardControls";

const TeleprompterWindow = () => {
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
    
    // Refs
    contentRef,
    intervalRef,
    hasReceivedDataRef,
    
    // Handlers
    handlePlayPause,
    handleSpeedChange,
    resetPosition,
    increaseFontSize,
    decreaseFontSize,
    handleFontSizeChange,
    handleCabecaColorChange,
    handleRetrancaColorChange
  } = useTeleprompterWindowState();

  // Setup keyboard controls with scroll position sync
  useTeleprompterKeyboardControls({
    blocks,
    contentRef,
    isPlaying,
    onPlayPause: handlePlayPause,
    fontSize,
    setScrollPosition
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
    scrollPosition
  });

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
        onPlayPause={handlePlayPause}
        onSpeedChange={handleSpeedChange}
        onReset={resetPosition}
        onIncreaseFontSize={increaseFontSize}
        onDecreaseFontSize={decreaseFontSize}
        onFontSizeChange={handleFontSizeChange}
        onCabecaColorChange={handleCabecaColorChange}
        onRetrancaColorChange={handleRetrancaColorChange}
        onClose={() => window.close()}
      />

      {/* Teleprompter Content */}
      <div className="flex-1 overflow-hidden" style={{ width: '100%', maxWidth: '100%' }}>
        <TeleprompterContent
          ref={contentRef}
          blocks={blocks}
          fontSize={fontSize}
          cabecaColor={cabecaColor}
          retrancaColor={retrancaColor}
        />
      </div>
      
      {/* Keyboard controls info overlay - only visible when not fullscreen */}
      {!isFullscreen && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <div>← → Navegar retrancas</div>
          <div>Espaço: Play/Pause</div>
        </div>
      )}
    </div>
  );
};

export default TeleprompterWindow;
