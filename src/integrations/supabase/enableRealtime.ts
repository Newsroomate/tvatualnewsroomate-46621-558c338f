
import { supabase } from "./client";

// Define explicit types for the enable_realtime RPC function
interface EnableRealtimeParams {
  table_name: string;
}

export const enableRealtimeForTable = async (tableName: string) => {
  try {
    await supabase.rpc<null, EnableRealtimeParams>('enable_realtime', { table_name: tableName });
    console.log(`Realtime enabled for table: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Failed to enable realtime for table ${tableName}:`, error);
    return false;
  }
};
