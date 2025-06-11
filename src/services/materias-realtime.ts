
import { enableRealtimeForTable } from "@/integrations/supabase/enableRealtime";

// Enable realtime for materias table when the module is loaded
enableRealtimeForTable('materias')
  .then(success => {
    if (success) {
      console.log('Realtime enabled for materias table');
    } else {
      console.warn('Failed to enable realtime for materias table');
    }
  });
