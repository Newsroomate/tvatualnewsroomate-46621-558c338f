# Plano: Pacote Gráfico de GCs por Telejornal

Hoje não existe nenhum "Pacote Gráfico" no projeto. Vou criar do zero, com armazenamento por telejornal, fundos por tipo de GC (Crédito, Repórter, Cinegrafista, Produtor, Linha Fina, Geral) e layout configurável.

## 1. Banco de dados (migration)

**Bucket de Storage** `gc-backgrounds` (público leitura, escrita restrita a editores):
- RLS em `storage.objects`:
  - SELECT público (`bucket_id = 'gc-backgrounds'`)
  - INSERT/UPDATE/DELETE somente para quem tem `has_effective_permission(auth.uid(), 'editar_telejornal')`
- Estrutura de pastas: `{telejornal_id}/{tipo}.{ext}` (mp4/webm/png/jpg)

**Tabela `gc_pacote_grafico`** — uma linha por (telejornal × tipo de GC):
- `id uuid pk`
- `telejornal_id uuid` (nullable → permite pacote "global" default)
- `tipo text` (credito, reporter, cinegrafista, produtor, linha_fina, geral)
- `media_url text` (URL pública do storage)
- `media_type text` ('image' | 'video')
- `layout jsonb` — configuração do texto sobreposto, schema:
  ```json
  {
    "linha1": { "x": 50, "y": 70, "fontSize": 28, "color": "#FFFFFF", "align": "center", "bold": true, "fontFamily": "Inter" },
    "linha2": { "x": 50, "y": 82, "fontSize": 18, "color": "#FFFFFF", "align": "center", "bold": false, "fontFamily": "Inter" }
  }
  ```
  (x/y em % do canvas 16:9)
- `created_at`, `updated_at`, `created_by`
- Único `(telejornal_id, tipo)`

**RLS**:
- SELECT: usuários com acesso ao telejornal (`can_access_telejornal`) ou pacote global
- INSERT/UPDATE/DELETE: `has_effective_permission(auth.uid(), 'editar_telejornal', telejornal_id)`

## 2. Service layer
`src/services/gc-pacote-grafico-api.ts`:
- `fetchPacoteGrafico(telejornalId)` → array com todos os 6 tipos (preenche default vazio para tipos sem registro)
- `upsertPacoteGraficoTipo(telejornalId, tipo, { media_url, media_type, layout })`
- `uploadGcBackground(telejornalId, tipo, file)` → faz upload, retorna URL pública e tipo de mídia
- `deleteGcBackground(telejornalId, tipo)`

## 3. UI — aba "Pacote Gráfico"

**Refatorar `VmixSettingsModal.tsx`** para usar `Tabs` com duas abas:
- "Geral" → conteúdo atual (config vMix)
- "Pacote Gráfico" → novo componente `PacoteGraficoTab`

**`src/components/vmix/PacoteGraficoTab.tsx`**:
- Grid 2 colunas com 6 cards (um por tipo de GC), seguindo o print:
  - Header do card: nome do tipo + botão "Upload"/"Trocar" + botão lixeira
  - Preview ao vivo (proporção 16:9) renderizado por `GcBackgroundPreview`
  - Botão "Editar layout" abre `GcLayoutEditor`
- Input de arquivo aceita `image/*,video/mp4,video/webm,.mov`
- Upload mostra progresso, validação de tamanho (≤ 20 MB), feedback via `toast`

**`src/components/vmix/GcBackgroundPreview.tsx`** (reutilizável):
- Renderiza `<video>` (autoplay loop muted) ou `<img>` como fundo
- Sobrepõe `<div>` posicionados em % com os textos das linhas, aplicando layout
- Usa texto-exemplo se as linhas não forem passadas ("NOME EXEMPLO" / nome do tipo)
- Mantém aspect-ratio 16:9 fixo

**`src/components/vmix/GcLayoutEditor.tsx`** (Dialog):
- Para cada linha (1 e 2): inputs de `x`, `y` (slider 0–100%), `fontSize` (slider 10–80), `color` (color picker), `align` (left/center/right), `bold` (toggle)
- Preview em tempo real ao lado dos controles, usando `GcBackgroundPreview`
- Salvar persiste em `layout` da linha em `gc_pacote_grafico`

## 4. Integração com GCListEditor (opcional, mas o usuário pediu "preview")
Não está no escopo desta entrega (a resposta da pergunta foi "apenas em Configurações do Telejornal"). Deixar `GcBackgroundPreview` exportado para uso futuro.

## 5. Permissões e segurança
- `useVmixSettings` já valida acesso ao telejornal
- Toda escrita passa por `usePermissionGuard` com `'editar_telejornal'`
- Quando usuário não tem permissão: mostrar mensagem de "permissão negada" antes de tentar ações (padrão do projeto)

## 6. Arquivos a criar/editar

Criar:
- `supabase/migrations/<timestamp>_gc_pacote_grafico.sql`
- `src/types/gc-pacote-grafico.ts`
- `src/services/gc-pacote-grafico-api.ts`
- `src/components/vmix/PacoteGraficoTab.tsx`
- `src/components/vmix/GcBackgroundPreview.tsx`
- `src/components/vmix/GcLayoutEditor.tsx`

Editar:
- `src/components/vmix/VmixSettingsModal.tsx` → adicionar `Tabs` com "Geral" e "Pacote Gráfico"
- `src/components/vmix/index.ts` → exportar novos componentes

## Notas técnicas
- Vídeos `.mov` salvam mas podem não ter preview em alguns navegadores (mensagem informativa exibida)
- Textos no preview usam `text-shadow` para legibilidade quando o fundo for claro
- Carregamento dos 6 tipos em uma única chamada (`.in('tipo', [...])`)
- `media_url` usa Storage público para evitar signed URLs em preview
