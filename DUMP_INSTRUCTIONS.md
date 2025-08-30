# NEWSROOMATE - Dump do Banco de Dados Supabase

## Informações do Projeto

- **Nome do Projeto**: Newsroomate
- **ID do Projeto Supabase**: `rigluylhplrrlfkssrur`
- **Data da Geração**: 30 de Janeiro de 2025
- **URL do Projeto**: https://rigluylhplrrlfkssrur.supabase.co

## Arquivos Gerados

1. **`supabase_dump_newsroomate_complete.sql`** - Dump completo do banco de dados

## Conteúdo do Dump

### Estrutura do Banco
- ✅ **9 Tabelas principais**:
  - `profiles` (10 usuários)
  - `telejornais` (5 telejornais)
  - `blocos` (13 blocos)
  - `materias` (múltiplas matérias com conteúdo completo)
  - `pautas` (4 pautas)
  - `materias_locks` (sistema de locks)
  - `espelhos_salvos` (3 espelhos salvos)
  - `materias_snapshots` (snapshots)
  - `modelos_salvos` (1 modelo salvo)

### Funcionalidades Incluídas
- ✅ **7 Funções do banco de dados**
- ✅ **Políticas RLS completas** (Row Level Security)
- ✅ **Sistema de autenticação** configurado
- ✅ **Triggers automáticos** para timestamps
- ✅ **Realtime habilitado** para todas as tabelas
- ✅ **Tipos customizados** (`user_role` enum)

### Dados de Exemplo
- **Usuários**: 10 perfis com diferentes roles (editor_chefe, editor, reporter)
- **Telejornais**: 5 programas incluindo "Boa Tarde", "ESPECIAIS", "GRAVADOS"
- **Matérias completas**: Com texto, GC, cabeças, durações, etc.
- **Pautas**: 4 pautas com informações detalhadas

## Como Usar o Dump

### Para Novo Projeto Supabase:
1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Acesse o SQL Editor do novo projeto
3. Execute o arquivo `supabase_dump_newsroomate_complete.sql`
4. Configure as variáveis de ambiente na sua aplicação

### Para Backup/Restauração:
1. Salve o arquivo em local seguro
2. Para restaurar, execute o SQL no seu projeto
3. Verifique se todas as tabelas foram criadas corretamente

## Localização dos Arquivos

Os arquivos foram gerados no diretório raiz do projeto:
- `supabase_dump_newsroomate_complete.sql`
- `DUMP_INSTRUCTIONS.md`

## Para Baixar para seu Computador

1. **Clique no arquivo** `supabase_dump_newsroomate_complete.sql` no explorador de arquivos
2. **Copie o conteúdo** e salve em um arquivo `.sql` local
3. **Salve em**: `C:\Users\User\Desktop\dumpnewsroomate\`

## Estrutura de Usuários no Dump

| Email | Role | Status |
|-------|------|--------|
| leandrovieira007@hotmail.com | editor_chefe | Ativo |
| lucassantanarv215@gmail.com | editor_chefe | Ativo |
| luizboatardegoias@gmail.com | editor_chefe | Ativo |
| ferrari.carol@hotmail.com | editor | Ativo |
| pauloferrari160@gmail.com | editor | Ativo |
| ellencristinaaa@gmail.com | editor | Ativo |
| mkt.arthurpadua@gmail.com | editor_chefe | Ativo |
| rogeriotrovas7@gmail.com | reporter | Ativo |
| fernandodavizinho14@gmail.com | reporter | Ativo |
| joseinaciofarias7@gmail.com | reporter | Ativo |

## Observações Importantes

- ⚠️ **Avisos de Segurança**: O dump mostra 2 avisos relacionados à configuração de auth (OTP longo e proteção de senha desabilitada)
- ✅ **Realtime Funcional**: Todas as tabelas estão configuradas para realtime
- ✅ **Backup Completo**: Incluí toda a estrutura e dados atuais do sistema
- 📊 **Dados Reais**: O dump contém dados reais de produção do sistema

## Suporte

Para dúvidas sobre o uso do dump, verifique:
1. A documentação do Supabase
2. Os logs do SQL Editor ao executar
3. As políticas RLS se houver problemas de permissão