import { supabase } from '@/integrations/supabase/client';

const MOS_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mos-gateway`;

async function callMosGateway(body: Record<string, any>): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Usuário não autenticado');
  }

  const response = await fetch(MOS_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro no gateway MOS');
  }

  return response.text();
}

export const exportMosRoList = async (telejornalId: string): Promise<string> => {
  return callMosGateway({
    action: 'roList',
    telejornal_id: telejornalId
  });
};

export const sendRoElementStat = async (
  telejornalId: string, 
  elementId: string, 
  status: string
): Promise<string> => {
  return callMosGateway({
    action: 'roElementStat',
    telejornal_id: telejornalId,
    element_id: elementId,
    status
  });
};

/**
 * Download MOS XML as a file
 */
export const downloadMosXml = async (telejornalId: string, telejornalNome: string): Promise<void> => {
  const xml = await exportMosRoList(telejornalId);
  
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MOS_${telejornalNome.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
