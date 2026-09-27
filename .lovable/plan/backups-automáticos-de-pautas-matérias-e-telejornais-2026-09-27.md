# Backups automáticos de pautas, matérias e telejornais

## O que muda para você
- Hoje o backup só protege os **espelhos salvos**. Passará a proteger também **telejornais, blocos, matérias e pautas** (incluindo as arquivadas).
- **Backup automático diário** (03:00, horário de Brasília), guardado por 30 dias. Backups manuais continuam disponíveis e nunca expiram sozinhos.
- Na aba de **Backups** (administração), cada backup mostra quantos telejornais, blocos, matérias e pautas contém.
- **Restauração segura em 3 passos**: escolher o backup → escolher o que restaurar (tudo, só pautas, só um telejornal com seus blocos e matérias) → confirmar.
- Modo padrão **"Recuperar o que falta"**: só recria itens apagados, sem sobrescrever nada que existe hoje. Modo **"Voltar ao estado do backup"** sobrescreve os itens existentes com a versão do backup (exige digitar "RESTAURAR").
- Antes de qualquer restauração, o sistema cria automaticamente um backup de segurança do estado atual, para poder desfazer.
- Download do backup em arquivo (JSON) continua disponível.
- Acesso restrito a editor-chefe ou quem tem permissão de gerenciar backups.

## Detalhes técnicos
- Banco (não destrutivo): `ALTER TABLE espelhos_backup ADD COLUMN IF NOT EXISTS total_telejornais int default 0, total_pautas int default 0, scope text default 'espelhos'`. Backups antigos seguem legíveis (formato array = só espelhos).
- Novo formato de `data`: `{ version: 2, telejornais, blocos, materias, pautas, pautas_telejornal, espelhos_salvos }`.
- Edge function `backup-espelhos`:
  - POST create: coleta todas as tabelas acima com service role (paginado em lotes de 1000).
  - Aceita chamada agendada autenticada por header secreto (`BACKUP_CRON_SECRET`) além do JWT de usuário.
  - POST restore: `mode: 'merge' | 'overwrite'`, `scope: { all | pautas | telejornalIds[] }`; cria backup `pre_restore` antes; upsert em ordem telejornais → blocos → matérias → pautas → vínculos; `merge` usa `ignoreDuplicates`. Nunca apaga linhas atuais.
  - Limpeza: automáticos com mais de 30 dias.
- Agendamento via `pg_cron` + `pg_net` chamando a função diariamente (06:00 UTC), inserido via SQL de dados (URL/segredo específicos do projeto).
- `backup-api.ts` e `BackupManagementTab.tsx`: novos contadores, assistente de restauração com seleção de escopo e modo, confirmação digitada.
