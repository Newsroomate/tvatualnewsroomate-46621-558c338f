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

    // GET /list - List all backups
    if (req.method === 'GET' && path === 'backup-espelhos') {
      const { data: backups, error } = await supabase
        .from('espelhos_backup')
        .select('*')
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

    // POST /create - Create new backup
    if (req.method === 'POST' && path === 'backup-espelhos') {
      const body = await req.json();
      const backupType = body.type || 'manual';

      console.log(`Creating ${backupType} backup...`);

      // Fetch all espelhos_salvos
      const { data: espelhos, error: fetchError } = await supabase
        .from('espelhos_salvos')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (!espelhos || espelhos.length === 0) {
        console.log('No espelhos to backup');
        return new Response(
          JSON.stringify({ message: 'No espelhos to backup', backupId: null }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Calculate statistics
      let totalMaterias = 0;
      let totalBlocos = 0;

      espelhos.forEach((espelho: BackupData) => {
        const estrutura = espelho.estrutura as any;
        if (estrutura?.blocos) {
          totalBlocos += estrutura.blocos.length;
          estrutura.blocos.forEach((bloco: any) => {
            if (bloco.items) {
              totalMaterias += bloco.items.length;
            }
          });
        }
      });

      // Get current user for manual backups
      const authHeader = req.headers.get('authorization');
      let userId = null;
      if (authHeader && backupType === 'manual') {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      }

      // Create backup record
      const { data: backup, error: insertError } = await supabase
        .from('espelhos_backup')
        .insert({
          backup_type: backupType,
          total_espelhos: espelhos.length,
          total_materias: totalMaterias,
          total_blocos: totalBlocos,
          data: espelhos,
          created_by: userId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log(`Backup created successfully: ${backup.id}`);
      console.log(`Total: ${espelhos.length} espelhos, ${totalBlocos} blocos, ${totalMaterias} matérias`);

      // Cleanup old automatic backups (keep last 30 days)
      if (backupType === 'automatic') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        await supabase
          .from('espelhos_backup')
          .delete()
          .eq('backup_type', 'automatic')
          .lt('created_at', thirtyDaysAgo.toISOString());
      }

      return new Response(JSON.stringify(backup), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /restore/:id - Restore backup
    if (req.method === 'POST' && url.pathname.includes('/restore/')) {
      const backupId = url.pathname.split('/').pop();
      const body = await req.json();
      const restoreType = body.restoreType || 'complete'; // complete, partial, merge
      const selectedIds = body.selectedIds || []; // for partial restore

      console.log(`Restoring backup ${backupId} (type: ${restoreType})...`);

      // Fetch backup
      const { data: backup, error: fetchError } = await supabase
        .from('espelhos_backup')
        .select('*')
        .eq('id', backupId)
        .single();

      if (fetchError) throw fetchError;
      if (!backup) {
        return new Response(JSON.stringify({ error: 'Backup not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const backupData = backup.data as BackupData[];
      let espelhosToRestore = backupData;

      // Filter for partial restore
      if (restoreType === 'partial' && selectedIds.length > 0) {
        espelhosToRestore = backupData.filter((e) => selectedIds.includes(e.id));
      }

      // For merge, exclude espelhos that already exist
      if (restoreType === 'merge') {
        const { data: existing } = await supabase
          .from('espelhos_salvos')
          .select('id');
        
        const existingIds = new Set(existing?.map((e) => e.id) || []);
        espelhosToRestore = backupData.filter((e) => !existingIds.has(e.id));
      }

      // For complete restore, delete all existing espelhos first
      if (restoreType === 'complete') {
        const { error: deleteError } = await supabase
          .from('espelhos_salvos')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (deleteError) throw deleteError;
      }

      // Insert restored espelhos
      const { data: restored, error: insertError } = await supabase
        .from('espelhos_salvos')
        .insert(espelhosToRestore)
        .select();

      if (insertError) throw insertError;

      console.log(`Restored ${restored?.length || 0} espelhos successfully`);

      return new Response(
        JSON.stringify({
          success: true,
          restored: restored?.length || 0,
          type: restoreType,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // DELETE /:id - Delete backup
    if (req.method === 'DELETE') {
      const backupId = path;
      
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
