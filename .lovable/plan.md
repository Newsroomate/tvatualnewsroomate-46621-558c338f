

# Sistema de Sugestão de Linha Fina com IA

Replicação exata do sistema do projeto [DEMONSTRAÇÃO TV Sucesso](/projects/9547ee91-961d-4615-b09c-05667b746fdf).

## O que será criado

Um botão "Linha Fina IA" ao lado do campo GC no editor de matérias. Ao clicar, a IA analisa o corpo da matéria e gera 3 sugestões de linha fina no formato de tarja jornalística (2 linhas com limites de caracteres). O usuário clica em uma sugestão para aplicá-la ao campo GC.

## Arquivos

### 1. Edge Function: `supabase/functions/generate-linha-fina/index.ts`
- Recebe o texto da matéria, envia ao Lovable AI Gateway (gemini-3-flash-preview)
- Prompt instrui a IA a gerar 3 sugestões no formato `LINHA1|LINHA2` com limites de caracteres (L1: 20-25, L2: 35-42)
- Retorna array de sugestões parseadas

### 2. Componente: `src/components/edit-panel/LinhaFinaButton.tsx`
- Botão com ícone Sparkles que abre um Popover
- Ao abrir, invoca a edge function automaticamente
- Mostra 3 sugestões com contagem de caracteres e indicadores verde/vermelho
- Clique aplica a sugestão ao campo GC
- Botão "Gerar novas sugestões" para regenerar

### 3. Integração: `src/components/edit-panel/EditorFormFields.tsx`
- Importar LinhaFinaButton
- Adicionar ao lado do campo GC, junto ao AllCapsGCButton existente
- Passar `formData.texto` como input e `handleGCTextChange` como callback

### 4. Config: `supabase/config.toml`
- Adicionar entrada `[functions.generate-linha-fina]` com `verify_jwt = false`

## Dependências
- `LOVABLE_API_KEY` -- ja configurado no projeto

