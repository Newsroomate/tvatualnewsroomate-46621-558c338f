
import { supabase } from "./client";

// Define an interface for the parameters that matches the exact parameter name expected by the RPC
interface EnableRealtimeParams {
  table_name: string;
}

// This function enables real-time updates for a specific table
export const enableRealtimeForTable = async (table: string) => {
  try {
    // Use the correct parameter name that matches the RPC function's expected parameter
    const { data, error } = await supabase.rpc('enable_realtime_for_table', {
      table_name: table
    } as EnableRealtimeParams);

    if (error) {
      console.error('Error enabling realtime:', error);
      return false;
    }

    return data;
  } catch (err) {
    console.error('Failed to enable realtime:', err);
    return false;
  }
};
