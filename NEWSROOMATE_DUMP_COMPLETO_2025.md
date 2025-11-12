# NEWSROOMATE - Dump Completo do Projeto
**Data de Geração:** 25 de Outubro de 2025  
**Versão:** 2.0 (Pós-Migração de Segurança)

---

## 📋 ÍNDICE

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
4. [Sistema de Segurança](#sistema-de-segurança)
5. [Schema SQL Completo](#schema-sql-completo)
6. [Dados de Exemplo](#dados-de-exemplo)
7. [Configurações do Supabase](#configurações-do-supabase)
8. [Instruções de Restauração](#instruções-de-restauração)
9. [Checklist de Verificação](#checklist-de-verificação)
10. [Notas Importantes](#notas-importantes)

---

## 🎯 VISÃO GERAL DO PROJETO

### Nome do Projeto
**NEWSROOMATE** - Sistema de Gerenciamento de Espelhos de Telejornais

### Descrição
Sistema completo para gerenciamento de produção jornalística televisiva, incluindo:
- Gestão de telejornais e seus espelhos
- Organização de blocos e matérias
- Sistema de pautas e reportagens
- Controle de entrevistas
- Teleprompter integrado
- Sistema de locks para edição colaborativa
- Snapshots e modelos salvos
- Realtime collaboration

### Stack Tecnológico

#### Frontend
- **React 18.3.1** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **TailwindCSS** - Framework CSS
- **React Router DOM** - Roteamento
- **TanStack Query** - Gerenciamento de estado servidor
- **Radix UI** - Componentes acessíveis
- **Hello Pangea DND** - Drag and drop
- **Supabase JS Client** - Cliente Supabase

#### Backend
- **Supabase** (PostgreSQL 15+)
- **Row Level Security (RLS)** - Segurança em nível de linha
- **Realtime** - Atualizações em tempo real
- **Edge Functions** - Processamento serverless

---

## 🏗️ ARQUITETURA DO SISTEMA

### Estrutura de Diretórios

```
newsroomate/
├── src/
│   ├── components/          # Componentes React
│   │   ├── auth/           # Autenticação
│   │   ├── news-schedule/  # Espelho principal
│   │   ├── sidebar/        # Menu lateral
│   │   ├── edit-panel/     # Painel de edição
│   │   └── ui/             # Componentes UI base
│   ├── hooks/              # Hooks customizados
│   │   ├── unified-clipboard/  # Sistema de clipboard
│   │   ├── dual-view/         # Visualização dupla
│   │   └── news-schedule/     # Lógica do espelho
│   ├── services/           # Serviços API
│   │   ├── materias-api.ts
│   │   ├── blocos-api.ts
│   │   └── telejornais-api.ts
│   ├── types/              # Definições TypeScript
│   ├── utils/              # Utilitários
│   │   ├── security-utils.ts  # Segurança
│   │   └── permission.ts      # Permissões
│   └── integrations/       # Integrações
│       └── supabase/       # Cliente Supabase
└── supabase/
    ├── config.toml         # Configuração
    ├── functions/          # Edge Functions
    └── migrations/         # Migrações SQL
```

### Fluxo de Dados

1. **Autenticação** → Supabase Auth → Profile + User Roles
2. **Telejornal** → Blocos → Matérias (hierarquia)
3. **Realtime** → Atualização automática em todos os clientes
4. **RLS Policies** → Controle de acesso granular
5. **Locks** → Prevenção de edições simultâneas

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Diagrama Entidade-Relacionamento

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
user_roles (1:N) ← NOVO SISTEMA DE SEGURANÇA
    
telejornais
    ↓
blocos
    ↓
materias → materias_locks
        → materias_snapshots
    
telejornais → pautas_telejornal
           → entrevistas
           → reportagens
           → espelhos_salvos
           
pautas (independentes)
modelos_salvos
```

### Tabelas Detalhadas

#### 1. **profiles**
Perfis de usuários do sistema.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NOT NULL | - | PK, referência auth.users |
| full_name | text | NULL | - | Nome completo |
| role | user_role | NOT NULL | 'reporter' | Role legado (deprecado) |
| created_at | timestamptz | NOT NULL | now() | Data de criação |
| updated_at | timestamptz | NOT NULL | now() | Última atualização |

**RLS Policies:**
- ✅ SELECT: Todos os usuários autenticados
- ✅ UPDATE: Apenas próprio perfil (exceto role)
- ❌ INSERT: Gerenciado por trigger
- ❌ DELETE: Não permitido

---

#### 2. **user_roles** ⭐ NOVO
Sistema de roles separado para máxima segurança.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| user_id | uuid | NOT NULL | - | FK auth.users |
| role | user_role | NOT NULL | - | Role do usuário |
| created_at | timestamptz | NOT NULL | now() | Data de criação |

**Constraint:**
- UNIQUE(user_id, role) - Previne duplicatas

**Roles Disponíveis:**
- `editor_chefe` - Acesso total
- `editor` - Gerenciamento de espelhos
- `reporter` - Criação de matérias
- `produtor` - Gestão de pautas

**RLS Policies:**
- ✅ SELECT: Próprio role + editor_chefe
- ✅ INSERT/UPDATE/DELETE: Apenas editor_chefe

---

#### 3. **telejornais**
Programas de TV/Telejornais.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| nome | text | NOT NULL | - | Nome do telejornal |
| horario | text | NULL | - | Horário de exibição |
| espelho_aberto | boolean | NULL | false | Status do espelho |
| created_at | timestamptz | NULL | now() | Data de criação |
| updated_at | timestamptz | NULL | now() | Última atualização |

**RLS Policies:**
- ✅ SELECT: Todos autenticados
- ✅ INSERT/UPDATE: Editores
- ✅ DELETE: Apenas editor_chefe

---

#### 4. **blocos**
Blocos de programação dentro de telejornais.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| telejornal_id | uuid | NULL | - | FK telejornais |
| nome | text | NOT NULL | - | Nome do bloco |
| ordem | integer | NOT NULL | - | Ordem de exibição |
| created_at | timestamptz | NULL | now() | Data de criação |
| updated_at | timestamptz | NULL | now() | Última atualização |

**RLS Policies:**
- ✅ SELECT: Todos autenticados
- ✅ INSERT/UPDATE/DELETE: Editores

---

#### 5. **materias**
Matérias jornalísticas (núcleo do sistema).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| bloco_id | uuid | NULL | - | FK blocos |
| retranca | text | NOT NULL | - | Título/identificador |
| pagina | text | NULL | - | Página no espelho |
| ordem | integer | NOT NULL | - | Ordem no bloco |
| duracao | integer | NULL | 0 | Duração em segundos |
| tipo_material | text | NULL | - | Tipo (VT, AO VIVO, etc) |
| status | text | NULL | 'draft' | Status da matéria |
| reporter | text | NULL | - | Repórter responsável |
| texto | text | NULL | - | Texto/corpo |
| cabeca | text | NULL | - | Cabeça/introdução |
| gc | text | NULL | - | Caracteres de geração |
| clip | text | NULL | - | Caminho do clip |
| tempo_clip | text | NULL | - | Duração do clip |
| equipamento | text | NULL | - | Equipamento usado |
| local_gravacao | text | NULL | - | Local de gravação |
| tags | text[] | NULL | - | Tags/categorias |
| horario_exibicao | timestamptz | NULL | - | Horário programado |
| is_from_snapshot | boolean | NULL | false | Restaurada de snapshot |
| created_at | timestamptz | NULL | now() | Data de criação |
| updated_at | timestamptz | NULL | now() | Última atualização |

**RLS Policies:**
- ✅ SELECT: Todos autenticados
- ✅ INSERT/UPDATE: Repórteres e editores
- ✅ DELETE: Apenas editores

---

#### 6. **pautas**
Pautas gerais (independentes de telejornal).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| user_id | uuid | NOT NULL | - | FK auth.users |
| telejornal_id | uuid | NULL | - | FK telejornais (opcional) |
| titulo | text | NOT NULL | - | Título da pauta |
| descricao | text | NULL | - | Descrição |
| status | text | NULL | 'pendente' | Status |
| data_cobertura | date | NULL | - | Data de cobertura |
| local | text | NULL | - | Local |
| horario | text | NULL | - | Horário |
| entrevistado | text | NULL | - | Entrevistado |
| produtor | text | NULL | - | Produtor |
| reporter | text | NULL | - | Repórter |
| proposta | text | NULL | - | Proposta |
| encaminhamento | text | NULL | - | Encaminhamento |
| informacoes | text | NULL | - | Informações extras |
| programa | text | NULL | - | Programa |
| created_at | timestamptz | NULL | now() | Data de criação |
| updated_at | timestamptz | NULL | now() | Última atualização |

**RLS Policies:**
- ✅ SELECT: Todos autenticados
- ✅ INSERT/UPDATE/DELETE: Produtores e proprietários

---

#### 7. **pautas_telejornal**
Pautas específicas de telejornais.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| telejornal_id | uuid | NOT NULL | - | FK telejornais |
| user_id | uuid | NOT NULL | - | FK auth.users |
| titulo | text | NOT NULL | - | Título |
| descricao | text | NULL | - | Descrição |
| status | text | NULL | 'pendente' | Status |
| data_cobertura | date | NULL | - | Data |
| [demais campos iguais a pautas] | ... | ... | ... | ... |

**RLS Policies:**
- ✅ SELECT: Todos autenticados
- ✅ INSERT/UPDATE/DELETE: Produtores e proprietários

---

#### 8. **entrevistas**
Registro de entrevistas agendadas/realizadas.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| telejornal_id | uuid | NOT NULL | - | FK telejornais |
| user_id | uuid | NULL | - | FK auth.users |
| titulo | text | NOT NULL | - | Título |
| entrevistado | text | NOT NULL | - | Nome do entrevistado |
| descricao | text | NULL | - | Descrição |
| local | text | NULL | - | Local |
| horario | text | NULL | - | Horário |
| data_entrevista | date | NULL | - | Data |
| status | text | NULL | 'agendada' | Status |
| created_at | timestamptz | NULL | now() | Data de criação |
| updated_at | timestamptz | NULL | now() | Última atualização |

**RLS Policies:**
- ✅ SELECT: Todos autenticados
- ✅ INSERT/UPDATE/DELETE: Apenas proprietário

---

#### 9. **reportagens**
Reportagens gravadas.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| telejornal_id | uuid | NOT NULL | - | FK telejornais |
| user_id | uuid | NULL | - | FK auth.users |
| retranca | text | NOT NULL | - | Retranca |
| corpo_materia | text | NULL | - | Corpo da matéria |
| reporter | text | NULL | - | Repórter |
| local | text | NULL | - | Local |
| data_gravacao | date | NULL | - | Data de gravação |
| status | text | NULL | 'em_producao' | Status |
| created_at | timestamptz | NULL | now() | Data de criação |
| updated_at | timestamptz | NULL | now() | Última atualização |

**RLS Policies:**
- ✅ SELECT: Todos autenticados
- ✅ INSERT/UPDATE/DELETE: Apenas proprietário

---

#### 10. **materias_locks**
Sistema de lock para edição colaborativa.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| materia_id | uuid | NOT NULL | - | FK materias |
| user_id | uuid | NOT NULL | - | FK auth.users |
| locked_at | timestamptz | NOT NULL | now() | Momento do lock |
| expires_at | timestamptz | NOT NULL | now() + 30min | Expiração |
| created_at | timestamptz | NOT NULL | now() | Data de criação |

**RLS Policies:**
- ✅ SELECT: Todos autenticados
- ✅ INSERT/UPDATE/DELETE: Apenas proprietário do lock

**Limpeza Automática:**
- Trigger remove locks expirados automaticamente

---

#### 11. **espelhos_salvos**
Snapshots completos de espelhos fechados.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| telejornal_id | uuid | NOT NULL | - | FK telejornais |
| nome | text | NOT NULL | - | Nome do snapshot |
| data_referencia | date | NOT NULL | - | Data do espelho |
| data_salvamento | timestamptz | NOT NULL | now() | Momento do salvamento |
| estrutura | jsonb | NOT NULL | - | Estrutura completa (JSON) |
| created_at | timestamptz | NOT NULL | now() | Data de criação |
| updated_at | timestamptz | NOT NULL | now() | Última atualização |

**RLS Policies:**
- ✅ SELECT/INSERT/UPDATE/DELETE: Apenas editores

---

#### 12. **materias_snapshots**
Snapshots individuais de matérias.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| materia_original_id | uuid | NULL | - | Referência à matéria original |
| snapshot_id | uuid | NULL | - | ID do snapshot relacionado |
| bloco_nome | text | NULL | - | Nome do bloco |
| bloco_ordem | integer | NULL | - | Ordem do bloco |
| ordem | integer | NOT NULL | 1 | Ordem da matéria |
| is_snapshot | boolean | NULL | true | Flag de snapshot |
| [demais campos iguais a materias] | ... | ... | ... | ... |

**RLS Policies:**
- ✅ SELECT: Editores
- ✅ INSERT: Todos autenticados
- ✅ UPDATE/DELETE: Editores

---

#### 13. **modelos_salvos**
Modelos de espelho reutilizáveis.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| id | uuid | NOT NULL | gen_random_uuid() | PK |
| nome | text | NOT NULL | - | Nome do modelo |
| descricao | text | NULL | - | Descrição |
| estrutura | jsonb | NOT NULL | - | Estrutura do modelo (JSON) |
| created_at | timestamptz | NOT NULL | now() | Data de criação |
| updated_at | timestamptz | NOT NULL | now() | Última atualização |

**RLS Policies:**
- ✅ SELECT/INSERT/UPDATE/DELETE: Todos autenticados

---

## 🔒 SISTEMA DE SEGURANÇA

### Migração de Segurança (25/10/2025)

**Problema Original:**
- Roles armazenadas na tabela `profiles`
- Verificações de autorização apenas no frontend
- Vulnerabilidade de escalação de privilégios

**Solução Implementada:**
- ✅ Tabela `user_roles` separada
- ✅ Funções `SECURITY DEFINER` para verificação
- ✅ RLS policies reforçadas em todas as tabelas
- ✅ Usuários não podem modificar próprias roles

### Funções de Segurança (SECURITY DEFINER)

#### 1. **has_role(_user_id uuid, _role user_role)**
Verifica se usuário tem role específica.

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;
```

**Uso:** `has_role(auth.uid(), 'editor_chefe')`

---

#### 2. **is_editor(_user_id uuid)**
Verifica se é editor ou editor_chefe.

```sql
CREATE OR REPLACE FUNCTION public.is_editor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('editor', 'editor_chefe')
  )
$function$;
```

---

#### 3. **is_editor_chefe(_user_id uuid)**
Verifica se é editor-chefe.

```sql
CREATE OR REPLACE FUNCTION public.is_editor_chefe(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'editor_chefe'
  )
$function$;
```

---

#### 4. **can_modify_pautas(_user_id uuid)**
Verifica permissão para modificar pautas.

```sql
CREATE OR REPLACE FUNCTION public.can_modify_pautas(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('produtor', 'editor_chefe')
  )
$function$;
```

---

#### 5. **can_modify_materias(_user_id uuid)**
Verifica permissão para modificar matérias.

```sql
CREATE OR REPLACE FUNCTION public.can_modify_materias(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('reporter', 'editor', 'editor_chefe')
  )
$function$;
```

---

### Funções Auxiliares

#### 6. **handle_new_user()**
Cria perfil automaticamente ao criar usuário.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'reporter'::public.user_role)
  );
  RETURN NEW;
END;
$function$;
```

---

#### 7. **handle_new_user_role()**
Atribui role padrão ao criar usuário.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'reporter'::user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$function$;
```

---

#### 8. **update_updated_at_column()**
Atualiza timestamp automaticamente.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
```

---

#### 9. **cleanup_expired_locks()**
Remove locks expirados.

```sql
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.materias_locks 
  WHERE expires_at < now();
END;
$function$;
```

---

#### 10. **cleanup_expired_locks_trigger()**
Trigger para limpeza de locks.

```sql
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.cleanup_expired_locks();
  RETURN NEW;
END;
$function$;
```

---

### Hierarquia de Permissões

```
editor_chefe (Administrador)
    ├── Gerenciar todos os roles
    ├── Deletar telejornais
    ├── Todas as permissões de editor
    └── Acesso total
    
editor (Gerente de Produção)
    ├── Criar/editar telejornais
    ├── Criar/editar blocos
    ├── Editar/deletar matérias
    ├── Criar espelhos salvos
    └── Visualizar snapshots
    
reporter (Jornalista)
    ├── Criar/editar matérias
    ├── Visualizar tudo
    └── Criar snapshots
    
produtor (Produtor)
    ├── Criar/editar pautas
    ├── Visualizar tudo
    └── Criar snapshots
```

---

## 📝 SCHEMA SQL COMPLETO

### Script de Criação Completo

```sql
-- =====================================================
-- NEWSROOMATE - Schema Completo do Banco de Dados
-- Data: 25/10/2025
-- Versão: 2.0
-- =====================================================

-- -----------------------------------------------------
-- 1. LIMPEZA (Executar apenas em ambiente novo)
-- -----------------------------------------------------

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_telejornais_updated_at ON telejornais;
DROP TRIGGER IF EXISTS update_blocos_updated_at ON blocos;
DROP TRIGGER IF EXISTS update_materias_updated_at ON materias;
DROP TRIGGER IF EXISTS update_pautas_updated_at ON pautas;
DROP TRIGGER IF EXISTS update_pautas_telejornal_updated_at ON pautas_telejornal;
DROP TRIGGER IF EXISTS update_espelhos_salvos_updated_at ON espelhos_salvos;
DROP TRIGGER IF EXISTS update_modelos_salvos_updated_at ON modelos_salvos;

-- Drop tables
DROP TABLE IF EXISTS public.materias_snapshots CASCADE;
DROP TABLE IF EXISTS public.espelhos_salvos CASCADE;
DROP TABLE IF EXISTS public.modelos_salvos CASCADE;
DROP TABLE IF EXISTS public.materias_locks CASCADE;
DROP TABLE IF EXISTS public.reportagens CASCADE;
DROP TABLE IF EXISTS public.entrevistas CASCADE;
DROP TABLE IF EXISTS public.pautas_telejornal CASCADE;
DROP TABLE IF EXISTS public.materias CASCADE;
DROP TABLE IF EXISTS public.pautas CASCADE;
DROP TABLE IF EXISTS public.blocos CASCADE;
DROP TABLE IF EXISTS public.telejornais CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_locks() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_locks_trigger() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, user_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_editor(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_editor_chefe(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_modify_pautas(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_modify_materias(uuid) CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.user_role CASCADE;

-- -----------------------------------------------------
-- 2. TIPOS CUSTOMIZADOS
-- -----------------------------------------------------

CREATE TYPE public.user_role AS ENUM (
  'editor_chefe',
  'editor',
  'reporter',
  'produtor'
);

-- -----------------------------------------------------
-- 3. FUNÇÕES DE SEGURANÇA (SECURITY DEFINER)
-- -----------------------------------------------------

-- Função para verificar role específica
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para verificar se é editor (editor ou editor_chefe)
CREATE OR REPLACE FUNCTION public.is_editor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('editor', 'editor_chefe')
  )
$$;

-- Função para verificar se é editor_chefe
CREATE OR REPLACE FUNCTION public.is_editor_chefe(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'editor_chefe'
  )
$$;

-- Função para verificar permissão de modificar pautas
CREATE OR REPLACE FUNCTION public.can_modify_pautas(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('produtor', 'editor_chefe')
  )
$$;

-- Função para verificar permissão de modificar matérias
CREATE OR REPLACE FUNCTION public.can_modify_materias(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role IN ('reporter', 'editor', 'editor_chefe')
  )
$$;

-- Função para criar perfil ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'reporter'::public.user_role)
  );
  RETURN NEW;
END;
$$;

-- Função para atribuir role padrão ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'reporter'::user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Função para atualizar timestamp updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Função para limpar locks expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.materias_locks 
  WHERE expires_at < now();
END;
$$;

-- Função trigger para limpar locks expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_locks_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.cleanup_expired_locks();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------
-- 4. TABELAS
-- -----------------------------------------------------

-- Perfis de usuário
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role public.user_role NOT NULL DEFAULT 'reporter'::public.user_role,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de roles (NOVO SISTEMA DE SEGURANÇA)
CREATE TABLE public.user_roles (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Telejornais
CREATE TABLE public.telejornais (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  horario text,
  espelho_aberto boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Blocos
CREATE TABLE public.blocos (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid REFERENCES public.telejornais(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ordem integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Matérias
CREATE TABLE public.materias (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  bloco_id uuid REFERENCES public.blocos(id) ON DELETE CASCADE,
  retranca text NOT NULL,
  pagina text,
  ordem integer NOT NULL,
  duracao integer DEFAULT 0,
  tipo_material text,
  status text DEFAULT 'draft',
  reporter text,
  texto text,
  cabeca text,
  gc text,
  clip text,
  tempo_clip text,
  equipamento text,
  local_gravacao text,
  tags text[],
  horario_exibicao timestamp with time zone,
  is_from_snapshot boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Pautas (independentes)
CREATE TABLE public.pautas (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telejornal_id uuid REFERENCES public.telejornais(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descricao text,
  status text DEFAULT 'pendente',
  data_cobertura date,
  local text,
  horario text,
  entrevistado text,
  produtor text,
  reporter text,
  proposta text,
  encaminhamento text,
  informacoes text,
  programa text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Pautas de telejornal
CREATE TABLE public.pautas_telejornal (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid NOT NULL REFERENCES public.telejornais(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  status text DEFAULT 'pendente',
  data_cobertura date,
  local text,
  horario text,
  entrevistado text,
  produtor text,
  reporter text,
  proposta text,
  encaminhamento text,
  informacoes text,
  programa text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Entrevistas
CREATE TABLE public.entrevistas (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid NOT NULL REFERENCES public.telejornais(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  entrevistado text NOT NULL,
  descricao text,
  local text,
  horario text,
  data_entrevista date,
  status text DEFAULT 'agendada',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Reportagens
CREATE TABLE public.reportagens (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid NOT NULL REFERENCES public.telejornais(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  retranca text NOT NULL,
  corpo_materia text,
  reporter text,
  local text,
  data_gravacao date,
  status text DEFAULT 'em_producao',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Locks de matérias
CREATE TABLE public.materias_locks (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id uuid NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Espelhos salvos
CREATE TABLE public.espelhos_salvos (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  telejornal_id uuid NOT NULL REFERENCES public.telejornais(id) ON DELETE CASCADE,
  nome text NOT NULL,
  data_referencia date NOT NULL,
  data_salvamento timestamp with time zone NOT NULL DEFAULT now(),
  estrutura jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Snapshots de matérias
CREATE TABLE public.materias_snapshots (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_original_id uuid,
  snapshot_id uuid,
  bloco_nome text,
  bloco_ordem integer,
  ordem integer NOT NULL DEFAULT 1,
  is_snapshot boolean DEFAULT true,
  retranca text NOT NULL,
  pagina text,
  duracao integer DEFAULT 0,
  tipo_material text,
  status text DEFAULT 'draft',
  reporter text,
  texto text,
  cabeca text,
  gc text,
  clip text,
  tempo_clip text,
  equipamento text,
  local_gravacao text,
  tags text[],
  horario_exibicao timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Modelos salvos
CREATE TABLE public.modelos_salvos (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  estrutura jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- -----------------------------------------------------
-- 5. TRIGGERS
-- -----------------------------------------------------

-- Trigger para criar perfil ao registrar usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atribuir role ao registrar usuário
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telejornais_updated_at
  BEFORE UPDATE ON public.telejornais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blocos_updated_at
  BEFORE UPDATE ON public.blocos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materias_updated_at
  BEFORE UPDATE ON public.materias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pautas_updated_at
  BEFORE UPDATE ON public.pautas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pautas_telejornal_updated_at
  BEFORE UPDATE ON public.pautas_telejornal
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_espelhos_salvos_updated_at
  BEFORE UPDATE ON public.espelhos_salvos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modelos_salvos_updated_at
  BEFORE UPDATE ON public.modelos_salvos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- -----------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telejornais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pautas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pautas_telejornal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrevistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espelhos_salvos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_salvos ENABLE ROW LEVEL SECURITY;

-- Policies para PROFILES
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile excluding role" ON public.profiles;
CREATE POLICY "Users can update their own profile excluding role"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policies para USER_ROLES
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_editor_chefe(auth.uid()));

DROP POLICY IF EXISTS "Only editor_chefe can manage roles" ON public.user_roles;
CREATE POLICY "Only editor_chefe can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (is_editor_chefe(auth.uid()));

-- Policies para TELEJORNAIS
DROP POLICY IF EXISTS "All authenticated users can view telejornais" ON public.telejornais;
CREATE POLICY "All authenticated users can view telejornais"
  ON public.telejornais FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Editors can create telejornais" ON public.telejornais;
CREATE POLICY "Editors can create telejornais"
  ON public.telejornais FOR INSERT
  TO authenticated
  WITH CHECK (is_editor(auth.uid()));

DROP POLICY IF EXISTS "Editors can update telejornais" ON public.telejornais;
CREATE POLICY "Editors can update telejornais"
  ON public.telejornais FOR UPDATE
  TO authenticated
  USING (is_editor(auth.uid()));

DROP POLICY IF EXISTS "Only editor_chefe can delete telejornais" ON public.telejornais;
CREATE POLICY "Only editor_chefe can delete telejornais"
  ON public.telejornais FOR DELETE
  TO authenticated
  USING (is_editor_chefe(auth.uid()));

-- Policies para BLOCOS
DROP POLICY IF EXISTS "All authenticated users can view blocos" ON public.blocos;
CREATE POLICY "All authenticated users can view blocos"
  ON public.blocos FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Editors can create blocos" ON public.blocos;
CREATE POLICY "Editors can create blocos"
  ON public.blocos FOR INSERT
  TO authenticated
  WITH CHECK (is_editor(auth.uid()));

DROP POLICY IF EXISTS "Editors can update blocos" ON public.blocos;
CREATE POLICY "Editors can update blocos"
  ON public.blocos FOR UPDATE
  TO authenticated
  USING (is_editor(auth.uid()));

DROP POLICY IF EXISTS "Editors can delete blocos" ON public.blocos;
CREATE POLICY "Editors can delete blocos"
  ON public.blocos FOR DELETE
  TO authenticated
  USING (is_editor(auth.uid()));

-- Policies para MATERIAS
DROP POLICY IF EXISTS "All authenticated users can view materias" ON public.materias;
CREATE POLICY "All authenticated users can view materias"
  ON public.materias FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Reporters and editors can create materias" ON public.materias;
CREATE POLICY "Reporters and editors can create materias"
  ON public.materias FOR INSERT
  TO authenticated
  WITH CHECK (can_modify_materias(auth.uid()));

DROP POLICY IF EXISTS "Reporters and editors can update materias" ON public.materias;
CREATE POLICY "Reporters and editors can update materias"
  ON public.materias FOR UPDATE
  TO authenticated
  USING (can_modify_materias(auth.uid()));

DROP POLICY IF EXISTS "Editors can delete materias" ON public.materias;
CREATE POLICY "Editors can delete materias"
  ON public.materias FOR DELETE
  TO authenticated
  USING (is_editor(auth.uid()));

-- Policies para PAUTAS
DROP POLICY IF EXISTS "All authenticated users can view pautas" ON public.pautas;
CREATE POLICY "All authenticated users can view pautas"
  ON public.pautas FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Produtores and owners can create pautas" ON public.pautas;
CREATE POLICY "Produtores and owners can create pautas"
  ON public.pautas FOR INSERT
  TO authenticated
  WITH CHECK (can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Produtores and owners can update pautas" ON public.pautas;
CREATE POLICY "Produtores and owners can update pautas"
  ON public.pautas FOR UPDATE
  TO authenticated
  USING (can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Produtores and owners can delete pautas" ON public.pautas;
CREATE POLICY "Produtores and owners can delete pautas"
  ON public.pautas FOR DELETE
  TO authenticated
  USING (can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

-- Policies para PAUTAS_TELEJORNAL
DROP POLICY IF EXISTS "All authenticated users can view pautas_telejornal" ON public.pautas_telejornal;
CREATE POLICY "All authenticated users can view pautas_telejornal"
  ON public.pautas_telejornal FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Produtores and owners can create pautas_telejornal" ON public.pautas_telejornal;
CREATE POLICY "Produtores and owners can create pautas_telejornal"
  ON public.pautas_telejornal FOR INSERT
  TO authenticated
  WITH CHECK (can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Produtores and owners can update pautas_telejornal" ON public.pautas_telejornal;
CREATE POLICY "Produtores and owners can update pautas_telejornal"
  ON public.pautas_telejornal FOR UPDATE
  TO authenticated
  USING (can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Produtores and owners can delete pautas_telejornal" ON public.pautas_telejornal;
CREATE POLICY "Produtores and owners can delete pautas_telejornal"
  ON public.pautas_telejornal FOR DELETE
  TO authenticated
  USING (can_modify_pautas(auth.uid()) OR auth.uid() = user_id);

-- Policies para ENTREVISTAS
DROP POLICY IF EXISTS "Authenticated users can view entrevistas" ON public.entrevistas;
CREATE POLICY "Authenticated users can view entrevistas"
  ON public.entrevistas FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create entrevistas" ON public.entrevistas;
CREATE POLICY "Users can create entrevistas"
  ON public.entrevistas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their entrevistas" ON public.entrevistas;
CREATE POLICY "Users can update their entrevistas"
  ON public.entrevistas FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their entrevistas" ON public.entrevistas;
CREATE POLICY "Users can delete their entrevistas"
  ON public.entrevistas FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies para REPORTAGENS
DROP POLICY IF EXISTS "Authenticated users can view reportagens" ON public.reportagens;
CREATE POLICY "Authenticated users can view reportagens"
  ON public.reportagens FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create reportagens" ON public.reportagens;
CREATE POLICY "Users can create reportagens"
  ON public.reportagens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their reportagens" ON public.reportagens;
CREATE POLICY "Users can update their reportagens"
  ON public.reportagens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their reportagens" ON public.reportagens;
CREATE POLICY "Users can delete their reportagens"
  ON public.reportagens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies para MATERIAS_LOCKS
DROP POLICY IF EXISTS "Users can view all materias locks" ON public.materias_locks;
CREATE POLICY "Users can view all materias locks"
  ON public.materias_locks FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create their own locks" ON public.materias_locks;
CREATE POLICY "Users can create their own locks"
  ON public.materias_locks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own locks" ON public.materias_locks;
CREATE POLICY "Users can update their own locks"
  ON public.materias_locks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own locks" ON public.materias_locks;
CREATE POLICY "Users can delete their own locks"
  ON public.materias_locks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies para ESPELHOS_SALVOS
DROP POLICY IF EXISTS "Editors can view espelhos_salvos" ON public.espelhos_salvos;
CREATE POLICY "Editors can view espelhos_salvos"
  ON public.espelhos_salvos FOR SELECT
  TO authenticated
  USING (is_editor(auth.uid()));

DROP POLICY IF EXISTS "Editors can create espelhos_salvos" ON public.espelhos_salvos;
CREATE POLICY "Editors can create espelhos_salvos"
  ON public.espelhos_salvos FOR INSERT
  TO authenticated
  WITH CHECK (is_editor(auth.uid()));

DROP POLICY IF EXISTS "Editors can update espelhos_salvos" ON public.espelhos_salvos;
CREATE POLICY "Editors can update espelhos_salvos"
  ON public.espelhos_salvos FOR UPDATE
  TO authenticated
  USING (is_editor(auth.uid()));

DROP POLICY IF EXISTS "Editors can delete espelhos_salvos" ON public.espelhos_salvos;
CREATE POLICY "Editors can delete espelhos_salvos"
  ON public.espelhos_salvos FOR DELETE
  TO authenticated
  USING (is_editor(auth.uid()));

-- Policies para MATERIAS_SNAPSHOTS
DROP POLICY IF EXISTS "Editors can view materias_snapshots" ON public.materias_snapshots;
CREATE POLICY "Editors can view materias_snapshots"
  ON public.materias_snapshots FOR SELECT
  TO authenticated
  USING (is_editor(auth.uid()));

DROP POLICY IF EXISTS "All authenticated users can create materias_snapshots" ON public.materias_snapshots;
CREATE POLICY "All authenticated users can create materias_snapshots"
  ON public.materias_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Editors can update materias_snapshots" ON public.materias_snapshots;
CREATE POLICY "Editors can update materias_snapshots"
  ON public.materias_snapshots FOR UPDATE
  TO authenticated
  USING (is_editor(auth.uid()));

DROP POLICY IF EXISTS "Editors can delete materias_snapshots" ON public.materias_snapshots;
CREATE POLICY "Editors can delete materias_snapshots"
  ON public.materias_snapshots FOR DELETE
  TO authenticated
  USING (is_editor(auth.uid()));

-- Policies para MODELOS_SALVOS
DROP POLICY IF EXISTS "Authenticated users can view modelos_salvos" ON public.modelos_salvos;
CREATE POLICY "Authenticated users can view modelos_salvos"
  ON public.modelos_salvos FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create modelos_salvos" ON public.modelos_salvos;
CREATE POLICY "Authenticated users can create modelos_salvos"
  ON public.modelos_salvos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update modelos_salvos" ON public.modelos_salvos;
CREATE POLICY "Authenticated users can update modelos_salvos"
  ON public.modelos_salvos FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete modelos_salvos" ON public.modelos_salvos;
CREATE POLICY "Authenticated users can delete modelos_salvos"
  ON public.modelos_salvos FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- -----------------------------------------------------
-- 7. CONFIGURAÇÃO DE REALTIME
-- -----------------------------------------------------

-- Habilitar REPLICA IDENTITY FULL para todas as tabelas
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.telejornais REPLICA IDENTITY FULL;
ALTER TABLE public.blocos REPLICA IDENTITY FULL;
ALTER TABLE public.materias REPLICA IDENTITY FULL;
ALTER TABLE public.pautas REPLICA IDENTITY FULL;
ALTER TABLE public.pautas_telejornal REPLICA IDENTITY FULL;
ALTER TABLE public.entrevistas REPLICA IDENTITY FULL;
ALTER TABLE public.reportagens REPLICA IDENTITY FULL;
ALTER TABLE public.materias_locks REPLICA IDENTITY FULL;
ALTER TABLE public.espelhos_salvos REPLICA IDENTITY FULL;
ALTER TABLE public.materias_snapshots REPLICA IDENTITY FULL;
ALTER TABLE public.modelos_salvos REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação do Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.telejornais;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.materias;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pautas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pautas_telejornal;
ALTER PUBLICATION supabase_realtime ADD TABLE public.entrevistas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reportagens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.materias_locks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.espelhos_salvos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.materias_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.modelos_salvos;

-- =====================================================
-- SCHEMA COMPLETO CRIADO COM SUCESSO!
-- =====================================================
```

---

## 📊 DADOS DE EXEMPLO

### Script de População de Dados

```sql
-- =====================================================
-- NEWSROOMATE - Dados de Exemplo
-- Data: 25/10/2025
-- =====================================================

-- NOTA: Primeiro você precisa criar usuários via Supabase Auth
-- Depois execute este script para popular os dados

-- -----------------------------------------------------
-- 1. TELEJORNAIS (5 programas)
-- -----------------------------------------------------

INSERT INTO public.telejornais (id, nome, horario, espelho_aberto) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'NTU', '19:30', false),
('550e8400-e29b-41d4-a716-446655440002', 'Conversa Afiada', '18:30', false),
('550e8400-e29b-41d4-a716-446655440003', 'NTU - Edição Especial', '13:00', false),
('550e8400-e29b-41d4-a716-446655440004', 'Telejornal da Manhã', '08:00', false),
('550e8400-e29b-41d4-a716-446655440005', 'Telejornal da Noite', '20:30', false);

-- -----------------------------------------------------
-- 2. BLOCOS (9 blocos distribuídos)
-- -----------------------------------------------------

-- Blocos para NTU (19:30)
INSERT INTO public.blocos (id, telejornal_id, nome, ordem) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Bloco 1', 1),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Bloco 2', 2),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Bloco 3', 3);

-- Blocos para Conversa Afiada (18:30)
INSERT INTO public.blocos (id, telejornal_id, nome, ordem) VALUES
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Abertura', 1),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Principal', 2),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Encerramento', 3);

-- Blocos para Telejornal da Manhã
INSERT INTO public.blocos (id, telejornal_id, nome, ordem) VALUES
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440004', 'Primeira Hora', 1),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 'Segunda Hora', 2),
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'Encerramento', 3);

-- -----------------------------------------------------
-- 3. EXEMPLO DE USUÁRIO ROLES
-- (Substitua os IDs pelos UUIDs reais dos seus usuários)
-- -----------------------------------------------------

-- EXEMPLO - Substitua 'USER_UUID_HERE' pelo UUID real do usuário
-- INSERT INTO public.user_roles (user_id, role) VALUES
-- ('USER_UUID_HERE', 'editor_chefe');

-- -----------------------------------------------------
-- 4. EXEMPLO DE MATÉRIAS
-- (Exemplo de estrutura para popular)
-- -----------------------------------------------------

-- Matérias para NTU - Bloco 1
INSERT INTO public.materias (
  bloco_id,
  retranca,
  pagina,
  ordem,
  duracao,
  tipo_material,
  status,
  reporter,
  texto,
  cabeca
) VALUES
(
  '650e8400-e29b-41d4-a716-446655440001',
  'CABEÇA POLÍTICA',
  '01',
  1,
  30,
  'NOTA SIMPLES',
  'draft',
  'Ana Silva',
  'Texto da nota sobre política nacional...',
  'O governo federal anunciou hoje...'
),
(
  '650e8400-e29b-41d4-a716-446655440001',
  'ECONOMIA HOJE',
  '02',
  2,
  90,
  'VT',
  'draft',
  'Carlos Santos',
  'Reportagem completa sobre economia...',
  'O dólar fechou em alta nesta quinta-feira...'
),
(
  '650e8400-e29b-41d4-a716-446655440001',
  'SAÚDE PÚBLICA',
  '03',
  3,
  60,
  'AO VIVO',
  'draft',
  'Mariana Costa',
  'Ao vivo sobre campanha de vacinação...',
  'Nossa repórter está no centro de vacinação...'
);

-- -----------------------------------------------------
-- 5. EXEMPLO DE PAUTAS
-- -----------------------------------------------------

-- EXEMPLO - Substitua 'USER_UUID_HERE' pelo UUID real
-- INSERT INTO public.pautas (
--   user_id,
--   telejornal_id,
--   titulo,
--   descricao,
--   status,
--   data_cobertura,
--   local
-- ) VALUES
-- (
--   'USER_UUID_HERE',
--   '550e8400-e29b-41d4-a716-446655440001',
--   'Inauguração de Hospital',
--   'Cobertura da inauguração do novo hospital municipal',
--   'aprovada',
--   CURRENT_DATE + 1,
--   'Hospital Municipal Central'
-- );

-- =====================================================
-- DADOS DE EXEMPLO CRIADOS COM SUCESSO!
-- =====================================================
```

---

## ⚙️ CONFIGURAÇÕES DO SUPABASE

### config.toml

```toml
[auth]
enabled = true
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = ["https://127.0.0.1:3000"]
jwt_expiry = 3600
enable_signup = true
email_double_confirm_changes = true
enable_anonymous_sign_ins = false

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false  # Auto-confirm para desenvolvimento

[db]
major_version = 15

[realtime]
enabled = true

[storage]
enabled = true
file_size_limit = "50MiB"
```

### Variáveis de Ambiente (.env)

```env
# Substituir pelos valores do seu projeto Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon
VITE_SUPABASE_PROJECT_ID=seu-project-id
```

---

## 🚀 INSTRUÇÕES DE RESTAURAÇÃO

### Passo 1: Criar Projeto Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Crie novo projeto
3. Anote as credenciais:
   - Project URL
   - Anon Key
   - Service Role Key
   - Project ID

### Passo 2: Executar Migration SQL

1. Acesse SQL Editor no Supabase Dashboard
2. Cole e execute o **Schema SQL Completo** (seção 5)
3. Aguarde finalização (pode levar 1-2 minutos)

### Passo 3: Popular Dados Iniciais

1. No SQL Editor, execute o **Script de População** (seção 6)
2. Crie usuários de teste via Authentication → Users
3. Atualize os UUIDs nos scripts de exemplo
4. Execute os inserts de user_roles e pautas

### Passo 4: Configurar Frontend

1. Clone o repositório do projeto
2. Crie arquivo `.env` com as variáveis do Passo 1
3. Instale dependências:
```bash
npm install
```

4. Execute o projeto:
```bash
npm run dev
```

### Passo 5: Verificar Funcionamento

Execute o checklist de verificação (seção 9)

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### 1. Verificar Tabelas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Esperado:** 13 tabelas (profiles, user_roles, telejornais, blocos, materias, pautas, pautas_telejornal, entrevistas, reportagens, materias_locks, espelhos_salvos, materias_snapshots, modelos_salvos)

### 2. Verificar Funções

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Esperado:** 10 funções

### 3. Verificar RLS Policies

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Esperado:** 32+ políticas

### 4. Verificar Triggers

```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

**Esperado:** 10+ triggers

### 5. Verificar Realtime

```sql
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

**Esperado:** 13 tabelas habilitadas

### 6. Testar Criação de Usuário

1. Registre novo usuário via interface
2. Verifique se profile foi criado:
```sql
SELECT id, full_name, role FROM public.profiles;
```
3. Verifique se role foi atribuída:
```sql
SELECT user_id, role FROM public.user_roles;
```

### 7. Testar RLS Policies

```sql
-- Como usuário autenticado, deve funcionar
SELECT * FROM public.telejornais;

-- Como usuário não-editor, deve falhar
INSERT INTO public.telejornais (nome) VALUES ('Teste');
```

### 8. Testar Realtime (Frontend)

```typescript
// Deve receber atualizações em tempo real
const channel = supabase
  .channel('test')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'materias'
  }, (payload) => console.log(payload))
  .subscribe();
```

### 9. Verificar Locks Automáticos

```sql
-- Criar lock
INSERT INTO materias_locks (materia_id, user_id, expires_at)
VALUES (
  'algum-uuid',
  auth.uid(),
  now() - interval '1 hour'  -- Expirado
);

-- Aguardar 1 segundo e verificar se foi removido
SELECT COUNT(*) FROM materias_locks WHERE expires_at < now();
-- Deve retornar 0
```

### 10. Verificar Dados Iniciais

```sql
-- 5 telejornais
SELECT COUNT(*) FROM telejornais;

-- 9 blocos
SELECT COUNT(*) FROM blocos;

-- Pelo menos 1 usuário
SELECT COUNT(*) FROM profiles;
```

---

## 📝 NOTAS IMPORTANTES

### Diferenças em Relação aos Dumps Anteriores

1. **Sistema de Roles Separado (⭐ NOVO)**
   - Tabela `user_roles` independente
   - Prevenção de escalação de privilégios
   - Segurança reforçada

2. **Funções SECURITY DEFINER**
   - 5 funções de verificação de roles
   - Evita recursão infinita em RLS
   - Execução com privilégios elevados

3. **RLS Policies Reforçadas**
   - Todas usam funções SECURITY DEFINER
   - Verificação em nível de banco de dados
   - Frontend não pode bypasear

4. **Correções de Segurança**
   - ✅ Roles não podem ser modificadas pelos usuários
   - ✅ Autorização server-side obrigatória
   - ✅ Separação de concerns (profiles vs roles)

### Limitações Conhecidas

1. **Leaked Password Protection**
   - Warning no Supabase (não crítico)
   - Requer configuração manual no dashboard
   - Caminho: Auth → Password Security

2. **Triggers em auth.users**
   - Requer permissões especiais
   - Verificar execução ao criar usuários

3. **Performance em Larga Escala**
   - RLS pode impactar performance com milhares de registros
   - Considerar índices adicionais se necessário

### Recomendações

1. **Backup Regular**
   - Configurar backup automático no Supabase
   - Exportar dumps periódicos

2. **Monitoramento**
   - Ativar alertas de erros no Supabase
   - Monitorar uso de realtime

3. **Segurança**
   - Nunca expor service_role_key no frontend
   - Usar HTTPS em produção
   - Ativar 2FA para contas admin

4. **Performance**
   - Criar índices adicionais conforme necessidade
   - Monitorar queries lentas
   - Usar paginação para grandes datasets

---

## 🔄 ATUALIZAÇÃO E MANUTENÇÃO

### Como Adicionar Nova Funcionalidade

1. Criar migração SQL no diretório `supabase/migrations/`
2. Incluir:
   - Criação de tabelas/colunas
   - RLS policies
   - Triggers necessários
   - Atualização de funções
3. Testar em ambiente de desenvolvimento
4. Aplicar em produção via Supabase CLI

### Como Modificar Permissões

1. Identificar a função SECURITY DEFINER relevante
2. Atualizar a lógica SQL da função
3. Recriar a função com `CREATE OR REPLACE`
4. Testar com diferentes roles

### Como Adicionar Nova Role

1. Atualizar enum:
```sql
ALTER TYPE user_role ADD VALUE 'nova_role';
```

2. Criar função de verificação:
```sql
CREATE FUNCTION is_nova_role(_user_id uuid) ...
```

3. Atualizar RLS policies conforme necessário

---

## 📚 RECURSOS ADICIONAIS

### Documentação

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [React Query Docs](https://tanstack.com/query/latest)

### Suporte

- Issues GitHub: [link-do-repositorio]
- Email: suporte@newsroomate.com
- Documentação interna: `/docs`

---

## ⚖️ LICENÇA E CRÉDITOS

**Newsroomate** © 2025  
Sistema de Gerenciamento de Espelhos de Telejornais

Desenvolvido com:
- ❤️ React + TypeScript
- 🗄️ Supabase (PostgreSQL)
- 🎨 TailwindCSS
- 🔒 Row Level Security

---

**FIM DO DUMP COMPLETO**

Este documento contém todas as informações necessárias para recriar o projeto Newsroomate do zero. Para suporte adicional, consulte a documentação ou entre em contato com a equipe de desenvolvimento.

**Última atualização:** 25 de Outubro de 2025  
**Versão do Schema:** 2.0 (Pós-Migração de Segurança)