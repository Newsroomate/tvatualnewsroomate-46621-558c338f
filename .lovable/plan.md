

## Diagnostico: WhatsApp Webhook nao recebe mensagens

### O que foi verificado

1. **Edge Function esta online e funcional** -- O teste `?test=true` inseriu mensagem com sucesso (status 200)
2. **Verificacao de token funciona** -- Token incorreto retorna 403 corretamente
3. **Nenhum log do Meta** -- O Meta nunca enviou requisicoes ao webhook, indicando que a configuracao no painel Meta for Developers nao esta completa

### Causa raiz

O problema nao e de codigo. O Meta for Developers nao esta configurado para enviar webhooks ao seu endpoint. Existem 3 causas possiveis:

### Checklist de configuracao no Meta for Developers

**1. Verificar se o Webhook esta registrado**
- Acesse: Meta for Developers → Seu App → WhatsApp → Configuration
- A **Callback URL** deve ser exatamente:
  `https://rigluylhplrrlfkssrur.supabase.co/functions/v1/whatsapp-webhook`
- O **Verify Token** deve ser o mesmo valor que esta no secret `WHATSAPP_VERIFY_TOKEN` do Supabase
- Clique "Verify and Save" -- se der erro, o token nao bate

**2. Verificar se o campo "messages" esta subscrito**
- Na mesma pagina de Webhook, em "Webhook fields", o campo **messages** deve estar com toggle ativo
- Sem isso, o Meta nao envia nada mesmo com o webhook verificado

**3. Verificar se o app esta em modo Live (nao Test)**
- No topo do painel Meta, verifique se o app esta em **Live mode** (nao Development)
- Em modo Development, apenas mensagens enviadas por numeros de teste cadastrados sao processadas
- Se estiver em Development: va em "App Settings → Basic" e mude para Live

**4. Verificar o numero de telefone**
- Em WhatsApp → API Setup, confirme que o numero +55 11 96174-4517 aparece
- O `WHATSAPP_PHONE_NUMBER_ID` deve corresponder ao ID exibido ao lado desse numero

### O que Lovable pode fazer

Nao ha mudancas de codigo necessarias. A Edge Function ja esta pronta. O plano e:

1. **Criar um painel de diagnostico** no app que valide automaticamente se o webhook recebeu alguma chamada do Meta nos ultimos 5 minutos, facilitando o troubleshooting
2. **Adicionar um botao "Enviar mensagem de teste"** que faz uma requisicao GET ao endpoint `?test=true` diretamente do painel, para confirmar que a pipeline Edge Function → banco de dados esta funcional

Porem, a acao principal agora e voce verificar as 4 configuracoes acima no painel do Meta for Developers e confirmar/reconfiguar o webhook.

