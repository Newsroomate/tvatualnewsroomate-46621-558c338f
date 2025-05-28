
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Materia, Telejornal, Bloco } from "@/types";
import { TeleprompterControls } from "./teleprompter/TeleprompterControls";
import { TeleprompterViewControls } from "./teleprompter/TeleprompterViewControls";
import { TeleprompterExport } from "./teleprompter/TeleprompterExport";
import { TeleprompterContent } from "./teleprompter/TeleprompterContent";

interface TeleprompterProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: (Bloco & { items: Materia[] })[];
  telejornal: Telejornal | null;
}

export const Teleprompter = ({ isOpen, onClose, blocks, telejornal }: TeleprompterProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([50]); // Speed from 1 to 100
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);
  const [fontSize, setFontSize] = useState(24); // Default font size in pixels
  const contentRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying && contentRef.current) {
      const scrollSpeed = speed[0] / 10; // Convert speed to pixels per interval
      
      intervalRef.current = setInterval(() => {
        setScrollPosition(prev => {
          const newPosition = prev + scrollSpeed;
          const maxScroll = contentRef.current?.scrollHeight || 0;
          
          if (newPosition >= maxScroll) {
            setIsPlaying(false);
            return 0; // Reset to top when reaching end
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

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = scrollPosition;
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

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 48)); // Max font size 48px
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12)); // Min font size 12px
  };

  // Get all materias for export functionality
  const allMaterias = blocks.flatMap(block => block.items);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMaximized ? 'max-w-[100vw] h-[100vh] w-[100vw] m-0' : 'max-w-4xl h-[80vh]'} flex flex-col transition-all duration-300`}>
        <DialogHeader>
          <DialogTitle>
            Teleprompter - {telejornal?.nome || "Telejornal"}
          </DialogTitle>
        </DialogHeader>
        
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
            isMaximized={isMaximized}
            fontSize={fontSize}
            onToggleMaximize={toggleMaximize}
            onIncreaseFontSize={increaseFontSize}
            onDecreaseFontSize={decreaseFontSize}
          />

          <TeleprompterExport
            materias={allMaterias}
            telejornal={telejornal}
          />
        </div>

        {/* Teleprompter Content */}
        <TeleprompterContent
          ref={contentRef}
          blocks={blocks}
          fontSize={fontSize}
        />
      </DialogContent>
    </Dialog>
  );
};
