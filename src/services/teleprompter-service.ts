import { Materia, Telejornal, Bloco } from "@/types";

export interface TeleprompterData {
  blocks: (Bloco & { items: Materia[] })[];
  telejornal: Telejornal | null;
}

export interface TeleprompterMessage {
  type: 'TELEPROMPTER_DATA' | 'TELEPROMPTER_UPDATE' | 'TELEPROMPTER_READY' | 'TELEPROMPTER_FOCUS_MATERIA' | 'TELEPROMPTER_HEARTBEAT';
  blocks?: (Bloco & { items: Materia[] })[];
  telejornal?: Telejornal | null;
  materiaId?: string;
  timestamp?: number;
}

class TeleprompterService {
  private windowRef: Window | null = null;
  private retryAttempts = 0;
  private maxRetries = 15;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isWindowReady = false;
  private pendingData: TeleprompterData | null = null;

  public openWindow(data: TeleprompterData): Promise<boolean> {
    return new Promise((resolve, reject) => {
      console.log("TeleprompterService: Opening window with data:", data);
      
      // Prepare ordered data
      const orderedData = this.prepareOrderedData(data);
      this.pendingData = orderedData;
      
      if (this.windowRef && !this.windowRef.closed) {
        console.log("TeleprompterService: Focusing existing window");
        this.windowRef.focus();
        this.sendData(orderedData);
        resolve(true);
        return;
      }

      // Open new window
      const telejornalParam = data.telejornal?.nome ? `?jornal=${encodeURIComponent(data.telejornal.nome)}` : '';
      const newWindow = window.open(`/teleprompter${telejornalParam}`, '_blank');

      if (!newWindow) {
        const error = "Pop-up bloqueado. Permita pop-ups para este site.";
        console.error("TeleprompterService:", error);
        reject(new Error(error));
        return;
      }

      this.windowRef = newWindow;
      this.retryAttempts = 0;
      this.isWindowReady = false;

      // Start connection process with exponential backoff
      this.waitForWindowReady()
        .then(() => {
          console.log("TeleprompterService: Window ready, sending data");
          this.sendData(orderedData);
          this.startHeartbeat();
          resolve(true);
        })
        .catch((error) => {
          console.error("TeleprompterService: Window ready timeout:", error);
          reject(error);
        });
    });
  }

  public updateData(blocks: (Bloco & { items: Materia[] })[]): boolean {
    if (!this.isWindowReady || !this.windowRef || this.windowRef.closed) {
      console.warn("TeleprompterService: Cannot update - window not ready");
      return false;
    }

    const orderedBlocks = this.prepareOrderedBlocks(blocks);
    
    try {
      this.windowRef.postMessage({
        type: 'TELEPROMPTER_UPDATE',
        blocks: orderedBlocks,
        timestamp: Date.now()
      } as TeleprompterMessage, '*');
      
      console.log("TeleprompterService: Data updated successfully");
      return true;
    } catch (error) {
      console.error("TeleprompterService: Error updating data:", error);
      return false;
    }
  }

  public focusOnMateria(materiaId: string): boolean {
    if (!this.isWindowReady || !this.windowRef || this.windowRef.closed) {
      console.warn("TeleprompterService: Cannot focus - window not ready");
      return false;
    }

    try {
      this.windowRef.postMessage({
        type: 'TELEPROMPTER_FOCUS_MATERIA',
        materiaId,
        timestamp: Date.now()
      } as TeleprompterMessage, '*');
      
      this.windowRef.focus();
      console.log("TeleprompterService: Focus message sent successfully");
      return true;
    } catch (error) {
      console.error("TeleprompterService: Error focusing on materia:", error);
      return false;
    }
  }

  public closeWindow(): void {
    if (this.windowRef && !this.windowRef.closed) {
      this.windowRef.close();
    }
    this.cleanup();
  }

  public isOpen(): boolean {
    return !!(this.windowRef && !this.windowRef.closed && this.isWindowReady);
  }

  public openSingleMateria(materia: Materia, telejornal: Telejornal | null): Promise<boolean> {
    console.log("TeleprompterService: Opening single materia", { materiaId: materia.id, retranca: materia.retranca });
    
    // Create a single block with only this materia
    const singleBlock: Bloco & { items: Materia[] } = {
      id: `single-${materia.id}`,
      nome: materia.retranca || 'Matéria Individual',
      ordem: 1,
      telejornal_id: telejornal?.id || '',
      items: [materia]
    };

    const data: TeleprompterData = {
      blocks: [singleBlock],
      telejornal
    };

    return this.openWindow(data);
  }

  public setupMessageListener(onReady?: () => void): () => void {
    const handleMessage = (event: MessageEvent<TeleprompterMessage>) => {
      if (event.data.type === 'TELEPROMPTER_READY') {
        console.log("TeleprompterService: Received ready signal");
        this.isWindowReady = true;
        
        if (this.pendingData) {
          this.sendData(this.pendingData);
          this.pendingData = null;
        }
        
        if (onReady) onReady();
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }

  private prepareOrderedData(data: TeleprompterData): TeleprompterData {
    const sortedBlocks = [...data.blocks].sort((a, b) => a.ordem - b.ordem);
    return {
      blocks: sortedBlocks.map(block => ({
        ...block,
        items: [...block.items].sort((a, b) => a.ordem - b.ordem)
      })),
      telejornal: data.telejornal
    };
  }

  private prepareOrderedBlocks(blocks: (Bloco & { items: Materia[] })[]): (Bloco & { items: Materia[] })[] {
    const sortedBlocks = [...blocks].sort((a, b) => a.ordem - b.ordem);
    return sortedBlocks.map(block => ({
      ...block,
      items: [...block.items].sort((a, b) => a.ordem - b.ordem)
    }));
  }

  private waitForWindowReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkReady = () => {
        if (!this.windowRef || this.windowRef.closed) {
          reject(new Error("Window was closed"));
          return;
        }

        if (this.isWindowReady) {
          resolve();
          return;
        }

        if (this.retryAttempts >= this.maxRetries) {
          reject(new Error("Timeout waiting for window to be ready"));
          return;
        }

        // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms, then 1000ms
        const delay = Math.min(50 * Math.pow(2, this.retryAttempts), 1000);
        this.retryAttempts++;

        setTimeout(checkReady, delay);
      };

      // Start checking immediately
      setTimeout(checkReady, 100);
    });
  }

  private sendData(data: TeleprompterData): void {
    if (!this.windowRef || this.windowRef.closed) {
      console.error("TeleprompterService: Cannot send data - no window");
      return;
    }

    try {
      this.windowRef.postMessage({
        type: 'TELEPROMPTER_DATA',
        blocks: data.blocks,
        telejornal: data.telejornal,
        timestamp: Date.now()
      } as TeleprompterMessage, '*');
      
      console.log("TeleprompterService: Data sent successfully");
    } catch (error) {
      console.error("TeleprompterService: Error sending data:", error);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (!this.windowRef || this.windowRef.closed) {
        console.log("TeleprompterService: Window closed, stopping heartbeat");
        this.cleanup();
        return;
      }

      try {
        this.windowRef.postMessage({
          type: 'TELEPROMPTER_HEARTBEAT',
          timestamp: Date.now()
        } as TeleprompterMessage, '*');
      } catch (error) {
        console.error("TeleprompterService: Heartbeat failed:", error);
        this.cleanup();
      }
    }, 5000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private cleanup(): void {
    this.windowRef = null;
    this.isWindowReady = false;
    this.pendingData = null;
    this.retryAttempts = 0;
    this.stopHeartbeat();
  }
}

export const teleprompterService = new TeleprompterService();