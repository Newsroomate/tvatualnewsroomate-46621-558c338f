

# Alterar role do usuário editorchefe@gmail.com

## Situação atual

- **Usuário encontrado**: `editorchefe@gmail.com` (ID: `5a7496e0-2471-4204-b6b5-1a65be566ee6`)
- **Role atual**: `reporter`
- **Role solicitado**: `admin` — **não existe** no sistema

## Roles disponíveis no sistema

O enum `user_role` aceita apenas: `reporter`, `editor`, `editor_chefe`, `produtor`.

Não há um role chamado `admin`. O equivalente administrativo é o **`editor_chefe`**, que possui:
- Acesso total a todas as funcionalidades
- Permissão para gerenciar usuários (`gerenciar_usuarios`)
- Permissão para gerenciar permissões granulares (`gerenciar_permissoes`)
- Permissão para criar/editar/excluir telejornais
- Acesso a backups, auditoria, etc.

## Mudanças propostas

Atualizar o usuário `editorchefe@gmail.com` para o role **`editor_chefe`** em duas tabelas (de forma atômica):

1. **`profiles`**: alterar `role` de `reporter` → `editor_chefe`
2. **`user_roles`**: inserir/atualizar entrada com `role = editor_chefe` e remover roles antigos

Isso será feito via operação de dados (não migração de schema), seguindo o mesmo padrão usado anteriormente para outros editores-chefe (Lucas Santana, Rawenna Brito, Leandro Vieira).

## Observação importante

Após a alteração, o usuário precisa **fazer logout e login novamente** para que as novas permissões entrem em vigor no frontend (o AuthContext carrega o role apenas no login).

## Alternativa

Se você realmente queria criar um novo role chamado `admin` (separado de `editor_chefe`), isso exigiria:
- Migração para adicionar `admin` ao enum `user_role`
- Atualização da matriz de permissões em `has_effective_permission()` SQL
- Atualização de `getDefaultRolePermissions()` em `src/services/user-permissions-api.ts`
- Atualização de tipos em `src/types/auth.ts`

Avise se prefere essa segunda opção em vez de usar `editor_chefe`.

