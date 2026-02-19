

# Deploy do WhatsApp Webhook Edge Function

## Problema
A Edge Function `whatsapp-webhook` existe no codigo mas nao foi implantada no Supabase, resultando em erro 404 quando o Meta tenta entregar mensagens reais.

## Acoes

1. **Deploy da Edge Function** `whatsapp-webhook` no Supabase
2. **Teste de conectividade** chamando o endpoint `?test=true` para confirmar que esta respondendo
3. **Verificacao dos logs** para garantir que o deploy foi bem-sucedido

## Resultado esperado
- O endpoint `https://rigluylhplrrlfkssrur.supabase.co/functions/v1/whatsapp-webhook` passa a responder com status 200
- Mensagens reais enviadas via WhatsApp serao recebidas e salvas na tabela `viewer_messages`
- O painel de status no dashboard mostrara "Online"

