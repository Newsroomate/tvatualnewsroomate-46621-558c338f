import { useState, useRef } from "react";
import { Materia, Telejornal, Bloco } from "@/types";

export interface TeleprompterState {
  // Data
  blocks: (Bloco & { items: Materia[] })[];
  telejornal: Telejornal | null;
  
  // Loading and connection
  isLoading: boolean;
  isConnected: boolean;
  
  // Playback
  isPlaying: boolean;
  speed: number[];
  
  // Position and navigation
  scrollPosition: number;
  isNavigating: boolean;
  
  // Display
  fontSize: number;
  isFullscreen: boolean;
  
  // Colors
  cabecaColor: string;
  retrancaColor: string;
  tipoMaterialColor: string;
}

export const useTeleprompterState = () => {
  // Data state
  const [blocks, setBlocks] = useState<(Bloco & { items: Materia[] })[]>([]);
  const [telejornal, setTelejornal] = useState<Telejornal | null>(null);
  
  // Connection state
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState([50]);
  
  // Position and navigation state
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Display state
  const [fontSize, setFontSize] = useState(24);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Color state
  const [cabecaColor, setCabecaColor] = useState("#ffffff");
  const [retrancaColor, setRetrancaColor] = useState("#facc15");
  const [tipoMaterialColor, setTipoMaterialColor] = useState("#f97316");
  
  // Refs for DOM and timing
  const contentRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const hasReceivedDataRef = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handlers
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

  const handleCabecaColorChange = (color: string) => {
    setCabecaColor(color);
    console.log("Cabeça color changed to:", color);
  };

  const handleRetrancaColorChange = (color: string) => {
    setRetrancaColor(color);
    console.log("Retranca color changed to:", color);
  };

  const handleTipoMaterialColorChange = (color: string) => {
    setTipoMaterialColor(color);
    console.log("Tipo Material color changed to:", color);
  };

  const pauseAutoScroll = () => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    setIsNavigating(true);
    console.log("Auto-scroll paused for navigation");
  };

  const resumeAutoScroll = () => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    navigationTimeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
      console.log("Auto-scroll resumed after navigation");
    }, 2000);
  };

  return {
    // State
    blocks,
    setBlocks,
    telejornal,
    setTelejornal,
    isLoading,
    setIsLoading,
    isConnected,
    setIsConnected,
    isPlaying,
    setIsPlaying,
    speed,
    fontSize,
    scrollPosition,
    setScrollPosition,
    isNavigating,
    setIsNavigating,
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
    navigationTimeoutRef,
    
    // Handlers
    handlePlayPause,
    handleSpeedChange,
    resetPosition,
    increaseFontSize,
    decreaseFontSize,
    handleFontSizeChange,
    handleCabecaColorChange,
    handleRetrancaColorChange,
    handleTipoMaterialColorChange,
    pauseAutoScroll,
    resumeAutoScroll
  };
};