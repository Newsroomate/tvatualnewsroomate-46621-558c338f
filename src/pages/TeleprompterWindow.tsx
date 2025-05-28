
import { useState, useEffect, useRef } from "react";
import { TeleprompterControls } from "@/components/news-schedule/teleprompter/TeleprompterControls";
import { TeleprompterViewControls } from "@/components/news-schedule/teleprompter/TeleprompterViewControls";
import { TeleprompterExport } from "@/components/news-schedule/teleprompter/TeleprompterExport";
import { TeleprompterContent } from "@/components/news-schedule/teleprompter/TeleprompterContent";
import { Materia, Telejornal, Bloco } from "@/types";

const TeleprompterWindow = () => {
  const [blocks, setBlocks] = useState<(Bloco & { items: Materia[] })[]>([]);
  const [telejornal, setTelejornal] = useState<Telejornal | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([50]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [fontSize, setFontSize] = useState(24);
  const contentRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for data from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log("Teleprompter window received message:", event.data);
      
      if (event.data.type === 'TELEPROMPTER_DATA') {
        setBlocks(event.data.blocks || []);
        setTelejornal(event.data.telejornal || null);
        console.log("Updated teleprompter data:", {
          blocks: event.data.blocks,
          telejornal: event.data.telejornal
        });
      }
      if (event.data.type === 'TELEPROMPTER_UPDATE') {
        setBlocks(event.data.blocks || []);
        console.log("Updated teleprompter blocks:", event.data.blocks);
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

  // Auto-scroll logic melhorado
  useEffect(() => {
    if (isPlaying && contentRef.current) {
      const scrollSpeed = speed[0] / 10; // Convert speed to pixels per interval
      
      intervalRef.current = setInterval(() => {
        setScrollPosition(prev => {
          const contentElement = contentRef.current;
          if (!contentElement) return prev;
          
          const maxScroll = contentElement.scrollHeight - contentElement.clientHeight;
          const newPosition = prev + scrollSpeed;
          
          console.log("Scroll update:", {
            currentPosition: prev,
            newPosition,
            maxScroll,
            scrollHeight: contentElement.scrollHeight,
            clientHeight: contentElement.clientHeight
          });
          
          if (newPosition >= maxScroll) {
            console.log("Reached end of content, stopping playback");
            setIsPlaying(false);
            return prev; // Stay at current position when reaching end
          }
          
          return newPosition;
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, speed]);

  // Apply scroll position
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const handlePlayPause = () => {
    console.log("Play/Pause toggled:", !isPlaying);
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (value: number[]) => {
    console.log("Speed changed to:", value[0]);
    setSpeed(value);
  };

  const resetPosition = () => {
    console.log("Resetting position to top");
    setScrollPosition(0);
    setIsPlaying(false);
  };

  const increaseFontSize = () => {
    setFontSize(prev => {
      const newSize = Math.min(prev + 2, 48);
      console.log("Font size increased to:", newSize);
      return newSize;
    });
  };

  const decreaseFontSize = () => {
    setFontSize(prev => {
      const newSize = Math.max(prev - 2, 12);
      console.log("Font size decreased to:", newSize);
      return newSize;
    });
  };

  // Get all materias for export functionality
  const allMaterias = blocks.flatMap(block => block.items);

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
          fontSize={fontSize}
          onIncreaseFontSize={increaseFontSize}
          onDecreaseFontSize={decreaseFontSize}
        />

        <TeleprompterExport
          materias={allMaterias}
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
