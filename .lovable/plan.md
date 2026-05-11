## Objetivo

Permitir que a tecla `B` (além do Espaço já existente) alterne Play/Pause no Teleprompter, mantendo a posição atual de scroll — sem nunca resetar para o começo.

## Alterações

**Arquivo:** `src/hooks/useTeleprompterKeyboardControls.ts`

- No `switch (event.key)` do handler de teclado, adicionar um caso para `b`/`B` que executa `onPlayPause()`, idêntico ao caso da barra de espaço.
- Como `onPlayPause` apenas alterna `isPlaying` no `useTeleprompterWindowState` (sem mexer em `scrollPosition`), o teleprompter continua exatamente de onde parou. Nenhum reset é introduzido.
- Atualizar o overlay de ajuda em `src/pages/TeleprompterWindow.tsx` para mencionar "Espaço/B: Play/Pause".

## Detalhes técnicos

```ts
case 'b':
case 'B':
  event.preventDefault();
  onPlayPause();
  break;
```

Nada mais é alterado — o `resetPosition` permanece atrelado apenas ao botão de reset existente.
