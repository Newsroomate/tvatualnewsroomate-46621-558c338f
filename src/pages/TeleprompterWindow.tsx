
import { TeleprompterContent } from "@/components/news-schedule/teleprompter/TeleprompterContent";
import { TeleprompterWindowHeader } from "@/components/news-schedule/teleprompter/TeleprompterWindowHeader";
import { TeleprompterWindowControls } from "@/components/news-schedule/teleprompter/TeleprompterWindowControls";
import { useTeleprompterWindowState } from "@/hooks/useTeleprompterWindowState";
import { useTeleprompterWindowEffects } from "@/hooks/useTeleprompterWindowEffects";

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
    handleFontSizeChange
  } = useTeleprompterWindowState();

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
    <div className="h-screen flex flex-col bg-white">
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
        onPlayPause={handlePlayPause}
        onSpeedChange={handleSpeedChange}
        onReset={resetPosition}
        onIncreaseFontSize={increaseFontSize}
        onDecreaseFontSize={decreaseFontSize}
        onFontSizeChange={handleFontSizeChange}
        onClose={() => window.close()}
      />

      {/* Teleprompter Content */}
      <div className="flex-1 overflow-hidden">
        <TeleprompterContent
          ref={contentRef}
          blocks={blocks}
          fontSize={fontSize}
        />
      </div>
    </div>
  );
};

export default TeleprompterWindow;
