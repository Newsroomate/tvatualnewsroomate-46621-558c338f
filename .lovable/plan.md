

## Plano de Diagnóstico e Correção - WhatsApp Webhook

### Fase 1: Verificar Configuração no Meta for Developers

1. **Verificar Phone Number ID**
   - Acessar Meta for Developers > Seu App > WhatsApp > Getting Started
   - Confirmar que o `WHATSAPP_PHONE_NUMBER_ID` salvo no Supabase corresponde ao número que você está usando
   - Anotar o "Phone Number ID" exibido

2. **Verificar assinatura do Webhook para o Phone Number correto**
   - Ir em WhatsApp > Configuracao > Webhooks
   - Verificar se o webhook esta assinado para o WABA correto
   - Clicar em "Gerenciar" ao lado do WABA
   - Confirmar que "messages" esta marcado

3. **Verificar Test Recipients (CRITICO)**
   - Em modo sandbox/desenvolvimento, apenas numeros listados como "test recipients" podem enviar mensagens que geram webhooks
   - Ir em WhatsApp > Getting Started
   - Adicionar seu numero pessoal na lista "To" (Recipient phone number)
   - Clicar em "Adicionar numero de telefone" se necessario

### Fase 2: Testar Entrega do Webhook

1. **Usar o "Test" do Meta**
   - No painel do Meta, em Webhooks, clicar em "Test" ao lado do campo "messages"
   - Isso envia um evento de teste para o seu webhook
   - Verificar se aparece nos logs do Supabase Edge Function

2. **Adicionar logging detalhado na Edge Function**
   - Adicionar log no inicio da funcao para registrar TODOS os requests recebidos
   - Isso ajudara a identificar se o Meta esta enviando algo

### Fase 3: Verificar Permissoes do App

1. **Verificar status do App Review**
   - Apps em "Development" so funcionam com numeros de teste
   - Para producao completa, e necessario App Review

2. **Verificar permissoes do token**
   - O Access Token precisa ter permissao `whatsapp_business_messaging`

### Fase 4: Implementar Ferramenta de Debug

1. **Criar endpoint de teste manual**
   - Adicionar rota na Edge Function para simular recebimento de mensagem
   - Isso permite testar se o fluxo de salvamento funciona

2. **Verificar configuracao do Supabase**
   - Confirmar que `verify_jwt = false` esta configurado para a funcao
   - Sem isso, o Meta nao consegue chamar o webhook

