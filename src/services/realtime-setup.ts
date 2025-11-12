import { enableRealtimeForTable } from "@/integrations/supabase/enableRealtime";

// Configure realtime for all necessary tables when the module is loaded
const tablesToEnable = [
  'materias',
  'blocos', 
  'telejornais',
  'pautas',
  'pautas_telejornal',
  'espelhos_salvos',
  'modelos_salvos',
  'materias_snapshots',
  'profiles'
];

export const enableAllTables = async () => {
  console.log('Configurando realtime para todas as tabelas...');
  
  const results = await Promise.allSettled(
    tablesToEnable.map(tableName => enableRealtimeForTable(tableName))
  );
  
  results.forEach((result, index) => {
    const tableName = tablesToEnable[index];
    if (result.status === 'fulfilled' && result.value) {
      console.log(`✓ Realtime habilitado para ${tableName}`);
    } else {
      console.warn(`✗ Falha ao habilitar realtime para ${tableName}:`, 
        result.status === 'rejected' ? result.reason : 'Unknown error');
    }
  });
};