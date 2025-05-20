
import { supabase } from "./client";

// Define explicit types for the enable_realtime RPC function
interface EnableRealtimeParams {
  table_name: string;
}

export const enableRealtimeForTable = async (tableName: string) => {
  try {
    // Use a more specific type assertion to fix the type error
    await supabase.rpc('enable_realtime', { table_name: tableName } as unknown as Record<string, any>);
    console.log(`Realtime enabled for table: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Failed to enable realtime for table ${tableName}:`, error);
    return false;
  }
};
