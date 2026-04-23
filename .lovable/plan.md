

# Painel de Produção (Pautas) em Nova Janela

Replicar a interface de pautas do projeto **DEMONSTRAÇÃO TV Sucesso** — um painel dedicado à equipe de produção com **Kanban**, **Calendário** e **Agenda de Contatos** — abrindo em uma **nova janela do navegador** a partir do menu principal.

## O que será entregue

1. **Nova rota `/producao`** — página dedicada em tela cheia, sem o sidebar/edit panel do app principal.
2. **Botão no Menu Principal** — opção "Painel de Produção" que faz `window.open('/producao', ...)` em uma nova janela/aba.
3. **Três abas dentro do painel:**
   - **Kanban** — colunas Pendente / Em andamento / Concluída, com drag-and-drop entre colunas para alterar status. Filtros por busca, repórter e programa.
   - **Calendário** — calendário mensal destacando dias com pautas; painel lateral lista as pautas do dia selecionado; botão "Nova pauta neste dia".
   - **Agenda de Contatos** — lista de contatos de entrevistados extraída das pautas existentes, com busca, contagem de pautas vinculadas e expansão para ver as pautas de cada contato.
4. **Sincronização realtime** — alterações feitas no painel principal aparecem instantaneamente no painel de produção (e vice-versa), via Supabase Realtime na tabela `pautas`, com toast de notificação ("Nova pauta", "Status alterado", "Pauta excluída").
5. **Detecção de janela aberta** — usando `BroadcastChannel` + `localStorage` heartbeat, o app principal sabe quando o painel está aberto em outra janela (preparando terreno para futuros banners de aviso).
6. **Atalhos de teclado** dentro do painel: `1/2/3` troca abas, `N` abre nova pauta.
7. **Reuso dos modais existentes** — `NewPautaDialog` e `PautaIndependenteModal` já existem no projeto e serão reutilizados para criar/editar pautas.

## Diferenças vs. o projeto fonte (adaptações)

O projeto fonte tem uma tabela `contatos_entrevistados` e um campo JSONB `entrevistados_contatos` na tabela `pautas` que **não existem neste projeto**. Adaptações:

- A **Agenda de Contatos** será derivada do campo `entrevistado` (texto livre) já presente na tabela `pautas` — extraindo nomes únicos, agregando pautas por nome, sem telefone/email persistidos. Edição de telefone/email fica fora do escopo desta primeira versão (a aba mostrará apenas nome + pautas vinculadas + repórter/produtor).
- Não será criada tabela nova de contatos — sem migrations de banco nesta entrega.
- O `NewPautaDialog` atual já não usa `entrevistados_contatos`, então nada a alterar nele.

## Layout (texto)

```text
┌──────────────────────── Painel de Produção ─────────────── [+ Nova Pauta] ┐
│ [Kanban] [Calendário] [Agenda Contatos]                                   │
├───────────────────────────────────────────────────────────────────────────┤
│ Kanban:                                                                    │
│  ┌─Pendente────┐ ┌─Em andamento─┐ ┌─Concluída───┐                          │
│  │ [PautaCard] │ │ [PautaCard]  │ │ [PautaCard] │   ← drag-and-drop       │
│  │ [PautaCard] │ │              │ │             │                          │
│  └─────────────┘ └──────────────┘ └─────────────┘                          │
└───────────────────────────────────────────────────────────────────────────┘
```

## Detalhes técnicos

**Arquivos novos:**
- `src/pages/ProducaoPanel.tsx` — página da rota `/producao`, monta tabs e modais.
- `src/components/producao/PautasKanban.tsx` — colunas + drag-and-drop nativo HTML5.
- `src/components/producao/PautasCalendar.tsx` — usa `@/components/ui/calendar` (shadcn) + `date-fns`.
- `src/components/producao/AgendaContatos.tsx` — agrega `pauta.entrevistado` em lista única.
- `src/components/producao/PautaCard.tsx` — card compacto de pauta com botões editar/PDF/excluir (usa `generatePautaPDF` já existente).
- `src/hooks/useProducaoPanelStatus.ts` — `useProducaoPanelStatus` (consumer) e `useProducaoPanelHeartbeat` (heartbeat dentro da janela do painel) via `BroadcastChannel` + `localStorage`.

**Arquivos editados:**
- `src/App.tsx` — adicionar `<Route path="/producao" element={<ProducaoPanel/>}/>` (lazy), envolto em `ProtectedRoute`.
- `src/components/sidebar/MainMenu.tsx` — novo botão "Painel de Produção" que executa `window.open('/producao', 'producao-panel', 'width=1400,height=900,...')` e fecha o menu.

**Realtime e dados:**
- `useEffect` com `supabase.channel('pautas-producao-notify').on('postgres_changes', { table: 'pautas' }, ...)` para INSERT/UPDATE/DELETE → recarrega lista + toast (sonner).
- Supressão de toast para mudanças locais (mapa `id → timestamp` com janela de 3s) para evitar notificar o próprio autor.
- Reutiliza `fetchPautas`, `updatePauta`, `deletePauta` de `src/services/pautas-api.ts` (já presentes).

**Permissões:**
- A rota usa `ProtectedRoute` (login obrigatório). Edição/criação/exclusão respeitam as RLS já existentes da tabela `pautas` (`criar_pauta`, `editar_pauta`, `excluir_pauta`).

**Sem migrations:** nenhuma alteração de schema é necessária.

