

# Melhorias na Integração vMix

## Bug Critico Atual

Existe um **loop infinito** no `VmixSettingsModal` (visivel nos logs do console). O `useEffect` na linha 39 depende de `settings`, mas o hook `useVmixSettings` retorna um novo objeto `effectiveSettings` a cada render quando nao ha settings salvos, causando re-renders infinitos.

## Melhorias Propostas

### 1. Corrigir o loop infinito no VmixSettingsModal
- No hook `useVmixSettings`, memorizar o `effectiveSettings` com `useMemo` para evitar criar um novo objeto a cada render
- No `VmixSettingsModal`, usar comparacao estavel no `useEffect` (ex: `JSON.stringify` ou campos individuais)

### 2. Auto-reconexao e health check periodico
- Adicionar um intervalo de verificacao automatica da conexao vMix (a cada 30s quando o painel esta aberto)
- Mostrar indicador visual de "ultima verificacao" no status panel
- Alertar o operador se a conexao cair durante o uso

### 3. Fila de mensagens com auto-avanço
- Implementar um modo "fila automatica" onde, ao remover uma mensagem do ar, a proxima aprovada entra automaticamente apos um delay configuravel
- Adicionar controle de tempo de exibicao (timer) para cada mensagem no ar

### 4. Atalhos de teclado para operacao rapida
- `Espaço` para aprovar/enviar ao ar a proxima mensagem pendente
- `Esc` para remover do ar
- `R` para rejeitar
- Indicadores visuais dos atalhos nos botoes

### 5. Preview da tarja antes de enviar
- Mostrar uma preview visual de como a mensagem vai aparecer na tarja do vMix antes de enviar ao ar
- Permitir editar o texto da mensagem antes de enviar (ex: corrigir erros de digitacao do telespectador)

### 6. Logs de operacao
- Registrar em tabela todas as acoes do operador (aprovar, rejeitar, enviar ao ar, remover)
- Mostrar historico de operacoes na sessao atual

## Arquivos Afetados

| Arquivo | Alteracao |
|---|---|
| `src/hooks/useVmixSettings.ts` | Memorizar effectiveSettings, adicionar health check |
| `src/components/vmix/VmixSettingsModal.tsx` | Corrigir useEffect, adicionar config de fila |
| `src/components/vmix/ViewerMessagesPanel.tsx` | Fila automatica, atalhos, preview, edicao |
| `src/components/vmix/MessageCard.tsx` | Timer de exibicao, preview da tarja |
| `src/components/vmix/WebhookStatusPanel.tsx` | Auto-reconexao periodica |

## Prioridade Sugerida

1. **Corrigir bug do loop infinito** (critico - esta causando erros no console agora)
2. Preview e edicao de mensagem antes de enviar
3. Fila automatica com timer
4. Atalhos de teclado
5. Health check periodico
6. Logs de operacao

