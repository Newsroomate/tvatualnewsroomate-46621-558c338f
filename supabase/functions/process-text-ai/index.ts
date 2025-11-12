import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { retranca, cabeca, texto } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    console.log('Processing text with AI for RSS export');

    const fullContent = `
Título: ${retranca || 'Sem título'}
Cabeça: ${cabeca || ''}
Corpo: ${texto || ''}
    `.trim();

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Você é um editor de texto profissional. Sua função é revisar e melhorar textos jornalísticos mantendo o estilo e a essência original. 
            
Instruções:
- Corrija erros gramaticais e ortográficos
- Melhore a clareza e fluidez do texto
- Mantenha o tom jornalístico profissional
- NÃO adicione informações que não estejam no texto original
- NÃO mude o significado ou fatos apresentados
- Retorne APENAS o texto revisado, sem comentários adicionais`
          },
          {
            role: 'user',
            content: fullContent
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`Erro ao processar com IA: ${response.status}`);
    }

    const data = await response.json();
    const processedText = data.choices[0].message.content;

    console.log('AI processing completed successfully');

    return new Response(
      JSON.stringify({ processedText }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in process-text-ai function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
