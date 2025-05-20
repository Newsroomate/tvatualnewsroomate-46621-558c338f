
import { supabase } from "./client";

// Define a type for the parameters of the enable_realtime RPC function
type EnableRealtimeParams = {
  table_name: string;
};

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
