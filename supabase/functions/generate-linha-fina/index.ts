import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto } = await req.json();

    if (!texto || texto.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Texto da matéria é necessário (mínimo 10 caracteres)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um editor de telejornal brasileiro especialista em criar linhas finas (GC - Gerador de Caracteres) para matérias jornalísticas de TV.

REGRAS OBRIGATÓRIAS:
1. Gere exatamente 3 sugestões de linha fina
2. Cada sugestão deve ter EXATAMENTE 2 linhas separadas por "|"
3. LINHA 1: entre 20 e 25 caracteres (título/manchete curta)
4. LINHA 2: entre 35 e 42 caracteres (complemento/contexto)
5. Use LETRAS MAIÚSCULAS em tudo
6. Seja direto, jornalístico e informativo
7. Não use aspas, pontuação excessiva ou caracteres especiais
8. Cada sugestão em uma linha separada

FORMATO DE RESPOSTA (exatamente assim, uma por linha):
LINHA1 AQUI|LINHA2 COMPLEMENTAR AQUI
LINHA1 AQUI|LINHA2 COMPLEMENTAR AQUI
LINHA1 AQUI|LINHA2 COMPLEMENTAR AQUI`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Crie 3 sugestões de linha fina (GC) para a seguinte matéria:\n\n${texto.substring(0, 2000)}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro ao gerar sugestões");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse suggestions
    const lines = content.split("\n").filter((l: string) => l.trim() && l.includes("|"));
    const sugestoes = lines.slice(0, 3).map((line: string) => {
      const parts = line.trim().split("|");
      return {
        linha1: (parts[0] || "").trim().toUpperCase(),
        linha2: (parts[1] || "").trim().toUpperCase(),
      };
    });

    if (sugestoes.length === 0) {
      throw new Error("Não foi possível gerar sugestões válidas");
    }

    return new Response(
      JSON.stringify({ sugestoes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-linha-fina error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
