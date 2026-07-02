# Trocar funções das setas no teleprompter

## Objetivo
Inverter as funções dos atalhos de seta no teleprompter:
- **↑ / ↓** passam a navegar entre retrancas (hoje estão em ← / →)
- **← / →** passam a ajustar a velocidade de rolagem (hoje estão em ↑ / ↓)
- **Espaço / B** (play/pause) permanecem inalterados

## Alterações

### 1. `src/hooks/useTeleprompterKeyboardControls.ts`
Trocar os casos no `handleKeyDown`:
- `ArrowUp` / `ArrowDown` → chamam `goToPreviousRetranca()` / `goToNextRetranca()`
- `ArrowLeft` / `ArrowRight` → ajustam `speed` em passos de 5 (clamped 0–100)

Manter:
- `event.preventDefault()` em todas as setas
- Ignorar atalho quando foco estiver em `INPUT`, `TEXTAREA` ou `contentEditable`
- Depende de `goToPreviousRetranca`, `goToNextRetranca`, `speed`, `onSpeedChange`

### 2. `src/pages/TeleprompterWindow.tsx`
Atualizar o texto de ajuda no overlay desktop:
- De `← → Navegar retrancas` / `Espaço / B: Play/Pause`
- Para `↑ ↓ Navegar retrancas` / `← → Velocidade` / `Espaço / B: Play/Pause`

### 3. `src/components/news-schedule/Teleprompter.tsx`
Atualizar o texto de ajuda no overlay desktop:
- De `← → Navegar retrancas` / `Espaço: Play/Pause`
- Para `↑ ↓ Navegar retrancas` / `← → Velocidade` / `Espaço: Play/Pause`

## Fora de escopo
- Nenhuma outra tecla de atalho será alterada
- Limites de velocidade (0–100) e passo (5) permanecem os mesmos
- Navegação por retrancas continua filtrando apenas itens `status === 'approved'`