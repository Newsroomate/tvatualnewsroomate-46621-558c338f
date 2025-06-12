
import { useState, useRef } from "react";
import { Materia, Telejornal, Bloco } from "@/types";

export const useTeleprompterWindowState = () => {
  const [blocks, setBlocks] = useState<(Bloco & { items: Materia[] })[]>([]);
  const [telejornal, setTelejornal] = useState<Telejornal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([50]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [fontSize, setFontSize] = useState(24);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasReceivedDataRef = useRef(false);

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
      const newSize = Math.min(prev + 2, 200);
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

  const handleFontSizeChange = (newSize: number) => {
    const clampedSize = Math.max(12, Math.min(200, newSize));
    setFontSize(clampedSize);
    console.log("Font size manually changed to:", clampedSize);
  };

  return {
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
  };
};
