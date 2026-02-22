import jsPDF from 'jspdf';

export const generateSalesKitPDF = () => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 20; // margin
  const maxW = pw - m * 2;
  const lh = 7; // line height

  let y = 0;

  const resetColor = () => doc.setTextColor(0, 0, 0);
  const blueTitle = () => doc.setTextColor(0, 80, 180);
  const gray = () => doc.setTextColor(120, 120, 120);

  const heading = (text: string, size = 18) => {
    blueTitle();
    doc.setFontSize(size);
    doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(text, maxW);
    lines.forEach((line: string) => {
      doc.text(line, m, y);
      y += size * 0.45;
    });
    y += 4;
    resetColor();
  };

  const body = (text: string, size = 12) => {
    resetColor();
    doc.setFontSize(size);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, maxW);
    lines.forEach((line: string) => {
      if (y > ph - m - 10) { doc.addPage(); y = m; }
      doc.text(line, m, y);
      y += lh;
    });
    y += 2;
  };

  const bullet = (title: string, desc: string) => {
    if (y > ph - m - 20) { doc.addPage(); y = m; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    resetColor();
    doc.text(`• ${title}`, m + 5, y);
    y += lh;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(desc, maxW - 10);
    lines.forEach((line: string) => {
      if (y > ph - m - 10) { doc.addPage(); y = m; }
      doc.text(line, m + 10, y);
      y += lh;
    });
    y += 3;
  };

  const separator = () => {
    doc.setLineWidth(0.3);
    doc.setDrawColor(200, 200, 200);
    doc.line(m, y, pw - m, y);
    y += 8;
  };

  // ======== PAGE 1: CAPA ========
  y = ph * 0.3;
  blueTitle();
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text("NEWSROOMATE", pw / 2, y, { align: 'center' });
  y += 16;

  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  resetColor();
  doc.text("A redação inteira na palma da mão.", pw / 2, y, { align: 'center' });
  y += 12;

  gray();
  doc.setFontSize(12);
  doc.text("Plataforma integrada para redações jornalísticas", pw / 2, y, { align: 'center' });
  y += 8;
  doc.text("de qualquer porte.", pw / 2, y, { align: 'center' });
  y += 20;

  separator();
  y += 5;
  gray();
  doc.setFontSize(11);
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Material de Vendas — ${today}`, pw / 2, y, { align: 'center' });

  // ======== PAGE 2: O PROBLEMA ========
  doc.addPage();
  y = m + 10;
  heading("O PROBLEMA", 24);
  y += 5;

  body("As redações jornalísticas enfrentam desafios diários que comprometem a agilidade e a qualidade da produção de conteúdo:");
  y += 5;

  const problemas = [
    ["Planilhas espalhadas", "O espelho do telejornal ainda é feito em planilhas compartilhadas que travam, perdem dados e não têm controle de versão."],
    ["Comunicação informal", "Pautas e orientações circulam por WhatsApp pessoal, sem rastreabilidade e sem histórico organizado."],
    ["Teleprompter legado", "Softwares de TP exigem instalação local, licenças caras e não se integram ao espelho digital."],
    ["Falta de controle de acesso", "Qualquer pessoa pode alterar qualquer coisa, sem registro de quem fez o quê e quando."],
    ["Reporter isolado", "O repórter no campo não tem acesso fácil às pautas nem consegue enviar textos diretamente para o espelho."],
    ["Sem histórico", "Quando algo dá errado ao vivo, não há como recuperar a versão anterior do espelho de forma rápida."],
  ];

  problemas.forEach(([t, d]) => bullet(t, d));

  // ======== PAGE 3: A SOLUÇÃO ========
  doc.addPage();
  y = m + 10;
  heading("A SOLUÇÃO", 24);
  y += 5;

  body("O Newsroomate é uma plataforma 100% web que unifica todas as operações da redação em um único ambiente colaborativo e em tempo real.");
  y += 3;
  body("Desenvolvido por quem entende a rotina de uma redação, o sistema substitui planilhas, softwares legados e grupos de WhatsApp por uma interface profissional, acessível de qualquer dispositivo.");
  y += 3;
  body("Com o Newsroomate, toda a equipe — do editor-chefe ao repórter no campo — trabalha na mesma plataforma, com atualizações instantâneas, controle de permissões e histórico completo de todas as alterações.");

  y += 15;
  separator();
  y += 5;

  const pilares = [
    ["Colaboração em tempo real", "Todos veem as mesmas informações ao mesmo tempo, sem necessidade de refresh."],
    ["Acesso universal", "Funciona no navegador — desktop, tablet ou celular. Sem instalação."],
    ["Segurança e controle", "Permissões granulares por perfil e por telejornal, com auditoria completa."],
    ["Integração total", "Espelho, pautas, teleprompter, exportações e integrações técnicas em um só lugar."],
  ];

  pilares.forEach(([t, d]) => bullet(t, d));

  // ======== PAGE 4-5: FUNCIONALIDADES ========
  doc.addPage();
  y = m + 10;
  heading("FUNCIONALIDADES", 24);
  y += 5;

  const features = [
    ["Espelho em Tempo Real", "Edição colaborativa do espelho do telejornal com atualização instantânea para todos os usuários conectados. Organize blocos e matérias com drag-and-drop intuitivo. Cada alteração é propagada automaticamente — sem refresh, sem conflito."],
    ["Repórter no Campo", "O repórter acessa suas pautas e escreve textos (cabeça, off, passagem) diretamente pelo celular ou tablet, de qualquer lugar com internet. O conteúdo aparece imediatamente no espelho da redação."],
    ["Teleprompter Integrado", "Teleprompter profissional direto no navegador, sem software externo. Controle de velocidade, tamanho de fonte, cores personalizáveis e modo tela cheia. Funciona em janela independente para uso com monitor dedicado."],
    ["Alertas Visuais de Tempo", "Barra flutuante com codificação por cores (verde, amarelo, vermelho) que indica em tempo real o andamento do telejornal em relação ao tempo planejado. O editor-chefe sabe instantaneamente se o programa está adiantado ou atrasado."],
    ["Dual View e Drag-and-Drop", "Visualize dois telejornais lado a lado e transfira matérias entre eles com drag-and-drop. Ideal para redações que produzem múltiplas edições ou precisam realocar conteúdo rapidamente."],
    ["Integração vMix e WhatsApp", "Receba mensagens do público via WhatsApp, modere e envie diretamente para o GC do vMix em tempo real. Perfeito para programas ao vivo com participação da audiência."],
    ["Permissões Granulares", "Quatro perfis de acesso (Editor-chefe, Editor, Produtor, Repórter) com permissões específicas por ação e por telejornal. Controle total sobre quem pode criar, editar, excluir ou exportar conteúdo."],
    ["Histórico e Snapshots", "Salve versões do espelho (snapshots) a qualquer momento e recupere-as quando necessário. Histórico completo de alterações com log de auditoria."],
  ];

  features.forEach(([t, d]) => bullet(t, d));

  // ======== PAGE 6: PARA QUEM ========
  doc.addPage();
  y = m + 10;
  heading("PARA QUEM É O NEWSROOMATE", 24);
  y += 5;

  body("O Newsroomate foi projetado para qualquer operação jornalística que precise de organização, agilidade e colaboração:");
  y += 5;

  const publicos = [
    ["TVs Regionais e Afiliadas", "Redações com equipes enxutas que precisam de eficiência máxima. O Newsroomate substitui múltiplas ferramentas por uma plataforma unificada."],
    ["Webjornais e Portais de Notícias", "Produção de conteúdo em ritmo acelerado com equipes distribuídas. Acesso remoto e colaboração em tempo real são essenciais."],
    ["Redações Universitárias", "Laboratórios de jornalismo que precisam de ferramentas profissionais acessíveis, sem custos de licença de software legado."],
    ["Assessorias de Imprensa", "Equipes que produzem conteúdo jornalístico institucional e precisam de organização de pautas e controle de produção."],
    ["Qualquer redação com 4+ pessoas", "A partir de quatro integrantes, os ganhos de produtividade e organização do Newsroomate já são perceptíveis."],
  ];

  publicos.forEach(([t, d]) => bullet(t, d));

  // ======== PAGE 7: DIFERENCIAIS ========
  doc.addPage();
  y = m + 10;
  heading("DIFERENCIAIS", 24);
  y += 5;

  const diferenciais = [
    ["100% Web", "Não requer instalação de nenhum software. Basta abrir o navegador e acessar. Atualizações são automáticas e transparentes."],
    ["Qualquer Dispositivo", "Funciona em desktop, notebook, tablet e celular. Interface responsiva que se adapta a cada tela."],
    ["Tempo Real via Supabase", "Tecnologia de ponta com banco de dados em tempo real. Cada alteração é propagada instantaneamente para todos os usuários conectados."],
    ["Sem Software Legado", "Elimine dependências de softwares de TV proprietários, planilhas compartilhadas e ferramentas desatualizadas."],
    ["Desenvolvido por Jornalistas", "Criado a partir da experiência real em redações, com foco nas necessidades práticas do dia a dia."],
    ["Implantação Rápida", "Cadastro, configuração de telejornais e equipe prontos em minutos. Sem projeto de implantação complexo."],
  ];

  diferenciais.forEach(([t, d]) => bullet(t, d));

  // ======== PAGE 8: CTA ========
  doc.addPage();
  y = ph * 0.3;

  blueTitle();
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("Pronto para transformar", pw / 2, y, { align: 'center' });
  y += 12;
  doc.text("sua redação?", pw / 2, y, { align: 'center' });
  y += 20;

  resetColor();
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Entre em contato e agende uma demonstração gratuita.", pw / 2, y, { align: 'center' });
  y += 20;

  separator();
  y += 5;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Newsroomate", pw / 2, y, { align: 'center' });
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("contato@newsroomate.com.br", pw / 2, y, { align: 'center' });
  y += 8;
  doc.text("www.newsroomate.com.br", pw / 2, y, { align: 'center' });

  // ======== PAGE NUMBERS ========
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${totalPages}`, pw / 2, ph - 10, { align: 'center' });
  }

  // Save
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`newsroomate_sales_kit_${dateStr}.pdf`);
};
