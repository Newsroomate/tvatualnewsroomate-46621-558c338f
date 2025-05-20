import { supabase } from "./client";

// Define the interface for the enableRealtime function parameter
interface EnableRealtimeParams {
  table_name: string;
}

export const enableRealtimeForTable = async (tableName: string) => {
  try {
    await supabase.rpc('enable_realtime', { table_name: tableName } as EnableRealtimeParams);
    console.log(`Realtime enabled for table: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Failed to enable realtime for table ${tableName}:`, error);
    return false;
  }
};
