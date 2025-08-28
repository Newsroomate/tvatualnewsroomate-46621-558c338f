
import { useState, useEffect, useRef } from "react";
import { Materia, Telejornal, Bloco } from "@/types";

interface TeleprompterData {
  blocks: (Bloco & { items: Materia[] })[];
  telejornal: Telejornal | null;
}

export const useTeleprompterWindow = () => {
  const [isOpen, setIsOpen] = useState(false);
  const windowRef = useRef<Window | null>(null);
  const dataToSendRef = useRef<TeleprompterData | null>(null);

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
    
    // Store data to send
    dataToSendRef.current = orderedData;
    
    if (windowRef.current && !windowRef.current.closed) {
      // Tab already exists, just focus it and update data
      windowRef.current.focus();
      
      // Send data immediately since window is already loaded
      try {
        windowRef.current.postMessage({
          type: 'TELEPROMPTER_DATA',
          ...orderedData
        }, '*');
        console.log("Data sent to existing teleprompter window");
      } catch (error) {
        console.error("Error sending data to existing window:", error);
      }
      return;
    }

    // Open new tab
    const newTab = window.open('/teleprompter', '_blank');

    if (newTab) {
      windowRef.current = newTab;
      setIsOpen(true);

      // Wait for the window to load and then send data
      const sendDataWhenReady = () => {
        if (newTab.closed) {
          setIsOpen(false);
          windowRef.current = null;
          dataToSendRef.current = null;
          return;
        }

        try {
          // Check if window is ready by trying to access its location
          if (newTab.location.href.includes('/teleprompter')) {
            newTab.postMessage({
              type: 'TELEPROMPTER_DATA',
              ...orderedData
            }, '*');
            console.log("Data sent to new teleprompter window");
            dataToSendRef.current = null; // Clear after sending
          } else {
            // Window not ready yet, try again
            setTimeout(sendDataWhenReady, 200);
          }
        } catch (error) {
          // Cross-origin error means window is still loading, try again
          setTimeout(sendDataWhenReady, 200);
        }
      };

      // Start checking after a short delay
      setTimeout(sendDataWhenReady, 500);
    } else {
      // Popup blocked - fallback to alert
      alert('O teleprompter não pôde ser aberto. Verifique se o bloqueador de pop-ups está ativo e permita pop-ups para este site.');
      dataToSendRef.current = null;
    }
  };

  const focusOnMateria = (materiaId: string) => {
    if (windowRef.current && !windowRef.current.closed) {
      console.log("Focusing on materia:", materiaId);
      
      try {
        windowRef.current.postMessage({
          type: 'TELEPROMPTER_FOCUS_MATERIA',
          materiaId
        }, '*');
      } catch (error) {
        console.error("Error focusing on materia in teleprompter:", error);
      }
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

      try {
        windowRef.current.postMessage({
          type: 'TELEPROMPTER_UPDATE',
          blocks: orderedBlocks
        }, '*');
      } catch (error) {
        console.error("Error updating teleprompter data:", error);
      }
    }
  };

  const closeTeleprompter = () => {
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close();
    }
    setIsOpen(false);
    windowRef.current = null;
    dataToSendRef.current = null;
  };

  // Listen for messages from teleprompter window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TELEPROMPTER_READY' && windowRef.current && dataToSendRef.current) {
        // Window is ready and we have data to send
        console.log("Teleprompter window is ready, sending data immediately");
        
        try {
          windowRef.current.postMessage({
            type: 'TELEPROMPTER_DATA',
            ...dataToSendRef.current
          }, '*');
          dataToSendRef.current = null; // Clear after sending
        } catch (error) {
          console.error("Error sending data on ready:", error);
        }
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
        dataToSendRef.current = null;
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [isOpen]);

  return {
    isOpen,
    openTeleprompter,
    updateTeleprompterData,
    focusOnMateria,
    closeTeleprompter
  };
};
