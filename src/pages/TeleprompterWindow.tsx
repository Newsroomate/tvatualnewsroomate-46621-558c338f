
import { useState, useEffect } from "react";
import { TeleprompterControls } from "@/components/news-schedule/teleprompter/TeleprompterControls";
import { TeleprompterViewControls } from "@/components/news-schedule/teleprompter/TeleprompterViewControls";
import { TeleprompterExport } from "@/components/news-schedule/teleprompter/TeleprompterExport";
import { TeleprompterContent } from "@/components/news-schedule/teleprompter/TeleprompterContent";
import { Materia, Telejornal } from "@/types";

const TeleprompterWindow = () => {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [telejornal, setTelejornal] = useState<Telejornal | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([50]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [fontSize, setFontSize] = useState(24);

  // Listen for data from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TELEPROMPTER_DATA') {
        setMaterias(event.data.materias || []);
        setTelejornal(event.data.telejornal || null);
      }
      if (event.data.type === 'TELEPROMPTER_UPDATE') {
        setMaterias(event.data.materias || []);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Request initial data from parent
    if (window.opener) {
      window.opener.postMessage({ type: 'TELEPROMPTER_READY' }, '*');
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    let intervalRef: NodeJS.Timeout | null = null;

    if (isPlaying) {
      const scrollSpeed = speed[0] / 10;
      
      intervalRef = setInterval(() => {
        setScrollPosition(prev => {
          const contentElement = document.querySelector('.teleprompter-content');
          const maxScroll = contentElement?.scrollHeight || 0;
          
          if (prev + scrollSpeed >= maxScroll) {
            setIsPlaying(false);
            return 0;
          }
          
          return prev + scrollSpeed;
        });
      }, 100);
    }

    return () => {
      if (intervalRef) {
        clearInterval(intervalRef);
      }
    };
  }, [isPlaying, speed]);

  // Apply scroll position
  useEffect(() => {
    const contentElement = document.querySelector('.teleprompter-content');
    if (contentElement) {
      contentElement.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (value: number[]) => {
    setSpeed(value);
  };

  const resetPosition = () => {
    setScrollPosition(0);
    setIsPlaying(false);
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 48));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12));
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="bg-gray-100 border-b p-4">
        <h1 className="text-xl font-bold">
          Teleprompter - {telejornal?.nome || "Carregando..."}
        </h1>
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
        <TeleprompterControls
          isPlaying={isPlaying}
          speed={speed}
          onPlayPause={handlePlayPause}
          onSpeedChange={handleSpeedChange}
          onReset={resetPosition}
        />

        <TeleprompterViewControls
          isMaximized={true}
          fontSize={fontSize}
          onToggleMaximize={() => {}} // Not needed in separate window
          onIncreaseFontSize={increaseFontSize}
          onDecreaseFontSize={decreaseFontSize}
        />

        <TeleprompterExport
          materias={materias}
          telejornal={telejornal}
        />

        <button
          onClick={() => window.close()}
          className="ml-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Fechar
        </button>
      </div>

      {/* Teleprompter Content */}
      <div className="flex-1 overflow-hidden">
        <div className="teleprompter-content h-full">
          <TeleprompterContent
            materias={materias}
            fontSize={fontSize}
          />
        </div>
      </div>
    </div>
  );
};

export default TeleprompterWindow;
