

# Sistema de Playout e GCs (replicado do projeto DEMONSTRAÇÃO TV Sucesso)

Replica o ecossistema completo de **Playout** + **GCs estruturados com autocompletar** do projeto fonte, adaptado às tabelas e permissões deste projeto.

## O que será entregue

### 1. GCs estruturados na matéria (com autocompletar)

Substitui o campo livre `gc` (texto) por uma **lista estruturada de GCs** dentro do EditPanel:

- Cada GC tem **tipo** (Crédito, Repórter, Cinegrafista, Produtor, Linha Fina, Geral), **Linha 1** e **Linha 2**.
- **Autocompletar** na Linha 1: ao digitar 2+ caracteres, busca em uma biblioteca pessoal de GCs já salvos (debounce 300ms) e mostra dropdown de sugestões — clicar preenche tipo + linha1 + linha2.
- **Botão Salvar** em cada GC (ícone marcador) que adiciona à biblioteca pessoal para reuso futuro.
- **Botões "auto-fill"**: + Repórter, + Cinegrafista, + Produtor — preenchem automaticamente a partir dos campos da matéria.
- **Drag-and-drop** para reordenar GCs dentro da matéria.
- **Contador de caracteres** para Linha Fina (20-25 verde / 35-42 verde).
- **Envio individual ao vMix** (botão Send) e **Enviar todos** com pequeno intervalo entre eles.
- **Auto-remover** com countdown configurável (3s/5s/7s/10s/15s/20s/30s) que zera os campos no vMix.
- **Atalhos F2/F3/F4** (enviar+avançar / avançar / voltar) com cursor de "próximo GC".
- **Biblioteca de GCs salvos** (modal) para gerenciar/editar/excluir o histórico pessoal de GCs.
- Os GCs ficam armazenados em `materias.gcs` (novo campo `jsonb`) e o campo de texto `gc` continua existindo para compatibilidade (gerado a partir do array para exports/teleprompter).

### 2. Biblioteca de Templates de GC (por telejornal)

Modal "Biblioteca de GC" com templates pré-configurados (ex: "Tarja Repórter Padrão"):

- CRUD de templates por telejornal (ou globais).
- Categorias: Tarja Nome, Tarja Local, Crédito, Título, Geral.
- Cada template tem N campos (label + valor). Botões: enviar ao vMix, aplicar à matéria atual.

### 3. Playout Dashboard (controle ao vivo)

Modal de tela cheia para "rodar" o telejornal:

- **Lista plana de itens** (matérias) com timecode acumulado a partir do horário do telejornal.
- **Status**: ESPERA / PRÓXIMO / NO AR (vermelho pulsante) / EXIBIDO.
- **Cronômetros**: tempo de programa, tempo restante do item atual (vermelho quando ≤5s), tempo total previsto.
- **Controles**: START / STOP / NEXT / PREVIOUS, com TAKE em qualquer item (clique ou Enter no item destacado).
- **Atalhos**: `S` start, `Espaço` stop, `D` next, `A` previous, `↑/↓` navegar, `Enter` TAKE.
- **Sincronização realtime** entre janelas/usuários via tabela `playout_status`.
- **Integração vMix opcional** (toggle): em cada TAKE envia comando para tocar o clip da matéria, prepara o próximo, e dispara triggers configurados.

### 4. Triggers de automação por matéria

Editor dentro do EditPanel (abaixo dos campos): adiciona N triggers que disparam ao TAKE / ao finalizar / com delay:

- **Tipos**: comando vMix (string `Function=...&Input=...`), GPI Out (canal), customizado (JSON livre).
- Persistidos em `playout_triggers`.

### 5. Playlist de Mídia

Modal com lista de clips/VTs prontos para ir ao ar:

- **Geração automática** a partir do espelho (extrai matérias com tipo VT/NOTA COBERTA/LINK que tenham `clip`).
- **Auto-sync**: quando ordem ou bloco de matéria muda em realtime, regenera a playlist automaticamente (com indicador "Sincronizado HH:MM:SS").
- Adição manual, status por item (Espera/Pronto/No Ar/Exibido/Erro), botão TAKE direto.

### 6. Acesso pelo cabeçalho do espelho

No `ScheduleHeader`, três novos itens (botões + entradas no dropdown):

- **Playout** (Monitor) — abre o dashboard. Desabilitado se o espelho estiver fechado.
- **Biblioteca GC** (Type) — abre a biblioteca de templates.
- **Playlist** (Film) — abre a playlist.

