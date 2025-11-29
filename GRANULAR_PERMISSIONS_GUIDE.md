# Guia de Permissões Granulares

## Visão Geral

O sistema de permissões granulares permite controle fino sobre o que cada usuário pode fazer, complementando o sistema de roles (reporter, editor, editor_chefe, produtor).

## Como Funciona

### 1. Hierarquia de Permissões

```
Permissões Granulares (user_permissions)
          ↓ (prioridade máxima)
    Role Global (profiles.role)
          ↓ (fallback)
       Negado
```

**Exemplo:** Um usuário com role `reporter` normalmente NÃO pode criar blocos. Porém, se você atribuir a permissão granular `criar_bloco` para ele na tabela `user_permissions`, ele PODERÁ criar blocos.

### 2. Permissões Disponíveis

Todas as permissões granulares disponíveis:

- `criar_materia` - Criar matérias
- `editar_materia` - Editar matérias
- `excluir_materia` - Excluir matérias
- `criar_bloco` - Criar blocos
- `editar_bloco` - Editar blocos
- `excluir_bloco` - Excluir blocos
- `criar_telejornal` - Criar telejornais
- `editar_telejornal` - Editar telejornais
- `excluir_telejornal` - Excluir telejornais
- `gerenciar_espelho` - Gerenciar espelhos
- `fechar_espelho` - Fechar espelhos
- `criar_pauta` - Criar pautas
- `editar_pauta` - Editar pautas
- `excluir_pauta` - Excluir pautas
- `visualizar_todas_pautas` - Ver todas as pautas
- `gerenciar_usuarios` - Gerenciar usuários
- `gerenciar_permissoes` - Gerenciar permissões
- `visualizar_snapshots` - Visualizar snapshots
- `excluir_snapshots` - Excluir snapshots

### 3. Permissões Padrão por Role

#### Reporter
- Criar matéria
- Editar matéria

#### Editor
- Criar matéria
- Editar matéria
- Excluir matéria
- Criar bloco
- Editar bloco
- Excluir bloco
- Criar telejornal
- Editar telejornal
- Gerenciar espelho
- Visualizar snapshots

#### Editor Chefe
- **TODAS as permissões**

#### Produtor
- Criar pauta
- Editar pauta
- Excluir pauta

## Usando a Interface Administrativa

### Acessar Permissões

1. Faça login como `editor_chefe` ou com permissão `gerenciar_permissoes`
2. Clique no menu de usuário (canto superior direito)
3. Selecione "Gerenciar Permissões"
4. Navegue até a aba "Permissões"

### Atribuir Permissão Extra

1. Selecione um usuário no dropdown
2. Você verá uma tabela com TODAS as permissões
3. Permissões marcadas com badge "Via Role" são herdadas do role global
4. Permissões marcadas com badge "Extra ⭐" foram atribuídas manualmente
5. Use o switch para ativar/desativar permissões extras

**Nota:** Permissões "Via Role" não podem ser desativadas diretamente. Para remover, você precisa mudar o role global do usuário na aba "Usuários".

## Usando no Código

### Hook `usePermissionCheck`

```typescript
import { usePermissionCheck } from "@/hooks/usePermissionCheck";

function MyComponent() {
  const { canCreate, canDelete } = usePermissionCheck();

  return (
    <div>
      {canCreate('bloco') && (
        <button>Criar Bloco</button>
      )}
      
      {canDelete('materia') && (
        <button>Excluir Matéria</button>
      )}
    </div>
  );
}
```

### Função `canPerformAction` com Permissões

```typescript
import { canPerformAction } from "@/utils/security-utils";
import { useAuth } from "@/context/AuthContext";

function checkPermission() {
  const { profile, userPermissions } = useAuth();
  
  const canCreateBloco = canPerformAction(
    profile,
    'create',
    'bloco',
    undefined,
    userPermissions // ← Passa as permissões granulares
  );
  
  if (canCreateBloco) {
    // Usuário pode criar bloco
  }
}
```

## Exemplos Práticos

### Exemplo 1: Reporter que pode criar blocos

**Situação:** Samuel é reporter, mas precisa criar blocos excepcionalmente.

**Solução:**
1. Vá em "Gerenciar Permissões" → aba "Permissões"
2. Selecione Samuel
3. Encontre "Criar Bloco" na tabela
4. Ative o switch
5. Samuel agora pode criar blocos mesmo sendo reporter

### Exemplo 2: Editor que NÃO pode excluir matérias

**Situação:** João é editor, mas você não quer que ele exclua matérias.

**Solução:**
1. Vá em "Gerenciar Permissões" → aba "Usuários"
2. Mude o role de João de `editor` para `reporter`
3. Vá na aba "Permissões"
4. Selecione João
5. Ative manualmente as permissões que ele precisa:
   - ✅ Criar matéria
   - ✅ Editar matéria
   - ✅ Criar bloco
   - ✅ Editar bloco
   - ❌ Excluir matéria (mantém desativado)

## Auditoria

Todas as mudanças de permissões são registradas automaticamente na tabela `permission_audit_logs` e podem ser visualizadas na aba "Auditoria" do painel administrativo.

## Segurança

- ✅ Permissões são validadas no servidor (RLS policies)
- ✅ Permissões são validadas no cliente (hooks e funções)
- ✅ Todas as mudanças são auditadas
- ✅ Apenas `editor_chefe` pode gerenciar permissões
- ✅ Permissões granulares têm prioridade sobre roles

## Troubleshooting

### "Permissão não está funcionando"

1. Verifique se o usuário tem a permissão na aba "Permissões"
2. Verifique se o código está usando `canPerformAction` com `userPermissions`
3. Verifique os logs de auditoria para confirmar que a permissão foi atribuída
4. Faça logout e login novamente para recarregar as permissões

### "Não consigo remover uma permissão"

- Se a permissão tem badge "Via Role", ela vem do role global
- Para remover, você precisa mudar o role do usuário na aba "Usuários"
- Permissões "Extra" podem ser removidas diretamente com o switch
