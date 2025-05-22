
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
    
    // Use supabase.rpc instead of supabase.query for setting replica identity
    try {
      // Using raw SQL query through rpc
      const { error } = await supabase.rpc('execute_sql', {
        sql_query: `ALTER TABLE "${tableName}" REPLICA IDENTITY FULL;`
      });
      
      if (error) {
        console.error(`Error setting REPLICA IDENTITY FULL for ${tableName}:`, error);
      } else {
        console.log(`REPLICA IDENTITY FULL set for table: ${tableName}`);
      }
    } catch (sqlError) {
      console.error(`Failed to set REPLICA IDENTITY FULL for ${tableName}:`, sqlError);
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to enable realtime for table ${tableName}:`, error);
    return false;
  }
};
