
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
    
    if (windowRef.current && !windowRef.current.closed) {
      // Window already exists, just focus it and update data
      windowRef.current.focus();
      windowRef.current.postMessage({
        type: 'TELEPROMPTER_DATA',
        blocks,
        telejornal
      }, '*');
      return;
    }

    // Open new window
    const newWindow = window.open(
      '/teleprompter',
      'teleprompter',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );

    if (newWindow) {
      windowRef.current = newWindow;
      setIsOpen(true);

      // Wait for window to load then send data
      const checkReady = () => {
        if (newWindow.closed) {
          setIsOpen(false);
          windowRef.current = null;
          return;
        }

        try {
          newWindow.postMessage({
            type: 'TELEPROMPTER_DATA',
            blocks,
            telejornal
          }, '*');
        } catch (error) {
          // Window might not be ready yet, try again
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
      windowRef.current.postMessage({
        type: 'TELEPROMPTER_UPDATE',
        blocks
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
