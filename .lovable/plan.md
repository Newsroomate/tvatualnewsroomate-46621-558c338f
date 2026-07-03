# Atalhos de velocidade e fonte no teleprompter

## Novos atalhos
- **↑ / ↓** — Aumentar / diminuir velocidade de rolagem (passo de 0.5, respeitando limites atuais)
- **+ / =** — Aumentar tamanho da fonte
- **- / _** — Diminuir tamanho da fonte

Atalhos existentes (Space/B play-pause, ← / → navegação entre retrancas) permanecem inalterados.

## Comportamento
- Ignorados quando o foco estiver em `INPUT`, `TEXTAREA` ou `contentEditable` (mesma regra atual).
- `event.preventDefault()` para evitar scroll nativo da página em ↑/↓.
- Limites e passos reaproveitam a lógica já existente em `TeleprompterViewControls` (velocidade 0.5–10, passo 0.5; fonte com `increaseFontSize` / `decreaseFontSize` do `useTeleprompterWindowState`).
- Pequeno toast opcional? Não — manter silencioso, igual aos atalhos atuais.

## Detalhes técnicos
- Estender `src/hooks/useTeleprompterKeyboardControls.ts`:
  - Adicionar props opcionais: `onSpeedChange(speed:number)`, `currentSpeed:number`, `onIncreaseFontSize()`, `onDecreaseFontSize()`.
  - No `handleKeyDown`, tratar `ArrowUp`, `ArrowDown`, `+`, `=`, `-`, `_` com `preventDefault()`.
  - Clamp da velocidade entre 0.5 e 10 com passo 0.5.
- No componente que monta o hook (janela do teleprompter, `TeleprompterWindow` / `useTeleprompterWindow`), passar os handlers já existentes em `useTeleprompterWindowState` (`handleSpeedChange`, `increaseFontSize`, `decreaseFontSize`, `speed`).

## Fora de escopo
- Atalhos de fullscreen, Home/End, mirror, cores — não solicitados.
