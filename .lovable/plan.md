

# Painel de Status do Webhook WhatsApp em Tempo Real

## Objetivo
Adicionar um painel de monitoramento dentro do modal "Mensagens ZAP / vMix" que mostra o status da integra\u00e7\u00e3o WhatsApp em tempo real: conex\u00e3o do webhook, \u00faltimas mensagens recebidas, e estat\u00edsticas.

## O que ser\u00e1 adicionado

### 1. Novo componente: `WebhookStatusPanel`
Um painel compacto exibido no topo do modal de Mensagens ZAP, contendo:

- **Indicador de status do webhook** - Verifica se o endpoint est\u00e1 ativo chamando o endpoint `?test=true`
- **\u00daltima mensagem recebida** - Mostra quando a \u00faltima mensagem chegou (tempo relativo: "h\u00e1 2 minutos")
- **Contadores em tempo real** - Total de mensagens hoje, pendentes, aprovadas
- **Bot\u00e3o de teste** - Permite enviar uma mensagem de teste para validar a conex\u00e3o

### 2. Integra\u00e7\u00e3o no VmixControlPanel
O painel ser\u00e1 inserido entre o seletor de telejornal e o painel de mensagens, com um bot\u00e3o para expandir/recolher para n\u00e3o ocupar espa\u00e7o desnecessariamente.

### 3. Fun\u00e7\u00e3o de servi\u00e7o para teste do webhook
Nova fun\u00e7\u00e3o em `viewer-messages-api.ts` que chama o endpoint de teste e retorna o status.

## Detalhes T\u00e9cnicos

### Arquivos a criar:
- `src/components/vmix/WebhookStatusPanel.tsx` - Componente do painel de status

### Arquivos a modificar:
- `src/components/vmix/VmixControlPanel.tsx` - Integrar o painel de status
- `src/services/viewer-messages-api.ts` - Adicionar fun\u00e7\u00e3o `testWebhookConnection`

### L\u00f3gica do painel:
1. Ao abrir o modal, busca a \u00faltima mensagem do banco (`viewer_messages ORDER BY received_at DESC LIMIT 1`)
2. Calcula e exibe o tempo desde a \u00faltima mensagem
3. Consulta contadores (hoje, pendentes) usando os dados j\u00e1 carregados pelo `useRealtimeViewerMessages`
4. Bot\u00e3o "Testar Webhook" faz GET ao endpoint `?test=true` e mostra resultado
5. Atualiza automaticamente via realtime (j\u00e1 implementado no hook existente)

### Visual:
- Card compacto com fundo sutil (verde quando ativo, amarelo quando sem mensagens recentes)
- \u00cdcones de status (c\u00edrculo verde/amarelo/vermelho)
- Recolh\u00edvel via `Collapsible` do Radix UI

