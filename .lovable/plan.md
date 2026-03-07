

# Sales Kit em PDF — Exportacao do Material de Vendas

## Resumo
Criar um botao/pagina simples em `/sales` que, ao ser acessada, gera e faz download automatico de um PDF profissional com todo o material de vendas do Newsroomate, usando a biblioteca `jsPDF` ja instalada no projeto.

## Estrutura do PDF (paginas)

1. **Capa** — "Newsroomate — A redacao inteira na palma da mao." com subtitulo e data
2. **O Problema** — Lista de dores das redacoes tradicionais
3. **A Solucao** — Visao geral da plataforma integrada
4. **Funcionalidades** (2 paginas) — Cards descritivos:
   - Espelho em tempo real
   - Reporter no campo (acesso remoto, pautas pelo celular)
   - Teleprompter integrado
   - Alertas visuais de tempo (barra flutuante verde/amarelo/vermelho)
   - Dual View e drag-and-drop
   - Integracoes vMix e WhatsApp
   - Permissoes granulares e historico/snapshots
5. **Para Quem** — TVs regionais, webjornais, universidades, redacoes 4+ pessoas
6. **Diferenciais** — 100% web, qualquer dispositivo, tempo real, sem software legado
7. **Contato / CTA** — "Pronto para transformar sua redacao?" com informacoes de contato

## Implementacao Tecnica

### Arquivos a criar
1. **`src/utils/sales-kit-pdf.ts`** — Funcao `generateSalesKitPDF()` que monta o documento inteiro usando `jsPDF`, seguindo o mesmo padrao de `src/utils/pdf-utils.ts` e `TeleprompterExport.tsx`
2. **`src/pages/SalesKit.tsx`** — Pagina minima com botao "Baixar Sales Kit (PDF)" que chama a funcao acima

### Rota
- Adicionar `/sales` em `App.tsx` como rota publica (lazy loaded, fora do `ProtectedRoute`)

### Detalhes do PDF
- Formato A4 com margens de 20mm
- Titulo principal em fonte 28pt bold, subtitulos em 18pt bold
- Corpo em 12pt normal
- Separadores visuais com linhas horizontais
- Numeracao de paginas no rodape ("Pagina X de Y")
- Cores usadas via `setTextColor` para destaques (azul para titulos de secao, preto para corpo, cinza para rodape)
- Blocos de funcionalidades com titulos em bold e descricoes em texto normal, separados por espacamento
- Cada secao principal inicia em nova pagina para clareza visual
- Nome do arquivo: `newsroomate_sales_kit_YYYY-MM-DD.pdf`

### Dependencias
- Nenhuma nova — usa `jsPDF` ja instalado
- Reutiliza componentes `Button` e icones `Download` do lucide-react na pagina

