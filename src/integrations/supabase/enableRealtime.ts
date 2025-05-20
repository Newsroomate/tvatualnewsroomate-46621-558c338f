
import { supabase } from "./client";

// Define explicit types for the enable_realtime RPC function
interface EnableRealtimeParams {
  table_name: string;
}

export const enableRealtimeForTable = async (tableName: string) => {
  try {
    // Fix the type error by using proper call signature
    // Using a type assertion since the RPC function isn't in the generated types
    await supabase.rpc('enable_realtime', { table_name: tableName } as EnableRealtimeParams);
    console.log(`Realtime enabled for table: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Failed to enable realtime for table ${tableName}:`, error);
    return false;
  }
};
