# NEWSROOMATE - Dump Completo do Banco de Dados Supabase

## Informações do Projeto

- **Nome do Projeto**: Newsroomate
- **ID do Projeto Supabase**: `ggxgpqpgvnkanfgcheho`
- **Data da Geração**: 12 de Setembro de 2025
- **URL do Projeto**: https://ggxgpqpgvnkanfgcheho.supabase.co

## Arquivos Gerados

1. **`supabase_dump_newsroomate_complete_2025.sql`** - Dump completo DEFINITIVO com toda estrutura e dados

## Conteúdo do Dump

### Estrutura do Banco
- ✅ **9 Tabelas principais**:
  - `profiles` (4 usuários ativos)
  - `telejornais` (3 telejornais)
  - `blocos` (5 blocos)
  - `materias` (múltiplas matérias com conteúdo completo)
  - `pautas` (sem dados atuais)
  - `materias_locks` (sistema de locks ativo)
  - `espelhos_salvos` (4 espelhos salvos)
  - `materias_snapshots` (sistema de snapshots)
  - `modelos_salvos` (1 modelo exemplo)

### Funcionalidades Incluídas
- ✅ **6 Funções do banco de dados**
- ✅ **32 Políticas RLS completas** (Row Level Security)
- ✅ **Sistema de autenticação** configurado
- ✅ **8 Triggers automáticos** para timestamps
- ✅ **Realtime habilitado** para todas as tabelas
- ✅ **Tipos customizados** (`user_role` enum)
- ✅ **Índices primários** para todas as tabelas

### Dados de Produção Atuais
- **Usuários**: 4 perfis ativos com role editor_chefe
- **Telejornais**: 3 programas incluindo "Jornal da Manhã", "PATRULHA", "TESTE"
- **Matérias**: Com texto, GC, cabeças, durações, etc.
- **Espelhos Salvos**: 4 espelhos com estruturas completas
- **Modelos**: 1 modelo exemplo funcional

## Como Usar o Dump

### Para Novo Projeto Supabase:
1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Acesse o SQL Editor do novo projeto
3. Execute o arquivo `supabase_dump_newsroomate_complete_2025.sql`
4. Configure as variáveis de ambiente na sua aplicação:
   ```
   VITE_SUPABASE_URL=sua_nova_url
   VITE_SUPABASE_PUBLISHABLE_KEY=sua_nova_chave
   ```

### Para Backup/Restauração:
1. Salve o arquivo em local seguro
2. Para restaurar, execute o SQL no seu projeto
3. Verifique se todas as tabelas foram criadas corretamente
4. Teste as políticas RLS e realtime

## Estrutura de Usuários no Dump

| Email | Role | Status | Data Criação |
|-------|------|--------|--------------|
| editorchefe@gmail.com | editor_chefe | Ativo | 2025-09-01 |
| marcosmonturil@gmail.com | editor_chefe | Ativo | 2025-09-03 |
| mayaradias@gmail.com | editor_chefe | Ativo | 2025-09-03 |
| waldeluciobarbosa@gmail.com | editor_chefe | Ativo | 2025-09-03 |

## Telejornais Configurados

| Nome | Horário | Status | Espelho Aberto |
|------|---------|--------|----------------|
| TESTE (equipe newsroomate) | 20:37 | Ativo | ✅ |
| Jornal da Manhã | 7:00 | Ativo | ✅ |
| PATRULHA | 17:00 | Ativo | ✅ |

## Recursos Avançados

### Funções Customizadas
1. `get_current_user_role()` - Obtém role do usuário atual
2. `handle_new_user()` - Cria perfil para novos usuários
3. `update_updated_at_column()` - Atualiza timestamps automaticamente
4. `cleanup_expired_locks()` - Remove locks expirados
5. `cleanup_expired_locks_trigger()` - Trigger para limpeza
6. `enable_realtime()` - Habilita realtime em tabelas

### Segurança
- **32 Políticas RLS** implementadas
- **Controle de acesso** baseado em roles
- **Autenticação** obrigatória para operações
- **Isolamento de dados** por usuário quando necessário

### Performance
- **Índices primários** em todas as tabelas
- **Triggers otimizados** para timestamps
- **Realtime configurado** para sincronização

## Observações Importantes

- ✅ **Dados Reais**: O dump contém dados de produção atuais
- ✅ **Realtime Funcional**: Todas as tabelas estão configuradas
- ✅ **Backup Completo**: Incluí toda a estrutura e configurações
- ⚠️ **Cuidado**: Este é um dump de produção - use com cuidado

## Migração e Restauração

### Passos para Restauração Completa:
1. Execute o SQL dump no novo projeto
2. Verifique se todas as 9 tabelas foram criadas
3. Confirme que as 6 funções estão funcionando
4. Teste as políticas RLS com diferentes usuários
5. Verifique se o realtime está ativo
6. Importe dados adicionais se necessário

### Verificação Pós-Restauração:
```sql
-- Verificar tabelas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Verificar funções
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';

-- Verificar políticas RLS
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Verificar realtime
SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

## Suporte Técnico

Para dúvidas sobre o uso do dump:
1. Verifique a documentação do Supabase
2. Consulte os logs do SQL Editor ao executar
3. Teste as políticas RLS se houver problemas de permissão
4. Verifique se o realtime está funcionando

## Changelog

- **v2025**: Dump completo atualizado com dados atuais de produção
- **Melhorias**: Estrutura mais organizada e documentação completa
- **Adições**: Todos os dados atuais do sistema em produção

---

**⚠️ IMPORTANTE**: Este dump contém dados reais de produção. Use apenas em ambientes autorizados e mantenha a segurança dos dados.