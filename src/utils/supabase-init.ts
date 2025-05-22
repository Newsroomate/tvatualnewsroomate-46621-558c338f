
import { enableRealtimeForTable } from "@/integrations/supabase/enableRealtime";
import { toast } from "@/hooks/use-toast";

// Maximum retry count for initialization attempts
const MAX_INIT_RETRIES = 3;

/**
 * Initialize Supabase realtime functionality for required tables
 * with enhanced error handling and multiple retry mechanisms
 */
export async function initializeRealtimeSubscriptions() {
  let retryCount = 0;
  
  const initTables = async () => {
    try {
      console.log("Initializing realtime subscriptions...");
      
      // Enable realtime for materias table which is crucial for drag-and-drop updates
      await enableRealtimeForTable("materias");
      console.log("Realtime enabled for materias table");
      
      // Also enable realtime for blocos table to detect block changes
      await enableRealtimeForTable("blocos");
      console.log("Realtime enabled for blocos table");
      
      console.log("Realtime subscriptions initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize realtime subscriptions:", error);
      
      if (retryCount < MAX_INIT_RETRIES) {
        retryCount++;
        console.log(`Retrying realtime subscription initialization (${retryCount}/${MAX_INIT_RETRIES})...`);
        // Exponential backoff for retries (1s, 2s, 4s)
        const backoffTime = Math.pow(2, retryCount - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return await initTables();
      } else {
        console.error("Retry limit reached, giving up on realtime initialization");
        
        // Try one last specialized attempt for the most critical table
        try {
          console.log("Making final attempt to enable realtime for materias table only");
          await enableRealtimeForTable("materias");
          console.log("Final attempt successful for materias table");
          
          // Display warning toast since we only got partial initialization
          toast({
            title: "Conectividade parcial",
            description: "Algumas funções de tempo real podem ter funcionalidade limitada",
            variant: "warning"
          });
          
          return true;
        } catch (finalError) {
          console.error("Final retry attempt failed:", finalError);
          
          // Inform user of potential update issues
          toast({
            title: "Problema de conectividade",
            description: "Algumas atualizações podem exigir o recarregamento da página",
            variant: "destructive"
          });
          
          return false;
        }
      }
    }
  };
  
  return await initTables();
}