## Adaptações vs. projeto fonte

- **Sem failover** de vMix (tabela atual não tem `backup_vmix_host`, `failover_enabled`) — o `VmixConnectionMonitor` será simplificado para só monitorar conectividade do servidor único.
- **Sem `gc_field_mappings`** atual — adicionado como `jsonb` em `vmix_settings` com defaults para todos os tipos. Sem isso, o "enviar ao vMix" não conseguia mapear tipo → input/campo.
- **Sem `gc_graphic_templates`** (preview com fundo customizado) — feito numa fase futura. O preview do GC usa cores sólidas baseadas no tipo (já presente).
- O campo legado `materias.gc` é **mantido** e atualizado automaticamente como string concatenada dos GCs estruturados, para não quebrar exports (PDF playout, teleprompter, etc.).

## Detalhes técnicos

### Migrations (uma única migration)

**Novas tabelas:**
- `playout_status` (id, telejornal_id UNIQUE, status enum 'idle|running|paused', current_materia_id, started_at, current_item_started_at, timestamps)
- `playout_triggers` (id, materia_id, trigger_type, trigger_data jsonb, execute_at, offset_ms, ordem, timestamps)
- `playlist_items` (id, telejornal_id, materia_id nullable, titulo, clip, tipo, duracao, ordem, status, notas, created_by, timestamps)
- `gc_templates` (id, telejornal_id nullable, nome, categoria, campos jsonb, created_by, timestamps)
- `gc_saved_entries` (id, user_id, tipo, linha1, linha2, timestamps; UNIQUE(user_id, tipo, linha1, linha2))

**Novas colunas:**
- `materias.gcs jsonb DEFAULT '[]'::jsonb`
- `vmix_settings.gc_field_mappings jsonb` (default com mapeamento de cada tipo → input/campos linha1/linha2)

**RLS:** Cada tabela com policies usando `can_access_telejornal` quando aplicável; `gc_saved_entries` é por-usuário (`auth.uid() = user_id`).

**Realtime:** habilitado em `playout_status`, `playlist_items`, `playout_triggers`.

### Novos arquivos

- `src/types/playout.ts`, `src/types/playlist.ts`, `src/types/gc-templates.ts`, `src/types/gc.ts` (GCEntry)
- `src/services/playout-api.ts` (status, triggers, realtime)
- `src/services/playlist-api.ts` (CRUD + auto-generate)
- `src/services/gc-templates-api.ts`
- `src/services/gc-saved-entries-api.ts` (busca + upsert por usuário)
- `src/services/vmix-api.ts` — adiciona `executeTakeSequence` (TAKE + preload próximo + triggers)
- `src/components/playout/PlayoutDashboard.tsx`
- `src/components/playout/PlayoutTriggerEditor.tsx`
- `src/components/playout/GCTemplateLibrary.tsx`
- `src/components/playout/PlaylistPanel.tsx`
- `src/components/playout/VmixConnectionMonitor.tsx` (simplificado)
- `src/components/edit-panel/GCListEditor.tsx`
- `src/components/edit-panel/GCSavedLibraryModal.tsx`
- `src/components/playout/index.ts`

### Arquivos editados

- `src/types/index.ts` — adiciona `GCEntry` e `gcs?: GCEntry[]` em `Materia`.
- `src/components/edit-panel/EditorFormFields.tsx` — substitui textarea de GC pelo `GCListEditor`; mantém sincronização com `formData.gc` (string).
- `src/components/edit-panel/EditorTab.tsx` — adiciona `<PlayoutTriggerEditor materiaId={formData.id}/>`.
- `src/components/edit-panel/EditPanelProvider.tsx` (ou onde o `formData` é gerenciado) — propagar `onGcsChange` e serializar `gcs` no save.
- `src/services/materias-update.ts` / `materias-create.ts` — incluir `gcs` no payload.
- `src/components/news-schedule/NewsScheduleCore.tsx` — monta os 3 modais (`PlayoutDashboard`, `GCTemplateLibrary`, `PlaylistPanel`).
- `src/components/news-schedule/ScheduleHeader.tsx` — botões "Playout", "GC" e "Playlist" + entradas no dropdown.

### Permissões

Reusa as existentes; o Playout exige `currentTelejornal.espelho_aberto`. Sem novas permissões nesta entrega.

