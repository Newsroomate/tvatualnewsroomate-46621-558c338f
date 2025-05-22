
import { enableRealtimeForTable } from "@/integrations/supabase/enableRealtime";

/**
 * Initialize Supabase realtime functionality for required tables
 */
export async function initializeRealtimeSubscriptions() {
  try {
    console.log("Initializing realtime subscriptions...");
    
    // Enable realtime for materias table which is crucial for drag-and-drop updates
    await enableRealtimeForTable("materias");
    
    // Also enable realtime for blocos table to detect block changes
    await enableRealtimeForTable("blocos");
    
    console.log("Realtime subscriptions initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize realtime subscriptions:", error);
    return false;
  }
}
