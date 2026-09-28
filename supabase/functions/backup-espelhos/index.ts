import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupData {
  id: string;
  nome: string;
  telejornal_id: string;
  data_referencia: string;
  data_salvamento: string;
  estrutura: any;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

// Helper function to verify user authorization
async function verifyAuthorization(
  req: Request,
  supabase: any
): Promise<{ authorized: boolean; userId: string | null; error?: string }> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return { authorized: false, userId: null, error: 'Authorization header missing' };
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return { authorized: false, userId: null, error: 'Invalid or expired token' };
    }

    // Check if user has editor_chefe role using has_role function
    const { data: hasEditorChefeRole, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'editor_chefe'
    });

    if (roleError) {
      console.error('Role check error:', roleError);
      return { authorized: false, userId: user.id, error: 'Failed to verify permissions' };
    }

    if (hasEditorChefeRole) {
      return { authorized: true, userId: user.id };
    }

    // Also check for gerenciar_permissoes permission as fallback
    const { data: hasPermission, error: permError } = await supabase.rpc('has_permission', {
      _user_id: user.id,
      _permission: 'gerenciar_permissoes'
    });

    if (permError) {
      console.error('Permission check error:', permError);
      return { authorized: false, userId: user.id, error: 'Failed to verify permissions' };
    }

    if (hasPermission) {
      return { authorized: true, userId: user.id };
    }

    return { authorized: false, userId: user.id, error: 'Insufficient permissions. Requires editor_chefe role or gerenciar_permissoes permission.' };
  } catch (error) {
    console.error('Authorization verification error:', error);
    return { authorized: false, userId: null, error: 'Authorization verification failed' };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Verify authorization for all operations
    const { authorized, userId, error: authError } = await verifyAuthorization(req, supabase);
    
    if (!authorized) {
      console.log(`Authorization denied: ${authError}`);
      return new Response(
        JSON.stringify({ error: authError || 'Unauthorized' }),
        {
          status: authError?.includes('permissions') ? 403 : 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Authorized request from user: ${userId}`);

    // GET /list - List all backups
    if (req.method === 'GET' && path === 'backup-espelhos') {
      const { data: backups, error } = await supabase
        .from('espelhos_backup')
        .select('id, created_at, backup_type, scope, total_espelhos, total_materias, total_blocos, total_telejornais, total_pautas, created_by, notes')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(backups), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /download/:id - Download specific backup as JSON
    if (req.method === 'GET' && path !== 'backup-espelhos') {
      const backupId = path;
      const { data: backup, error } = await supabase
        .from('espelhos_backup')
        .select('*')
        .eq('id', backupId)
        .single();

      if (error) throw error;
      if (!backup) {
        return new Response(JSON.stringify({ error: 'Backup not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(backup.data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="backup-${backup.created_at}.json"`,
        },
      });
    }

    // POST /create - Create new full backup (telejornais, blocos, matérias, pautas, espelhos)
    if (req.method === 'POST' && path === 'backup-espelhos') {
      const body = await req.json().catch(() => ({}));
      const backupType = body.type === 'automatic' ? 'automatic' : 'manual';

      const { data: backupId, error: rpcError } = await supabase.rpc('create_full_backup', {
        _type: backupType,
        _created_by: userId,
        _notes: body.notes ?? null,
      });
      if (rpcError) throw rpcError;

      const { data: backup, error } = await supabase
        .from('espelhos_backup')
        .select('id, created_at, backup_type, scope, total_espelhos, total_materias, total_blocos, total_telejornais, total_pautas, created_by, notes')
        .eq('id', backupId)
        .maybeSingle();
      if (error) throw error;

      return new Response(JSON.stringify(backup), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /restore/:id - Restore backup (never deletes current rows)
    if (req.method === 'POST' && url.pathname.includes('/restore/')) {
      const backupId = url.pathname.split('/').pop();
      const body = await req.json().catch(() => ({}));
      const mode: 'merge' | 'overwrite' = body.mode === 'overwrite' ? 'overwrite' : 'merge';
      const scope: string = body.scope || 'all'; // all | pautas | telejornais | espelhos
      const telejornalIds: string[] = Array.isArray(body.telejornalIds) ? body.telejornalIds : [];

      const { data: backup, error: fetchError } = await supabase
        .from('espelhos_backup')
        .select('*')
        .eq('id', backupId)
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (!backup) {
        return new Response(JSON.stringify({ error: 'Backup not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Safety snapshot of current state before restoring
      const { error: preErr } = await supabase.rpc('create_full_backup', {
        _type: 'pre_restore',
        _created_by: userId,
        _notes: `Antes de restaurar backup ${backupId}`,
      });
      if (preErr) throw preErr;

      const raw = backup.data as any;
      const d = Array.isArray(raw)
        ? { telejornais: [], blocos: [], materias: [], pautas: [], pautas_telejornal: [], espelhos_salvos: raw }
        : raw;

      const upsert = async (table: string, rows: any[]) => {
        if (!rows || rows.length === 0) return 0;
        let count = 0;
        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500);
          const { error } = await supabase
            .from(table)
            .upsert(chunk, { onConflict: 'id', ignoreDuplicates: mode === 'merge' });
          if (error) throw new Error(`${table}: ${error.message}`);
          count += chunk.length;
        }
        return count;
      };

      const filterTj = (rows: any[], key = 'telejornal_id') =>
        telejornalIds.length ? rows.filter((r) => telejornalIds.includes(r[key])) : rows;

      const result: Record<string, number> = {};
      if (scope === 'all' || scope === 'telejornais') {
        const tjs = telejornalIds.length
          ? (d.telejornais || []).filter((t: any) => telejornalIds.includes(t.id))
          : d.telejornais || [];
        const blocos = filterTj(d.blocos || []);
        const blocoIds = new Set(blocos.map((b: any) => b.id));
        const materias = (d.materias || []).filter((m: any) => blocoIds.has(m.bloco_id));
        result.telejornais = await upsert('telejornais', tjs);
        result.blocos = await upsert('blocos', blocos);
        result.materias = await upsert('materias', materias);
      }
      if (scope === 'all' || scope === 'pautas') {
        result.pautas = await upsert('pautas', d.pautas || []);
        result.pautas_telejornal = await upsert('pautas_telejornal', d.pautas_telejornal || []);
      }
      if (scope === 'all' || scope === 'espelhos') {
        result.espelhos_salvos = await upsert('espelhos_salvos', filterTj(d.espelhos_salvos || []));
      }

      const restored = Object.values(result).reduce((a, b) => a + b, 0);
      console.log(`Restore ${backupId} mode=${mode} scope=${scope} by ${userId}`, result);

      return new Response(JSON.stringify({ success: true, restored, mode, scope, details: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    // DELETE /:id - Delete backup
    if (req.method === 'DELETE') {
      const backupId = path;
      
      console.log(`Deleting backup ${backupId} by user ${userId}...`);

      const { error } = await supabase
        .from('espelhos_backup')
        .delete()
        .eq('id', backupId);

      if (error) throw error;

      console.log(`Backup ${backupId} deleted successfully`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in backup-espelhos function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
