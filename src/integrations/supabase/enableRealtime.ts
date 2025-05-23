
import { supabase } from "./client";

// Define explicit types for the enable_realtime RPC function parameters
interface EnableRealtimeParams {
  table_name: string;
}

export const enableRealtimeForTable = async (tableName: string) => {
  try {
    // Use the any type to bypass TypeScript's type checking for the RPC function name
    // This is necessary when calling custom RPC functions that aren't in the type definitions
    await (supabase.rpc as any)('enable_realtime', { table_name: tableName } as EnableRealtimeParams);
    console.log(`Realtime enabled for table: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Failed to enable realtime for table ${tableName}:`, error);
    return false;
  }
};
