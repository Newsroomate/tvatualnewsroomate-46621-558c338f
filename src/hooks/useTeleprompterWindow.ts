
import { useState, useEffect, useRef } from "react";
import { Materia, Telejornal, Bloco } from "@/types";

interface TeleprompterData {
  blocks: (Bloco & { items: Materia[] })[];
  telejornal: Telejornal | null;
}

export const useTeleprompterWindow = () => {
  const [isOpen, setIsOpen] = useState(false);
  const windowRef = useRef<Window | null>(null);

  const openTeleprompter = (blocks: (Bloco & { items: Materia[] })[], telejornal: Telejornal | null) => {
    console.log("Opening teleprompter with blocks:", blocks);
    
    // Prepare ordered data for teleprompter
    const sortedBlocks = [...blocks].sort((a, b) => a.ordem - b.ordem);
    const orderedData = {
      blocks: sortedBlocks.map(block => ({
        ...block,
        items: [...block.items].sort((a, b) => a.ordem - b.ordem)
      })),
      telejornal
    };

    console.log("Ordered data for teleprompter:", orderedData);
    
    if (windowRef.current && !windowRef.current.closed) {
      // Tab already exists, just focus it and update data
      windowRef.current.focus();
      windowRef.current.postMessage({
        type: 'TELEPROMPTER_DATA',
        ...orderedData
      }, '*');
      return;
    }

    // Open new tab (no window configuration parameters)
    const newTab = window.open('/teleprompter', '_blank');

    if (newTab) {
      windowRef.current = newTab;
      setIsOpen(true);

      // Wait for tab to load then send data
      const checkReady = () => {
        if (newTab.closed) {
          setIsOpen(false);
          windowRef.current = null;
          return;
        }

        try {
          newTab.postMessage({
            type: 'TELEPROMPTER_DATA',
            ...orderedData
          }, '*');
        } catch (error) {
          // Tab might not be ready yet, try again
          setTimeout(checkReady, 100);
        }
      };

      setTimeout(checkReady, 500);
    } else {
      // Popup blocked - fallback to alert
      alert('O teleprompter não pôde ser aberto. Verifique se o bloqueador de pop-ups está ativo e permita pop-ups para este site.');
    }
  };

  const updateTeleprompterData = (blocks: (Bloco & { items: Materia[] })[]) => {
    if (windowRef.current && !windowRef.current.closed) {
      console.log("Updating teleprompter with blocks:", blocks);
      
      // Prepare ordered data for update
      const sortedBlocks = [...blocks].sort((a, b) => a.ordem - b.ordem);
      const orderedBlocks = sortedBlocks.map(block => ({
        ...block,
        items: [...block.items].sort((a, b) => a.ordem - b.ordem)
      }));

      windowRef.current.postMessage({
        type: 'TELEPROMPTER_UPDATE',
        blocks: orderedBlocks
      }, '*');
    }
  };

  const closeTeleprompter = () => {
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close();
    }
    setIsOpen(false);
    windowRef.current = null;
  };

  // Listen for messages from teleprompter window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TELEPROMPTER_READY' && windowRef.current) {
        // Window is ready, we can send data now
        console.log("Teleprompter window is ready");
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Check if window is closed periodically
  useEffect(() => {
    if (!isOpen) return;

    const checkInterval = setInterval(() => {
      if (windowRef.current?.closed) {
        setIsOpen(false);
        windowRef.current = null;
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [isOpen]);

  return {
    isOpen,
    openTeleprompter,
    updateTeleprompterData,
    closeTeleprompter
  };
};
