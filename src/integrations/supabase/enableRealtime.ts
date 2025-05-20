
import { supabase } from './client';

// Esta função habilita o Realtime para uma tabela específica
export const enableRealtimeForTable = async (tableName: string) => {
  try {
    // Using the more generic rpc call with explicit typing to avoid type errors
    await supabase.rpc('enable_realtime_for_table', { table_name: tableName } as any);
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
