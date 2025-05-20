
import { supabase } from './client';

// Define a type for the RPC function parameters
interface EnableRealtimeParams {
  table_name: string;
}

// Esta função habilita o Realtime para uma tabela específica
export const enableRealtimeForTable = async (tableName: string) => {
  try {
    // Using a properly typed RPC call to enable Realtime for a specific table
    await supabase.rpc('enable_realtime_for_table', { table_name: tableName } as EnableRealtimeParams);
    console.log(`Realtime habilitado para a tabela ${tableName}`);
    return true;
  } catch (error) {
    console.error(`Erro ao habilitar realtime para a tabela ${tableName}:`, error);
    return false;
  }
};

// Esta função configura o realtime para as tabelas principais usadas no aplicativo
export const setupRealtime = async () => {
  // Habilitamos o realtime para a tabela de telejornais para receber atualizações em tempo real
  await enableRealtimeForTable('telejornais');
};
